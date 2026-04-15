export const config = { runtime: 'edge' };

/* ============================================================
   DOK'PÉYI — Admin Auth API  (api/admin-auth.js)
   Server-side Edge Function — mots de passe lus depuis les
   variables d'environnement Vercel, jamais exposés au client.
   ============================================================ */

/* Utilisateurs — les mots de passe viennent des env vars */
const USERS = [
  { user: 'allan',  envKey: 'ADMIN_PASS_ALLAN',  nom: 'Allan',      role: 'admin',      color: '#2563eb' },
  { user: 'yonel',  envKey: 'ADMIN_PASS_YONEL',  nom: 'Yonel',      role: 'admin',      color: '#10b981' },
  { user: 'marvin', envKey: 'ADMIN_PASS_MARVIN', nom: 'Marvin',     role: 'manager',    color: '#f59e0b' },
  { user: 'redac1', envKey: 'ADMIN_PASS_REDAC',  nom: 'Rédacteur',  role: 'redacteur',  color: '#8b5cf6' }
];

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ ok: false, error: 'Method not allowed' }), {
      status: 405,
      headers: { 'content-type': 'application/json' }
    });
  }

  let body;
  try {
    body = await req.json();
  } catch (_) {
    return new Response(JSON.stringify({ ok: false, error: 'Invalid JSON' }), {
      status: 400,
      headers: { 'content-type': 'application/json' }
    });
  }

  const { username, password } = body || {};

  if (!username || !password) {
    return new Response(JSON.stringify({ ok: false, error: 'Missing credentials' }), {
      status: 400,
      headers: { 'content-type': 'application/json' }
    });
  }

  const found = USERS.find(u => u.user === String(username).trim().toLowerCase());
  if (!found) {
    /* Délai constant pour éviter les timing attacks */
    await new Promise(r => setTimeout(r, 200));
    return new Response(JSON.stringify({ ok: false }), {
      status: 200,
      headers: { 'content-type': 'application/json' }
    });
  }

  /* Lire le mot de passe depuis les variables d'environnement */
  const expectedPass = process.env[found.envKey] || '';

  /* Comparaison en temps constant */
  const ok = expectedPass.length > 0 && timingSafeEqual(String(password), expectedPass);

  await new Promise(r => setTimeout(r, 200)); /* délai uniforme */

  if (!ok) {
    return new Response(JSON.stringify({ ok: false }), {
      status: 200,
      headers: { 'content-type': 'application/json' }
    });
  }

  /* Succès — retourner les infos publiques (sans le mot de passe) */
  return new Response(JSON.stringify({
    ok:    true,
    user:  found.user,
    nom:   found.nom,
    role:  found.role,
    color: found.color
  }), {
    status: 200,
    headers: { 'content-type': 'application/json' }
  });
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
