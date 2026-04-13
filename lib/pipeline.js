/* ============================================================
   DOK'PÉYI — Backend Pipeline  (lib/pipeline.js)
   ES module — imported only by Vercel Edge Functions in /api/.
   NOT loaded in the browser.

   Responsibilities:
     1. Define the valid status transition graph
     2. Provide a safe applyTransition() with audit trail
     3. Provide stage handlers that do the real work per stage
     4. Export a createOrder() factory so the API owns the schema

   Status flow this module enforces:
     submitted → processing → generated ──► pending_payment → paid → delivered
                                      ↘              ↘          ↘
                                      needs_review  failed      failed
                                           ↓
                                        delivered
   (any step can also move to failed via the fail() handler)
   ============================================================ */

import { evaluateReview }            from './review.js';
import { buildPrompt, parseContent } from './content.js';
import { render }                    from './templates.js';


/* ── 1. TRANSITION GRAPH ──────────────────────────────────── */

/**
 * Authoritative server-side transition map.
 * Key   = current status
 * Value = array of statuses this step may advance to
 *
 * Mirrors DOK_STATUS_TRANSITIONS in /lib/statuses.js (browser)
 * but lives here independently — no window dependency.
 */
export const VALID_TRANSITIONS = Object.freeze({
  submitted:       ['processing', 'failed'],
  processing:      ['generated', 'failed'],
  generated:       ['pending_payment', 'needs_review', 'failed'],  // needs_review injected by review engine
  pending_payment: ['paid', 'failed'],
  paid:            ['needs_review', 'delivered'],
  needs_review:    ['delivered'],
  delivered:       [],
  failed:          []
});


/* ── 2. ORDER FACTORY ─────────────────────────────────────── */

/**
 * Build a fresh order object at status 'submitted'.
 * Called by the API when a client starts a new request.
 *
 * @param {object} params
 * @param {string|number} params.id       - Unique order id (e.g. Date.now())
 * @param {string}        params.service  - Service key: cv|lettre|courrier|dossier|sejour
 * @param {object}        params.personal - { prenom, nom, email, phone }
 * @param {object}        params.details  - Form answers from the wizard
 * @param {number}        params.price    - Service price in euros
 * @returns {object} order
 */
export function createOrder({ id, service, personal = {}, details = {}, price = 0 }) {
  const now = new Date();
  return {
    id:       id || Date.now(),
    date:     now.toISOString().split('T')[0],
    heure:    pad2(now.getHours()) + ':' + pad2(now.getMinutes()),
    prenom:   personal.prenom   || '',
    nom:      personal.nom      || '',
    email:    personal.email    || '',
    whatsapp: personal.phone    || '',
    ville:    '',
    service,
    montant:  price,
    statut:   'submitted',
    details,
    note:     '',
    _pipeline: [{ status: 'submitted', ts: now.toISOString() }]
  };
}


/* ── 3. TRANSITION GUARD ──────────────────────────────────── */

/**
 * Attempt to advance an order to the next status.
 * Appends an entry to order._pipeline (audit trail).
 *
 * @param {object} order      - Current order object.
 * @param {string} nextStatus - Desired new status.
 * @returns {{ ok: boolean, order: object, error?: string }}
 */
export function applyTransition(order, nextStatus) {
  const allowed = VALID_TRANSITIONS[order.statut] || [];

  if (!allowed.includes(nextStatus)) {
    return {
      ok:    false,
      order,
      error: `Transition invalide : ${order.statut} → ${nextStatus}`
    };
  }

  const trail = Array.isArray(order._pipeline) ? [...order._pipeline] : [];
  trail.push({ status: nextStatus, ts: new Date().toISOString() });

  return {
    ok:    true,
    order: { ...order, statut: nextStatus, _pipeline: trail }
  };
}


/* ── 4. STAGE HANDLERS ────────────────────────────────────── */

/**
 * Each handler receives the current order and a context object,
 * drives the order through the relevant stage transition(s),
 * and returns { ok, order, error? }.
 *
 * Handlers do NOT persist the order — that is the caller's responsibility.
 */
export const handlers = {

  /**
   * generate — submitted → processing → generated → needs_review (if review required)
   *                                                            ↓ (if no review)
   *                                                     stays at generated
   *
   * Full flow:
   *   submitted → processing
   *     → [content.js]  build prompt for this service (json or html mode)
   *     → [Anthropic]   call AI
   *     → [content.js]  parse response into structured content
   *     → [templates.js] render content into final HTML
   *     → processing → generated
   *     → [review.js]   evaluate review rules
   *     →   needs_review  if review required
   *     →   generated     if auto (ready for payment)
   *
   * @param {object} order
   * @param {object} ctx   - { apiKey: string, promptOverride?: string }
   *   promptOverride: optional raw prompt string (skips content.js builder).
   *   Kept for backward compat with callers that build their own prompts.
   */
  async generate(order, { apiKey, promptOverride = '' }) {
    /* Step A — submitted → processing */
    const toProcessing = applyTransition(order, 'processing');
    if (!toProcessing.ok) return { ok: false, order, error: toProcessing.error };

    /* Step B — build prompt (server-side via content.js, or use override) */
    let promptText, responseFormat;
    if (promptOverride) {
      promptText     = promptOverride;
      responseFormat = 'html';    // legacy callers always expect html
    } else {
      const built = buildPrompt(order);
      promptText     = built.prompt;
      responseFormat = built.format;
    }

    /* Step C — call Anthropic (non-streaming) */
    let rawAI;
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key':         apiKey,
          'anthropic-version': '2023-06-01',
          'content-type':      'application/json'
        },
        body: JSON.stringify({
          model:      'claude-haiku-4-5-20251001',
          max_tokens: 4096,
          messages:   [{ role: 'user', content: promptText }]
        })
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Anthropic ${res.status}: ${text.slice(0, 200)}`);
      }

      const data = await res.json();
      rawAI = (data.content?.[0]?.text || '').trim();

    } catch (err) {
      const failed = _forceFail(toProcessing.order, err.message);
      return { ok: false, order: failed, error: err.message };
    }

    /* Step D — parse AI response (content.js) */
    const parsed = parseContent(rawAI, responseFormat);
    if (!parsed.ok) {
      // JSON parse failed — fall back to treating raw AI output as HTML
      console.warn('[pipeline] JSON parse failed, falling back to html:', parsed.error);
      parsed.content = rawAI;
      responseFormat = 'html';
    }

    /* Step E — render to final HTML (templates.js) */
    const personal = {
      prenom:   order.prenom   || '',
      nom:      order.nom      || '',
      email:    order.email    || '',
      whatsapp: order.whatsapp || ''
    };
    const finalHTML = render(order.service, parsed.content, personal, responseFormat);

    /* Step F — processing → generated */
    const toGenerated = applyTransition(toProcessing.order, 'generated');
    if (!toGenerated.ok) {
      return { ok: false, order: toProcessing.order, error: toGenerated.error };
    }

    const withDoc = {
      ...toGenerated.order,
      _documents: { final: finalHTML }
    };

    /* Step G — evaluate review rules (review.js) */
    const review = evaluateReview(withDoc);
    const withReview = {
      ...withDoc,
      reviewRequired: review.reviewRequired,
      reviewReason:   review.reviewReason || null
    };

    if (review.reviewRequired) {
      const toReview = applyTransition(withReview, 'needs_review');
      return { ok: true, order: toReview.ok ? toReview.order : withReview };
    }

    return { ok: true, order: withReview };
  },

  /**
   * confirm_payment — pending_payment → paid → delivered
   *
   * No real payment provider yet — this is a stub that records the
   * transition and marks the order as delivered.
   * Payment provider integration will be added in a later step.
   *
   * @param {object} order
   * @param {object} _ctx - Reserved for future payment payload.
   */
  async confirm_payment(order, _ctx = {}) {
    const toPaid = applyTransition(order, 'paid');
    if (!toPaid.ok) return { ok: false, order, error: toPaid.error };

    const toDelivered = applyTransition(toPaid.order, 'delivered');
    if (!toDelivered.ok) return { ok: false, order: toPaid.order, error: toDelivered.error };

    return { ok: true, order: toDelivered.order };
  },

  /**
   * fail — any status → failed (forced, bypasses graph)
   *
   * Can be called at any point to mark an order as failed.
   * Uses a forced write so it works regardless of current status.
   *
   * @param {object} order
   * @param {object} ctx   - { reason?: string }
   */
  async fail(order, { reason = 'Erreur inconnue' } = {}) {
    return { ok: true, order: _forceFail(order, reason) };
  }
};


/* ── INTERNAL HELPERS ─────────────────────────────────────── */

/** Force-write a 'failed' status, bypassing the transition graph. */
function _forceFail(order, reason) {
  const trail = Array.isArray(order._pipeline) ? [...order._pipeline] : [];
  trail.push({ status: 'failed', ts: new Date().toISOString(), reason });
  return { ...order, statut: 'failed', _pipeline: trail, _failReason: reason };
}

function pad2(n) { return String(n).padStart(2, '0'); }
