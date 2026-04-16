/* ============================================================
   DOK'PÉYI — Rate Limiter  (lib/rate-limit.js)
   Sliding-window in-memory limiter for Vercel Edge Functions.

   Not perfectly global across all Edge isolates, but protects
   against sustained abuse hitting the same isolate — which is
   the common case for a single-user scraper or bot.

   Usage:
     import { rateLimit } from '../lib/rate-limit.js';
     const result = rateLimit(req, { max: 5, windowMs: 60_000 });
     if (!result.ok) return new Response('Too Many Requests', { status: 429 });
   ============================================================ */

/* Map<ip, { count, resetAt }> — lives in the Edge isolate */
const store = new Map();

/**
 * @param {Request} req
 * @param {{ max: number, windowMs: number }} options
 * @returns {{ ok: boolean, remaining: number, resetAt: number }}
 */
export function rateLimit(req, { max = 10, windowMs = 60_000 } = {}) {
  const ip  = getIp(req);
  const now = Date.now();

  /* Purge expired entries periodically to prevent memory leak */
  if (store.size > 2000) {
    for (const [key, val] of store) {
      if (val.resetAt < now) store.delete(key);
    }
  }

  const key     = ip + ':' + Math.floor(windowMs / 1000);
  const entry   = store.get(key);
  const resetAt = entry?.resetAt ?? (now + windowMs);

  if (entry && entry.resetAt > now) {
    /* Within the current window */
    if (entry.count >= max) {
      return { ok: false, remaining: 0, resetAt: entry.resetAt };
    }
    entry.count++;
    return { ok: true, remaining: max - entry.count, resetAt: entry.resetAt };
  }

  /* New window */
  store.set(key, { count: 1, resetAt });
  return { ok: true, remaining: max - 1, resetAt };
}

function getIp(req) {
  return (
    req.headers.get('cf-connecting-ip') ||       // Cloudflare
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'
  );
}
