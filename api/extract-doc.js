export const config = { runtime: 'edge' };

/* ============================================================
   DOK'PÉYI — Extract Doc  (api/extract-doc.js)
   Analyse un document PDF ou image et retourne les champs
   extraits en JSON pour pré-remplir le wizard.
   ============================================================ */

import { rateLimit } from '../lib/rate-limit.js';
import { json, CORS } from '../lib/edge-response.js';

const MODEL      = 'claude-haiku-4-5-20251001';
const MAX_TOKENS = 512;

const SYSTEM = `Tu es un extracteur de données de documents administratifs et professionnels.
Analyse le document fourni et extrais UNIQUEMENT les informations présentes.
Retourne un objet JSON strict, sans texte avant ou après. Utilise "" pour tout champ absent.`;

const PROMPT = `Extrais les informations de ce document et retourne exactement ce JSON rempli :
{
  "prenom": "",
  "nom": "",
  "email": "",
  "phone": "",
  "poste": "",
  "entreprise": "",
  "experience": "",
  "formation": "",
  "competences": "",
  "motivation": "",
  "description": "",
  "nationalite": "",
  "situation": ""
}
Retourne UNIQUEMENT le JSON, sans commentaire ni texte additionnel.`;

export default async function handler(req) {
  if (req.method === 'OPTIONS') return new Response(null, { status: 200, headers: CORS });
  if (req.method !== 'POST')   return json({ ok: false, error: 'Method not allowed' }, 405);

  const rl = rateLimit(req, { max: 5, windowMs: 60_000 });
  if (!rl.ok) return json({ ok: false, error: 'Trop de requêtes — réessayez dans une minute.' }, 429);

  const apiKey = process.env.CLAUD_API_KEY;
  if (!apiKey) return json({ ok: false, error: 'CLAUD_API_KEY manquante' }, 500);

  let body;
  try { body = await req.json(); }
  catch { return json({ ok: false, error: 'Body JSON invalide' }, 400); }

  const { file } = body || {};
  if (!file?.data || !file?.type) return json({ ok: false, error: 'Fichier manquant' }, 400);

  const base64 = file.data.includes(',') ? file.data.split(',')[1] : file.data;
  if (!base64) return json({ ok: false, error: 'Format base64 invalide' }, 400);

  const isPdf   = file.type === 'application/pdf';
  const isImage = file.type.startsWith('image/');

  /* Formats non analysables (DOC, DOCX…) — réponse vide propre */
  if (!isPdf && !isImage) {
    return json({ ok: true, extracted: {}, unanalyzable: true });
  }

  const fileBlock = isPdf
    ? { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: base64 } }
    : { type: 'image',    source: { type: 'base64', media_type: file.type,          data: base64 } };

  const upstream = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key':         apiKey,
      'anthropic-version': '2023-06-01',
      'content-type':      'application/json',
      'anthropic-beta':    'pdfs-2024-09-25'
    },
    body: JSON.stringify({
      model:      MODEL,
      max_tokens: MAX_TOKENS,
      system:     SYSTEM,
      messages:   [{ role: 'user', content: [fileBlock, { type: 'text', text: PROMPT }] }]
    })
  });

  if (!upstream.ok) {
    const t = await upstream.text();
    return json({ ok: false, error: `Anthropic ${upstream.status}: ${t.slice(0, 200)}` }, 500);
  }

  const data  = await upstream.json();
  const text  = data.content?.[0]?.text || '{}';

  let extracted = {};
  try {
    const match = text.match(/\{[\s\S]*\}/);
    if (match) extracted = JSON.parse(match[0]);
  } catch(_) {}

  return json({ ok: true, extracted });
}
