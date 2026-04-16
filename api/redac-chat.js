export const config = { runtime: 'edge' };

/* ============================================================
   DOK'PÉYI — Rédac Agent Chat  (api/redac-chat.js)
   Vercel Edge Function — assistant IA central de supervision.

   POST /api/redac-chat
   Body: { message, history[], demandes[] }

   message   : string — dernier message de l'utilisateur
   history   : tableau des messages récents du chat
               [{ userId, text }] — 10 derniers max
   demandes  : tableau des commandes platform (lu depuis localStorage)

   Rédac reçoit les vraies données de la plateforme en contexte
   et répond sur l'état des dossiers, blocages, urgences, etc.
   ============================================================ */

import { rateLimit } from '../lib/rate-limit.js';
import { json, CORS } from '../lib/edge-response.js';

const MODEL      = 'claude-haiku-4-5-20251001';
const MAX_TOKENS = 1024;
const MAX_ORDERS = 80;   // limite pour éviter le dépassement de contexte

/* ── Statuts et services lisibles ─────────────────────────── */
const SVC_LABELS = {
  cv:             'CV Professionnel',
  lettre:         'Lettre de motivation',
  courrier:       'Courrier officiel',
  dossier:        'Dossier administratif',
  sejour:         'Titre de séjour',
  impot:          "Déclaration d'impôts",
  naturalisation: 'Naturalisation'
};

const ST_LABELS = {
  submitted:       'En attente',
  en_attente:      'En attente',
  processing:      'En cours (IA)',
  en_cours:        'En cours',
  generated:       'Document généré',
  needs_review:    'À réviser',
  pending_payment: 'Paiement en attente',
  paid:            'Payé',
  delivered:       'Livré',
  terminé:         'Terminé',
  failed:          'Échoué',
  annulé:          'Annulé'
};

/* ── Sérialisation des commandes pour le contexte ─────────── */
function buildOrdersContext(demandes) {
  const orders = (demandes || []).slice(0, MAX_ORDERS);
  if (!orders.length) return 'Aucune commande en base de données.';

  /* Résumé par statut */
  const byStatus = {};
  orders.forEach(d => { byStatus[d.statut || '?'] = (byStatus[d.statut || '?'] || 0) + 1; });
  const summary = Object.entries(byStatus)
    .map(([st, n]) => `  ${ST_LABELS[st] || st} : ${n}`)
    .join('\n');

  /* Ligne par commande */
  const lines = orders.map(d => {
    const svc   = SVC_LABELS[d.service] || d.service || '?';
    const st    = ST_LABELS[d.statut]   || d.statut  || '?';
    const nom   = [d.prenom, d.nom].filter(Boolean).join(' ') || d.email || '—';
    const pipe  = Array.isArray(d._pipeline) ? d._pipeline : [];
    const last  = pipe.length ? pipe[pipe.length - 1] : null;
    const step  = last ? ` | pipeline: ${last.status} le ${(last.ts || '').slice(0, 10)}` : '';
    const owner = d.assignedTo ? ` | assigné: ${d.assignedTo}` : '';
    const date  = d.date ? ` | créé: ${String(d.date).slice(0, 10)}` : '';
    return `#${d.id} | ${svc} | ${nom} | ${d.email || '—'} | ${d.montant ?? '?'}€ | ${st}${step}${owner}${date}`;
  }).join('\n');

  return `Résumé :\n${summary}\n\nDétail (format : #ID | service | client | email | montant | statut | pipeline) :\n${lines}`;
}

/* ── System prompt Rédac ──────────────────────────────────── */
function buildSystemPrompt(demandes) {
  const now = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long',
    year: 'numeric', hour: '2-digit', minute: '2-digit'
  });
  const total = (demandes || []).length;
  const ctx   = buildOrdersContext(demandes);

  return `Tu es Rédac, agent IA central de Dok'péyi. Tu es un membre spécial de l'équipe — pas un humain, mais un assistant système de supervision et de coordination.

RÔLE
• Superviser et résumer l'état des dossiers clients en temps réel
• Identifier les blocages, retards, paiements en attente, urgences
• Proposer les prochaines actions concrètes à l'équipe
• Aider à rédiger, corriger ou améliorer des documents
• Répondre avec précision à partir des données réelles de la plateforme

PERMISSIONS
✅ Lecture, analyse, résumé, suggestions d'actions, aide rédactionnelle
❌ Suppression de données, modification de rôles utilisateurs, validation de paiements, actions irréversibles — refuser poliment si demandé

━━━ DONNÉES PLATEFORME — ${now} ━━━
Total commandes en base : ${total}${total > MAX_ORDERS ? ` (${MAX_ORDERS} plus récentes affichées)` : ''}

${ctx}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

COMPORTEMENT
• Réponses courtes et actionnables (5–15 lignes maximum)
• Toujours citer les vrais IDs (#NNN), noms et statuts exacts
• Utiliser des listes numérotées ou à puces pour plusieurs dossiers
• Ne jamais inventer de données absentes du contexte ci-dessus
• Indiquer explicitement quand une action humaine est requise
• Répondre en français, ton professionnel et direct`;
}

/* ── Handler ──────────────────────────────────────────────── */
export default async function handler(req) {
  if (req.method === 'OPTIONS') return new Response(null, { status: 200, headers: CORS });
  if (req.method !== 'POST')   return json({ ok: false, error: 'Method not allowed' }, 405);

  const rl = rateLimit(req, { max: 10, windowMs: 60_000 });
  if (!rl.ok) return json({ ok: false, error: 'Trop de requêtes — réessayez dans une minute.' }, 429);

  const apiKey = process.env.CLAUD_API_KEY;
  if (!apiKey) return json({ ok: false, error: 'CLAUD_API_KEY non configurée' }, 500);

  let body;
  try { body = await req.json(); }
  catch { return json({ ok: false, error: 'Body JSON invalide' }, 400); }

  const { message, history = [], demandes = [] } = body || {};

  if (!message || typeof message !== 'string' || !message.trim())
    return json({ ok: false, error: 'Champ message manquant' }, 400);
  if (message.length > 4000)
    return json({ ok: false, error: 'Message trop long (max 4000 caractères)' }, 400);

  /* Construire l'historique conversationnel pour Claude */
  const messages = [
    ...history.slice(-10).map(m => ({
      role:    m.userId === 'redac' ? 'assistant' : 'user',
      content: String(m.text || '…').slice(0, 2000)
    })),
    { role: 'user', content: message.trim() }
  ];

  const upstream = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key':         apiKey,
      'anthropic-version': '2023-06-01',
      'content-type':      'application/json'
    },
    body: JSON.stringify({
      model:      MODEL,
      max_tokens: MAX_TOKENS,
      system:     buildSystemPrompt(demandes),
      messages
    })
  });

  if (!upstream.ok) {
    const t = await upstream.text();
    return json({ ok: false, error: `Anthropic ${upstream.status}: ${t.slice(0, 200)}` }, 500);
  }

  const data  = await upstream.json();
  const reply = data.content?.[0]?.text || '';
  if (!reply) return json({ ok: false, error: 'Réponse vide' }, 500);

  return json({ ok: true, reply });
}
