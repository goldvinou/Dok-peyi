/* ============================================================
   DOK'PÉYI — Document Service  (lib/documents.js)
   ES module — imported by Vercel Edge Functions in /api/.
   NOT loaded in the browser (no window/DOM dependencies).

   Responsibilities:
     1. Define which statuses unlock preview vs. final access
     2. Inject / remove the Dok'péyi watermark (pure string transform)
     3. Provide getDocument() — single entry point for document retrieval,
        enforces access control before returning either version

   Data model convention (set by pipeline.js generate handler):
     order._documents = {
       final: "<html>…</html>"   // clean AI output — no watermark
       // preview is derived on demand via addWatermark(final)
       // storing preview separately would just duplicate bytes
     }
   ============================================================ */


/* ── 1. ACCESS CONTROL ────────────────────────────────────── */

/**
 * Statuses where the watermarked preview may be shown.
 * Includes every post-generation status so the user can always
 * review what they paid for.
 */
export const PREVIEW_STATUSES = new Set([
  'generated',
  'pending_payment',
  'paid',
  'needs_review',
  'delivered'
]);

/**
 * Statuses where the clean final document may be downloaded.
 * Only unlocked once payment is confirmed.
 */
export const FINAL_STATUSES = new Set([
  'paid',
  'needs_review',
  'delivered'
]);

/**
 * Can the order's owner see the watermarked preview?
 * @param {object|string} orderOrStatus - Full order object or just the statut string.
 */
export function canAccessPreview(orderOrStatus) {
  const s = typeof orderOrStatus === 'string' ? orderOrStatus : orderOrStatus?.statut;
  return PREVIEW_STATUSES.has(s);
}

/**
 * Can the order's owner download the final (clean) document?
 * @param {object|string} orderOrStatus - Full order object or just the statut string.
 */
export function canAccessFinal(orderOrStatus) {
  const s = typeof orderOrStatus === 'string' ? orderOrStatus : orderOrStatus?.statut;
  return FINAL_STATUSES.has(s);
}


/* ── 2. WATERMARK ─────────────────────────────────────────── */

/** Unique id used to locate and remove the watermark element. */
const WATERMARK_ID = 'dok-preview-watermark';

/**
 * Inject a Dok'péyi watermark div into a complete HTML string.
 * Inserts just before </body>; falls back to appending if tag not found.
 *
 * The injected element is:
 *   - position:fixed; inset:0 — covers the whole viewport
 *   - pointer-events:none     — transparent to mouse/touch events
 *   - aria-hidden             — invisible to screen readers
 *   - z-index:9999            — above all document content
 *
 * @param {string} html - Raw HTML string (the AI-generated document).
 * @returns {string} HTML with watermark injected.
 */
export function addWatermark(html) {
  if (!html || typeof html !== 'string') return html;

  const wm = [
    `<div id="${WATERMARK_ID}" aria-hidden="true" style="`,
    `position:fixed;inset:0;z-index:9999;pointer-events:none;`,
    `display:flex;align-items:center;justify-content:center;overflow:hidden">`,
    `<span style="`,
    `display:block;transform:rotate(-35deg);`,
    `font-size:72px;font-weight:900;`,
    `color:rgba(30,58,138,.08);`,
    `font-family:Arial,sans-serif;letter-spacing:10px;`,
    `white-space:nowrap;user-select:none">`,
    `APERÇU\u00a0·\u00a0DOK\u2019PÉYI`,
    `</span>`,
    `</div>`
  ].join('');

  return html.includes('</body>')
    ? html.replace('</body>', wm + '</body>')
    : html + wm;
}

/**
 * Remove the watermark element from an HTML string.
 * Useful if the document is re-processed after payment.
 *
 * @param {string} html - Potentially watermarked HTML.
 * @returns {string} HTML with watermark element removed.
 */
export function removeWatermark(html) {
  if (!html || typeof html !== 'string') return html;
  // Match the entire injected div (non-greedy, single-line safe)
  return html.replace(
    new RegExp(`<div id="${WATERMARK_ID}"[\\s\\S]*?</div>\\s*(?=</body>|$)`, 'i'),
    ''
  );
}


/* ── 3. DOCUMENT RETRIEVAL ────────────────────────────────── */

/**
 * Retrieve the preview or final document for an order, enforcing
 * access control based on the order's current status.
 *
 * @param {object} order  - Order object (must include .statut and ._documents).
 * @param {'preview'|'final'} type - Which version to retrieve.
 * @returns {{ ok: boolean, html?: string, type?: string, error?: string }}
 */
export function getDocument(order, type) {
  if (!order) {
    return { ok: false, error: 'Order manquant' };
  }

  const raw = order._documents?.final;

  if (type === 'preview') {
    if (!canAccessPreview(order)) {
      return {
        ok:    false,
        error: `Aperçu non disponible au statut "${order.statut}". Génération requise.`
      };
    }
    if (!raw) {
      return { ok: false, error: 'Document pas encore généré.' };
    }
    return { ok: true, type: 'preview', html: addWatermark(raw) };
  }

  if (type === 'final') {
    if (!canAccessFinal(order)) {
      return {
        ok:    false,
        error: `Document final non disponible avant paiement (statut actuel : "${order.statut}").`
      };
    }
    if (!raw) {
      return { ok: false, error: 'Document pas encore généré.' };
    }
    return { ok: true, type: 'final', html: raw };
  }

  return { ok: false, error: `Type de document inconnu : ${type}. Utiliser "preview" ou "final".` };
}
