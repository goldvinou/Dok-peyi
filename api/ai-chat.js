/* ============================================================
   DOK'PÉYI — AI Chat  (api/ai-chat.js)
   Vercel Edge Function — workspace AI assistant proxy.

   POST /api/ai-chat
   Body: { service, prompt, history? }

   service  : 'claude' (Anthropic) | 'gpt' (OpenAI)
   prompt   : string — latest user message
   history  : array of { role: 'user'|'assistant', content: string }
               (last 10 entries used for context)

   Response : { ok: boolean, reply?: string, error?: string }

   Environment variables
   ─────────────────────
   CLAUD_API_KEY   — Anthropic API key (Claude)
   OPENAI_API_KEY  — OpenAI API key    (ChatGPT)
   ============================================================ */

export const config = { runtime: 'edge' };

import { json, CORS } from '../lib/edge-response.js';

export default async function handler(req) {
  if (req.method === 'OPTIONS') return new Response(null, { status: 200, headers: CORS });
  if (req.method !== 'POST')   return json({ ok: false, error: 'Method not allowed' }, 405);

  let body;
  try { body = await req.json(); }
  catch { return json({ ok: false, error: 'Body JSON invalide' }, 400); }

  const { service = 'claude', prompt, history = [] } = body || {};

  if (!prompt || typeof prompt !== 'string' || !prompt.trim())
    return json({ ok: false, error: 'Champ prompt manquant ou invalide' }, 400);
  if (prompt.length > 8000)
    return json({ ok: false, error: 'Prompt trop long (max 8 000 caractères)' }, 400);
  if (!Array.isArray(history))
    return json({ ok: false, error: 'history doit être un tableau' }, 400);

  // Sanitise history: keep last 10 turns, valid roles only, max 2000 chars per message
  const ctx = history
    .filter(m => (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
    .slice(-10)
    .map(m => ({ role: m.role, content: m.content.slice(0, 2000) }));

  /* ── Claude (Anthropic) ──────────────────────────────────── */
  if (service === 'claude') {
    const apiKey = process.env.CLAUD_API_KEY;
    if (!apiKey) return json({ ok: false, error: 'CLAUD_API_KEY non configurée sur le serveur' }, 500);

    const messages = [...ctx, { role: 'user', content: prompt }];

    let res;
    try {
      res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key':         apiKey,
          'anthropic-version': '2023-06-01',
          'content-type':      'application/json'
        },
        body: JSON.stringify({
          model:      'claude-haiku-4-5-20251001',
          max_tokens: 2048,
          messages
        })
      });
    } catch (err) {
      return json({ ok: false, error: 'Erreur réseau Anthropic : ' + err.message }, 500);
    }

    if (!res.ok) {
      const text = await res.text();
      return json({ ok: false, error: `Anthropic ${res.status} : ${text.slice(0, 200)}` }, 500);
    }

    const data  = await res.json();
    const reply = data.content?.[0]?.text || '';
    return json({ ok: true, reply });
  }

  /* ── ChatGPT (OpenAI) ────────────────────────────────────── */
  if (service === 'gpt') {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return json({ ok: false, error: 'OPENAI_API_KEY non configurée sur le serveur' }, 500);

    const messages = [
      { role: 'system', content: 'Tu es un assistant professionnel utile et concis, spécialisé dans les démarches administratives et le travail en équipe.' },
      ...ctx,
      { role: 'user', content: prompt }
    ];

    let res;
    try {
      res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'content-type':  'application/json'
        },
        body: JSON.stringify({
          model:      'gpt-4o-mini',
          max_tokens: 2048,
          messages
        })
      });
    } catch (err) {
      return json({ ok: false, error: 'Erreur réseau OpenAI : ' + err.message }, 500);
    }

    if (!res.ok) {
      const text = await res.text();
      return json({ ok: false, error: `OpenAI ${res.status} : ${text.slice(0, 200)}` }, 500);
    }

    const data  = await res.json();
    const reply = data.choices?.[0]?.message?.content || '';
    return json({ ok: true, reply });
  }

  return json({ ok: false, error: `Service inconnu : ${service}` }, 400);
}
