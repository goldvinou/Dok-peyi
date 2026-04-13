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

import { handlers } from '../lib/pipeline.js';

/* ── CORS ─────────────────────────────────────────────────── */
const CORS = Object.freeze({
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Webhook-Secret, Stripe-Signature'
});

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'content-type': 'application/json' }
  });
}

/* ── Handler ──────────────────────────────────────────────── */
export default async function handler(req) {
  if (req.method === 'OPTIONS') return new Response(null, { status: 200, headers: CORS });
  if (req.method !== 'POST')   return json({ ok: false, error: 'Method not allowed' }, 405);

  /* ── 1. Parse body ── */
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

  /* ── 2. Validate shared webhook secret ──────────────────────
     Set DOK_WEBHOOK_SECRET in Vercel env vars.
     If the variable is not configured, the endpoint is open
     (acceptable for local dev, not for production). */
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
