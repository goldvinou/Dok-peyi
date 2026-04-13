/* ============================================================
   DOK'PÉYI — Pipeline API  (api/pipeline.js)
   Vercel Edge Function — single entry point for all order
   lifecycle transitions.

   POST /api/pipeline
   Body: { action, order, payload? }

   Actions
   ───────
   generate         — submitted → processing → generated
                      payload: { prompt: string, systemPrompt?: string }

   confirm_payment  — pending_payment → paid → delivered
                      payload: {} (payment provider stub — no fields yet)

   fail             — any → failed (forced)
                      payload: { reason?: string }

   Response: { ok: boolean, order: object, error?: string }
   ============================================================ */

export const config = { runtime: 'edge' };

import { handlers } from '../lib/pipeline.js';

/* ── CORS headers ─────────────────────────────────────────── */
const CORS = Object.freeze({
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
});

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'content-type': 'application/json' }
  });
}

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
      if (!payload.prompt) return json({ ok: false, error: 'payload.prompt requis' }, 400);
      if (!apiKey)         return json({ ok: false, error: 'CLAUD_API_KEY non configurée' }, 500);

      result = await handlers.generate(order, {
        prompt:       payload.prompt,
        apiKey,
        systemPrompt: payload.systemPrompt || ''
      });
      break;
    }

    /* ── confirm_payment ── */
    case 'confirm_payment': {
      // Payment provider not wired yet — transitions straight to delivered.
      result = await handlers.confirm_payment(order, payload);
      break;
    }

    /* ── fail ── */
    case 'fail': {
      result = await handlers.fail(order, { reason: payload.reason });
      break;
    }

    default:
      return json({ ok: false, error: `Action inconnue : ${action}` }, 400);
  }

  return json(result, result.ok ? 200 : 500);
}
