export const config = { runtime: 'edge' };

/* ============================================================
   DOK'PÉYI — Stripe Checkout  (api/create-checkout.js)
   Env vars requises :
     STRIPE_SECRET_KEY   — sk_live_... ou sk_test_...
     NEXT_PUBLIC_BASE_URL — https://dok-peyi.vercel.app (sans slash final)
   ============================================================ */

import { rateLimit } from '../lib/rate-limit.js';

const SERVICE_LABELS = {
  cv:             'CV Professionnel',
  lettre:         'Lettre de motivation',
  courrier:       'Courrier officiel',
  dossier:        'Dossier administratif',
  sejour:         'Titre de séjour',
  impot:          "Déclaration d'impôts",
  naturalisation: 'Naturalisation'
};

export default async function handler(req) {
  if (req.method !== 'POST') {
    return resp({ ok: false, error: 'Method not allowed' }, 405);
  }

  /* Limit Stripe session creation — prevents abuse of paid Stripe API */
  const rl = rateLimit(req, { max: 3, windowMs: 60_000 });
  if (!rl.ok) return resp({ ok: false, error: 'Trop de requêtes — réessayez dans une minute.' }, 429);

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) return resp({ ok: false, error: 'Stripe non configuré' }, 503);

  let body;
  try { body = await req.json(); } catch (_) { return resp({ ok: false, error: 'JSON invalide' }, 400); }

  const { service, amount, orderId, email, nom, prenom } = body || {};
  if (!service || !amount || !orderId) {
    return resp({ ok: false, error: 'service, amount et orderId requis' }, 400);
  }

  const baseUrl    = (process.env.NEXT_PUBLIC_BASE_URL || '').replace(/\/$/, '') || 'https://dok-peyi.vercel.app';
  const svcLabel   = SERVICE_LABELS[service] || service;
  const amountCents = Math.round(parseFloat(amount) * 100);

  /* ── Créer la session Stripe Checkout ── */
  const payload = {
    mode: 'payment',
    line_items: [{
      quantity: 1,
      price_data: {
        currency:     'eur',
        unit_amount:  amountCents,
        product_data: {
          name:        svcLabel + ' — Dok\'péyi',
          description: 'Document administratif généré et vérifié par Dok\'péyi'
        }
      }
    }],
    success_url: baseUrl + '/service?success=1&order_id=' + encodeURIComponent(orderId),
    cancel_url:  baseUrl + '/service?s=' + encodeURIComponent(service) + '&cancelled=1',
    metadata: { order_id: String(orderId), service }
  };

  /* Pré-remplir l'email client si disponible */
  if (email) payload.customer_email = email;

  /* Libellé sur le relevé bancaire */
  payload.payment_intent_data = {
    description:    'Dok\'péyi — ' + svcLabel,
    statement_descriptor_suffix: 'DOKPEYI'
  };

  const res = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method:  'POST',
    headers: {
      'Authorization': 'Bearer ' + stripeKey,
      'Content-Type':  'application/x-www-form-urlencoded'
    },
    body: toFormData(payload)
  });

  const data = await res.json();
  if (!res.ok) return resp({ ok: false, error: data.error?.message || 'Erreur Stripe' }, 500);

  return resp({ ok: true, url: data.url, sessionId: data.id });
}

/* ── Sérialiser un objet en form-urlencoded (Stripe l'exige) ── */
function toFormData(obj, prefix = '') {
  const parts = [];
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? prefix + '[' + k + ']' : k;
    if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
      parts.push(toFormData(v, key));
    } else if (Array.isArray(v)) {
      v.forEach((item, i) => {
        if (typeof item === 'object') parts.push(toFormData(item, key + '[' + i + ']'));
        else parts.push(encodeURIComponent(key + '[' + i + ']') + '=' + encodeURIComponent(item));
      });
    } else {
      parts.push(encodeURIComponent(key) + '=' + encodeURIComponent(v));
    }
  }
  return parts.join('&');
}

function resp(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
}
