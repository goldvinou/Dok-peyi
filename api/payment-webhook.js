/* ============================================================
   DOK'PÉYI — Payment Webhook  (api/payment-webhook.js)
   Vercel Edge Function — receives payment confirmation callbacks
   from external payment providers.

   POST /api/payment-webhook
   Body: { secret, order, provider?, reference?, amount? }

   This endpoint is the integration point for any payment provider.
   It validates the request, then calls handlers.confirm_payment()
   to advance the order from pending_payment → paid.

   The client (admin or service.js) must supply the full current
   order object — same stateless pattern as /api/pipeline.

   Provider stubs
   ──────────────
   manual  — direct admin confirmation (no external provider)
   stripe  — wire Stripe-Signature header verification
   paypal  — wire PayPal webhook signature
   momo    — MTN Mobile Money (Guyane / Caraïbes)
   lydia   — Lydia / Sumeria (France)

   Environment variables required
   ───────────────────────────────
   DOK_WEBHOOK_SECRET   — shared secret to authenticate callers
                          (set in Vercel project settings)
   STRIPE_WEBHOOK_SECRET — (optional) Stripe webhook signing secret
   MOMO_CALLBACK_TOKEN   — (optional) MTN MoMo callback token

   Response: { ok: boolean, order?: object, error?: string }
   ============================================================ */

export const config = { runtime: 'edge' };

import { handlers }            from '../lib/pipeline.js';
import { json, CORS as _CORS } from '../lib/edge-response.js';

/* ── Extended CORS for webhook endpoints (extra allowed headers) ── */
const CORS = Object.freeze({
  ..._CORS,
  'Access-Control-Allow-Headers': 'Content-Type, X-Webhook-Secret, Stripe-Signature'
});

/* ── Handler ──────────────────────────────────────────────── */
export default async function handler(req) {
  if (req.method === 'OPTIONS') return new Response(null, { status: 200, headers: CORS });
  if (req.method !== 'POST')   return json({ ok: false, error: 'Method not allowed' }, 405);

  const stripeSignature = req.headers.get('stripe-signature');

  /* ── Stripe webhook direct ─────────────────────────────────
     Stripe envoie stripe-signature header + body brut en texte.
     On doit lire le body AVANT tout JSON.parse. */
  if (stripeSignature) {
    const rawBody = await req.text();
    const sigSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (sigSecret) {
      const valid = await verifyStripeSignature(rawBody, stripeSignature, sigSecret);
      if (!valid) return json({ ok: false, error: 'Stripe signature invalide' }, 400);
    }

    let event;
    try { event = JSON.parse(rawBody); } catch { return json({ ok: false, error: 'JSON invalide' }, 400); }

    if (event.type === 'checkout.session.completed') {
      /* ── Idempotence : rejeter les events déjà traités ── */
      const alreadyDone = await isEventProcessed(event.id);
      if (alreadyDone) return json({ ok: true, idempotent: true });

      const session  = event.data.object;
      const orderId  = session.metadata?.order_id;
      const amount   = (session.amount_total || 0) / 100;
      const ref      = session.payment_intent;

      /* Marquer l'event comme traité AVANT les side-effects
         (si les appels suivants échouent, Stripe retente → on retraite,
         mais c'est plus sûr que de marquer après une mise à jour partielle) */
      await markEventProcessed(event.id);

      /* Mettre à jour Firebase directement */
      await updateFirebaseOrderPaid(orderId, { amount, reference: ref, provider: 'stripe' });

      /* Notifier l'admin par email */
      await notifyAdmin(orderId, session);
    }

    return json({ ok: true });
  }

  /* ── Appel interne (admin manuel / autres providers) ─── */
  let body;
  try { body = await req.json(); }
  catch { return json({ ok: false, error: 'Body JSON invalide' }, 400); }

  const {
    secret,
    order,
    provider  = 'manual',
    reference = null,
    amount
  } = body || {};

  /* Valider le secret partagé pour les appels internes */
  const webhookSecret = process.env.DOK_WEBHOOK_SECRET;
  if (webhookSecret && secret !== webhookSecret) {
    return json({ ok: false, error: 'Secret invalide — accès refusé.' }, 403);
  }

  if (!order) return json({ ok: false, error: 'Champ order manquant.' }, 400);

  /* ── 3. Provider-specific signature verification ─────────────
     Uncomment and implement when connecting a real provider.

     ▸ STRIPE
       const rawBody = await req.text(); // must read before JSON.parse above
       const sig = req.headers.get('stripe-signature');
       try {
         await stripe.webhooks.constructEventAsync(
           rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET
         );
       } catch (err) {
         return json({ ok: false, error: 'Stripe signature invalide' }, 400);
       }

     ▸ PAYPAL
       // Verify PayPal-Transmission-Sig header using PayPal SDK or HMAC

     ▸ MTN MOBILE MONEY (MoMo)
       const token = req.headers.get('x-callback-token');
       if (token !== process.env.MOMO_CALLBACK_TOKEN)
         return json({ ok: false, error: 'MoMo token invalide' }, 403);

     ▸ LYDIA / SUMERIA
       // Verify HMAC-SHA256 signature of the request body
  */

  /* ── 4. Confirm payment via pipeline handler ── */
  const result = await handlers.confirm_payment(order, { provider, reference, amount });

  return json(result, result.ok ? 200 : 400);
}

/* ── Vérification signature Stripe (HMAC-SHA256) ───────────── */
async function verifyStripeSignature(payload, header, secret) {
  try {
    const parts     = Object.fromEntries(header.split(',').map(p => p.split('=')));
    const timestamp = parts.t;
    const sig       = parts.v1;
    if (!timestamp || !sig) return false;

    const signed    = timestamp + '.' + payload;
    const key       = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret),
                        { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const mac       = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(signed));
    const computed  = Array.from(new Uint8Array(mac)).map(b => b.toString(16).padStart(2,'0')).join('');
    return computed === sig;
  } catch(_) { return false; }
}

/* ── Idempotence : check + mark via Firebase REST ─────────── */
async function isEventProcessed(eventId) {
  const dbUrl = process.env.FIREBASE_DATABASE_URL;
  if (!dbUrl || !eventId) return false;
  try {
    const res = await fetch(dbUrl + '/dok-peyi/processed-events/' + eventId + '.json');
    const val = await res.json();
    return val !== null;
  } catch(_) { return false; }
}

async function markEventProcessed(eventId) {
  const dbUrl = process.env.FIREBASE_DATABASE_URL;
  if (!dbUrl || !eventId) return;
  try {
    await fetch(dbUrl + '/dok-peyi/processed-events/' + eventId + '.json', {
      method:  'PUT',
      headers: { 'content-type': 'application/json' },
      body:    JSON.stringify({ ts: Date.now() })
    });
  } catch(_) {}
}

/* ── Mise à jour Firebase via l'API REST (Edge-compatible) ─── */
async function updateFirebaseOrderPaid(orderId, { amount, reference, provider }) {
  if (!orderId) return;
  const dbUrl = process.env.FIREBASE_DATABASE_URL;
  if (!dbUrl) return;
  try {
    await fetch(dbUrl + '/dok-peyi/demandes/' + orderId + '.json', {
      method:  'PATCH',
      headers: { 'content-type': 'application/json' },
      body:    JSON.stringify({ paid: true, statut: 'paid', montant: amount, reference, provider })
    });
  } catch(_) {}
}

/* ── Notification admin par email ─────────────────────────── */
async function notifyAdmin(orderId, session) {
  try {
    const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL || '').replace(/\/$/, '');
    await fetch(baseUrl + '/api/send-email', {
      method:  'POST',
      headers: { 'content-type': 'application/json' },
      body:    JSON.stringify({
        type:  'new_order_admin',
        order: {
          id:      orderId,
          email:   session.customer_email || '',
          montant: (session.amount_total || 0) / 100
        }
      })
    });
  } catch(_) {}
}
