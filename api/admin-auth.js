export const config = { runtime: 'edge' };

/* ============================================================
   DOK'PÉYI — Admin Auth API  (api/admin-auth.js)
   Server-side Edge Function — mots de passe lus depuis les
   variables d'environnement Vercel, jamais exposés au client.
   ============================================================ */

import { rateLimit }    from '../lib/rate-limit.js';
import { CORS, json }   from '../lib/edge-response.js';

/* Utilisateurs — les mots de passe viennent des env vars */
const USERS = [
  { user: 'allan',  envKey: 'ADMIN_PASS_ALLAN',  nom: 'Allan',      role: 'admin',      color: '#2563eb' },
  { user: 'yonel',  envKey: 'ADMIN_PASS_YONEL',  nom: 'Yonel',      role: 'admin',      color: '#10b981' },
  { user: 'marvin', envKey: 'ADMIN_PASS_MARVIN', nom: 'Marvin',     role: 'manager',    color: '#f59e0b' },
  { user: 'redac1', envKey: 'ADMIN_PASS_REDAC',  nom: 'Rédacteur',  role: 'redacteur',  color: '#8b5cf6' }
];

export default async function handler(req) {
  if (req.method === 'OPTIONS') return new Response(null, { status: 200, headers: CORS });
  if (req.method !== 'POST')   return json({ ok: false, error: 'Method not allowed' }, 405);

  /* Brute-force guard — 5 attempts per 5 minutes per IP */
  const rl = rateLimit(req, { max: 5, windowMs: 300_000 });
  if (!rl.ok) return new Response(JSON.stringify({ ok: false, error: 'Trop de tentatives — réessayez dans 5 minutes.' }), {
    status: 429, headers: { ...CORS, 'content-type': 'application/json', 'Retry-After': '300' }
  });

  let body;
  try { body = await req.json(); }
  catch (_) { return json({ ok: false, error: 'Invalid JSON' }, 400); }

  const { username, password } = body || {};
  if (!username || !password) return json({ ok: false, error: 'Missing credentials' }, 400);

  const found = USERS.find(u => u.user === String(username).trim().toLowerCase());
  if (!found) {
    await new Promise(r => setTimeout(r, 200));
    return json({ ok: false }, 200);
  }

  const expectedPass = process.env[found.envKey] || '';
  const ok = expectedPass.length > 0 && timingSafeEqual(String(password), expectedPass);

  await new Promise(r => setTimeout(r, 200));

  if (!ok) return json({ ok: false }, 200);

  return json({ ok: true, user: found.user, nom: found.nom, role: found.role, color: found.color });
}

/* Comparaison en temps constant pour résister aux timing attacks */
function timingSafeEqual(a, b) {
  if (a.length !== b.length) {
    /* Parcourir quand même pour ne pas révéler la longueur */
    let _ = 0;
    for (let i = 0; i < a.length; i++) _ |= a.charCodeAt(i);
    return false;
  }
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}
