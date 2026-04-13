/* ============================================================
   DOK'PÉYI — Pipeline API  (api/pipeline.js)
   Vercel Edge Function — single entry point for all order
   lifecycle transitions.

   POST /api/pipeline
   Body: { action, order, payload? }

   Actions
   ───────
   generate         — submitted → processing → generated → pending_payment
                      (or → needs_review if review required)
                      payload: { prompt?: string }

   confirm_payment  — pending_payment → paid
                      Unlocks final document. Does NOT deliver automatically.
                      payload: { provider?, reference?, amount? }
                        provider  : 'manual' | 'stripe' | 'paypal' | 'momo' | 'lydia'
                        reference : provider transaction id
                        amount    : amount charged (fallback to order.montant)
                      See also: POST /api/payment-webhook (provider callbacks)

   deliver          — paid → delivered  OR  needs_review → delivered
                      Server-side guard: rejects if payment was never confirmed.
                      payload: {}

   fail             — any → failed (forced)
                      payload: { reason?: string }

   get_document     — retrieve preview or final document
                      payload: { type: 'preview' | 'final' }
                      Access control enforced by lib/documents.js:
                        preview → order.statut ∈ {generated, pending_payment, paid, needs_review, delivered}
                        final   → order.statut ∈ {paid, needs_review, delivered}

   Response: { ok: boolean, order?: object, html?: string, error?: string }
   ============================================================ */

export const config = { runtime: 'edge' };

import { handlers }     from '../lib/pipeline.js';
import { getDocument }  from '../lib/documents.js';
import { json, CORS }   from '../lib/edge-response.js';

/* ── Handler ──────────────────────────────────────────────── */
export default async function handler(req) {
  /* Pre-flight */
  if (req.method === 'OPTIONS') return new Response(null, { status: 200, headers: CORS });
  if (req.method !== 'POST')   return json({ ok: false, error: 'Method not allowed' }, 405);

  /* API key — required for AI stage */
  const apiKey = process.env.CLAUD_API_KEY;

  /* Parse body */
  let body;
  try { body = await req.json(); }
  catch { return json({ ok: false, error: 'Body JSON invalide' }, 400); }

  const { action, order, payload = {} } = body || {};

  if (!action) return json({ ok: false, error: 'Champ action manquant' }, 400);
  if (!order)  return json({ ok: false, error: 'Champ order manquant'  }, 400);

  /* Dispatch */
  let result;

  switch (action) {

    /* ── generate ── */
    case 'generate': {
      if (!apiKey) return json({ ok: false, error: 'CLAUD_API_KEY non configurée' }, 500);

      result = await handlers.generate(order, {
        apiKey,
        // Optional: caller-supplied prompt overrides the server-side builder.
        // If omitted, content.js builds the prompt from order.service + order.details.
        promptOverride: payload.prompt || ''
      });
      break;
    }

    /* ── confirm_payment ── */
    case 'confirm_payment': {
      result = await handlers.confirm_payment(order, {
        provider:  payload.provider  || 'manual',
        reference: payload.reference || null,
        amount:    payload.amount    != null ? payload.amount : undefined
      });
      break;
    }

    /* ── deliver ── */
    case 'deliver': {
      result = await handlers.deliver(order);
      break;
    }

    /* ── fail ── */
    case 'fail': {
      result = await handlers.fail(order, { reason: payload.reason });
      break;
    }

    /* ── get_document ── */
    case 'get_document': {
      const type = payload.type;
      if (!type || !['preview', 'final'].includes(type)) {
        return json({ ok: false, error: 'payload.type requis : "preview" ou "final"' }, 400);
      }
      // getDocument enforces status-based access control
      result = getDocument(order, type);
      // Return 403 when access is denied (wrong status), 200 otherwise
      return json(result, result.ok ? 200 : 403);
    }

    default:
      return json({ ok: false, error: `Action inconnue : ${action}` }, 400);
  }

  return json(result, result.ok ? 200 : 500);
}
