/* ============================================================
   DOK'PÉYI — Edge Response Helpers  (lib/edge-response.js)
   Shared by Vercel Edge Functions in /api/.

   Provides a typed JSON response builder that includes the
   standard CORS headers used across all DOK'PÉYI endpoints.
   ============================================================ */

/** Standard CORS headers applied to every response. */
export const CORS = Object.freeze({
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
});

/**
 * Build a JSON Response with CORS headers.
 *
 * @param {object} body   - Data to serialise.
 * @param {number} [status=200] - HTTP status code.
 * @returns {Response}
 */
export function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'content-type': 'application/json' }
  });
}
