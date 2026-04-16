export const config = { runtime: 'edge' };

/* ============================================================
   DOK'PÉYI — Email transactionnel  (api/send-email.js)
   Env var requise : RESEND_API_KEY
   Env var optionnelle : EMAIL_FROM (défaut : noreply@dok-peyi.fr)
                         EMAIL_ADMIN (défaut : contact@dok-peyi.fr)
   ============================================================ */

import { rateLimit } from '../lib/rate-limit.js';

const FROM     = () => process.env.EMAIL_FROM  || 'Dok\'péyi <noreply@dok-peyi.fr>';
const ADMIN_TO = () => process.env.EMAIL_ADMIN || 'contact@dok-peyi.fr';

export default async function handler(req) {
  if (req.method !== 'POST') {
    return resp({ ok: false, error: 'Method not allowed' }, 405);
  }

  const rl = rateLimit(req, { max: 10, windowMs: 60_000 });
  if (!rl.ok) return resp({ ok: false, error: 'Trop de requêtes — réessayez dans une minute.' }, 429);

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return resp({ ok: false, error: 'Email non configuré (RESEND_API_KEY manquant)' }, 503);

  let body;
  try { body = await req.json(); } catch (_) { return resp({ ok: false, error: 'JSON invalide' }, 400); }

  const { type, order } = body || {};
  if (!type || !order) return resp({ ok: false, error: 'Champs type et order requis' }, 400);

  let email;
  try {
    email = buildEmail(type, order);
  } catch (err) {
    return resp({ ok: false, error: err.message }, 400);
  }

  const res = await fetch('https://api.resend.com/emails', {
    method:  'POST',
    headers: { 'Authorization': 'Bearer ' + apiKey, 'Content-Type': 'application/json' },
    body:    JSON.stringify(email)
  });

  const data = await res.json();
  if (!res.ok) return resp({ ok: false, error: data.message || 'Erreur Resend' }, 500);

  return resp({ ok: true, id: data.id });
}

/* ── Construction des emails ───────────────────────────────── */
function buildEmail(type, order) {
  const prenom = order.prenom || order.nom || 'Client';
  const email  = order.email;
  const svc    = SERVICE_LABELS[order.service] || order.service || 'document';
  const montant = (order.montant || 0) + '€';

  if (!email && type !== 'new_order_admin') throw new Error('Email client manquant');

  switch (type) {

    /* ── Confirmation de commande (envoyée au client après paiement) ── */
    case 'order_confirmation':
      return {
        from:    FROM(),
        to:      [email],
        subject: 'Confirmation de commande — Dok\'péyi',
        html:    html_confirmation(prenom, svc, montant, order)
      };

    /* ── Nouvelle commande (notification interne pour l'admin) ── */
    case 'new_order_admin':
      return {
        from:    FROM(),
        to:      [ADMIN_TO()],
        subject: `Nouvelle commande #${order.id} — ${svc}`,
        html:    html_admin_notif(order, svc, montant)
      };

    /* ── Livraison du document (envoyée au client par l'admin) ── */
    case 'document_delivered':
      return {
        from:    FROM(),
        to:      [email],
        subject: 'Votre document est prêt — Dok\'péyi',
        html:    html_delivery(prenom, svc, order)
      };

    default:
      throw new Error('Type email inconnu : ' + type);
  }
}

/* ── Templates HTML ───────────────────────────────────────── */
const BRAND = '#2563eb';
const BASE  = `<div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,.08)">`;
const FOOTER = `<div style="background:#f8fafc;padding:20px 32px;text-align:center;font-size:.75rem;color:#94a3b8;border-top:1px solid #e2e8f0">
  <strong style="color:#334155">Dok'péyi</strong> — Service d'aide administrative en Guyane<br>
  Ce service ne remplace pas un professionnel du droit. <a href="https://dok-peyi.vercel.app/legales" style="color:${BRAND}">Mentions légales</a>
</div></div>`;

function html_header(title) {
  return `${BASE}<div style="background:${BRAND};padding:32px;text-align:center">
    <div style="font-size:2rem;margin-bottom:8px">📄</div>
    <h1 style="color:#fff;font-size:1.25rem;font-weight:700;margin:0">Dok'péyi</h1>
    <p style="color:rgba(255,255,255,.75);font-size:.85rem;margin:6px 0 0">${esc(title)}</p>
  </div><div style="padding:32px">`;
}

function html_confirmation(prenom, svc, montant, order) {
  return html_header('Confirmation de commande')
    + `<p style="font-size:1rem;color:#0f172a;margin:0 0 20px">Bonjour <strong>${esc(prenom)}</strong>,</p>
    <p style="color:#475569;line-height:1.6;margin:0 0 24px">
      Merci pour votre commande ! Votre paiement de <strong>${esc(montant)}</strong> a bien été reçu.
      Notre équipe prépare votre <strong>${esc(svc)}</strong> et vous le livrera dans les meilleurs délais.
    </p>
    ${order_summary(order, svc, montant)}
    <p style="color:#64748b;font-size:.85rem;margin:24px 0 0;line-height:1.6">
      Vous recevrez votre document par email dès qu'il sera finalisé.<br>
      Des questions ? Contactez-nous : <a href="mailto:${esc(ADMIN_TO())}" style="color:${BRAND}">${esc(ADMIN_TO())}</a>
    </p>
    </div>${FOOTER}`;
}

function html_admin_notif(order, svc, montant) {
  const prenom = order.prenom || '—';
  const nom    = order.nom    || '—';
  return html_header('Nouvelle commande reçue')
    + `<p style="font-size:1rem;color:#0f172a;margin:0 0 16px">
      Une nouvelle commande vient d'être enregistrée.
    </p>
    ${order_summary(order, svc, montant)}
    <div style="margin-top:24px;padding:16px;background:#f0fdf4;border-radius:8px;border-left:4px solid #22c55e">
      <strong style="color:#166534">Client :</strong> ${esc(prenom)} ${esc(nom)}<br>
      <strong style="color:#166534">Email :</strong> ${esc(order.email || '—')}<br>
      <strong style="color:#166534">WhatsApp :</strong> ${esc(order.whatsapp || '—')}
    </div>
    <div style="margin-top:20px;text-align:center">
      <a href="https://dok-peyi.vercel.app/admin/" style="display:inline-block;background:${BRAND};color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:700;font-size:.9rem">
        Ouvrir le panneau admin →
      </a>
    </div>
    </div>${FOOTER}`;
}

function html_delivery(prenom, svc, order) {
  return html_header('Votre document est prêt !')
    + `<p style="font-size:1rem;color:#0f172a;margin:0 0 20px">Bonjour <strong>${esc(prenom)}</strong>,</p>
    <p style="color:#475569;line-height:1.6;margin:0 0 24px">
      Bonne nouvelle ! Votre <strong>${esc(svc)}</strong> a été finalisé et vérifié par notre équipe.
      Il est maintenant disponible en téléchargement.
    </p>
    <div style="background:#f0fdf4;border-radius:10px;padding:20px;border-left:4px solid #22c55e;margin-bottom:24px">
      <div style="font-size:1.5rem;margin-bottom:8px">✅</div>
      <strong style="color:#166534">Document livré</strong><br>
      <span style="color:#475569;font-size:.88rem">Référence commande : #${esc(String(order.id || ''))}</span>
    </div>
    ${order.downloadUrl ? `<div style="text-align:center;margin-bottom:24px">
      <a href="${esc(order.downloadUrl)}" style="display:inline-block;background:${BRAND};color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:700">
        ⬇ Télécharger mon document
      </a>
    </div>` : ''}
    <p style="color:#64748b;font-size:.82rem;line-height:1.6">
      Si vous avez des questions ou souhaitez des modifications, contactez-nous :<br>
      <a href="mailto:${esc(ADMIN_TO())}" style="color:${BRAND}">${esc(ADMIN_TO())}</a>
    </p>
    </div>${FOOTER}`;
}

function order_summary(order, svc, montant) {
  return `<table style="width:100%;border-collapse:collapse;margin:0 0 8px">
    <tr><td style="padding:8px 0;color:#64748b;font-size:.88rem;border-bottom:1px solid #f1f5f9">Service</td>
        <td style="padding:8px 0;font-weight:600;text-align:right;border-bottom:1px solid #f1f5f9">${esc(svc)}</td></tr>
    <tr><td style="padding:8px 0;color:#64748b;font-size:.88rem;border-bottom:1px solid #f1f5f9">Référence</td>
        <td style="padding:8px 0;font-weight:600;text-align:right;border-bottom:1px solid #f1f5f9">#${esc(String(order.id || ''))}</td></tr>
    <tr><td style="padding:10px 0;color:#0f172a;font-weight:700">Total payé</td>
        <td style="padding:10px 0;font-weight:800;color:${BRAND};text-align:right;font-size:1.1rem">${esc(montant)}</td></tr>
  </table>`;
}

/* ── Helpers ── */
const SERVICE_LABELS = {
  cv: 'CV Professionnel', lettre: 'Lettre de motivation',
  courrier: 'Courrier officiel', dossier: 'Dossier administratif',
  sejour: 'Titre de séjour', impot: 'Déclaration d\'impôts',
  naturalisation: 'Naturalisation'
};

function esc(str) {
  return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function resp(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
}
