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

     Standard (no review):
       submitted → processing → generated → pending_payment → paid → delivered

     Pre-payment review (e.g. sejour — mandatory admin review first):
       submitted → processing → generated → needs_review → pending_payment → paid → delivered

     Post-payment review (e.g. dossier sensitive — admin reviews before final delivery):
       submitted → processing → generated → pending_payment → paid → needs_review → delivered

     Any step can also move to failed via the fail() handler.

   Payment lock:
     - preview (watermarked) : available from pending_payment onward
     - final  (clean)        : locked until paid (enforced in lib/documents.js)
     - deliver action        : server-side guard verifies a 'paid' entry in _pipeline
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
  generated:       ['pending_payment', 'needs_review', 'failed'],
  pending_payment: ['paid', 'failed'],
  paid:            ['needs_review', 'delivered'],
  // needs_review can come from 'generated' (pre-payment review) or from 'paid' (post-payment review).
  // → pending_payment: admin approved a pre-payment review order, client now pays
  // → delivered:       post-payment review complete (payment already in _pipeline trail)
  needs_review:    ['pending_payment', 'delivered'],
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

  const trail = _appendToTrail(order, { status: nextStatus, ts: new Date().toISOString() });

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
      // Pre-payment review path: admin must inspect before client pays.
      const toReview = applyTransition(withReview, 'needs_review');
      return { ok: true, order: toReview.ok ? toReview.order : withReview };
    }

    // No review required → advance immediately to pending_payment.
    // The final document is locked (watermarked preview only) until payment is confirmed.
    const toPending = applyTransition(withReview, 'pending_payment');
    return { ok: true, order: toPending.ok ? toPending.order : withReview };
  },

  /**
   * confirm_payment — pending_payment → paid
   *
   * Advances the order to 'paid' and records payment metadata.
   * Does NOT move to delivered — that is a separate admin action (deliver).
   * Payment unlocks the final document (see lib/documents.js FINAL_STATUSES).
   *
   * Called by:
   *   • POST /api/pipeline  { action: 'confirm_payment' }  (manual admin confirmation)
   *   • POST /api/payment-webhook                           (payment provider callback)
   *
   * @param {object} order
   * @param {object} ctx
   * @param {string} [ctx.provider='manual']  - Payment provider id (stripe|paypal|momo|lydia|manual)
   * @param {string} [ctx.reference]          - Provider transaction/reference id
   * @param {number} [ctx.amount]             - Amount charged (in EUR or local currency)
   */
  async confirm_payment(order, ctx = {}) {
    const toPaid = applyTransition(order, 'paid');
    if (!toPaid.ok) return { ok: false, order, error: toPaid.error };

    // Attach payment metadata to the order for audit purposes.
    const paidOrder = {
      ...toPaid.order,
      _payment: {
        confirmedAt: new Date().toISOString(),
        provider:    ctx.provider   || 'manual',
        reference:   ctx.reference  || null,
        amount:      ctx.amount     != null ? ctx.amount : (order.montant || null)
      }
    };

    return { ok: true, order: paidOrder };
  },

  /**
   * deliver — paid → delivered  OR  needs_review → delivered
   *
   * Admin action: marks the order as delivered after confirming that:
   *   1. The order has been paid (verified via _pipeline audit trail)
   *   2. The current status permits delivery
   *
   * This is the final step — the clean document is already available
   * to the client (FINAL_STATUSES includes 'paid' and 'needs_review').
   * Delivery here means the admin has confirmed handoff (WhatsApp, email…).
   *
   * @param {object} order
   */
  async deliver(order) {
    // Server-side payment guard: refuse delivery if payment was never confirmed.
    // We check the _pipeline audit trail for a 'paid' entry rather than
    // relying on the current statut field alone, since the order may be in
    // needs_review (post-payment review) when deliver is called.
    const hasPaid = Array.isArray(order._pipeline)
      && order._pipeline.some(e => e.status === 'paid');

    if (!hasPaid) {
      return {
        ok:    false,
        order,
        error: 'Livraison impossible : le paiement doit être confirmé avant la livraison.'
      };
    }

    const toDelivered = applyTransition(order, 'delivered');
    if (!toDelivered.ok) return { ok: false, order, error: toDelivered.error };

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

/**
 * Clone the _pipeline audit trail and append one entry.
 * Returns the new trail array (does not mutate the order).
 *
 * @param {object} order
 * @param {object} entry - { status, ts, ...extra }
 * @returns {Array}
 */
function _appendToTrail(order, entry) {
  const trail = Array.isArray(order._pipeline) ? [...order._pipeline] : [];
  trail.push(entry);
  return trail;
}

/** Force-write a 'failed' status, bypassing the transition graph. */
function _forceFail(order, reason) {
  const trail = _appendToTrail(order, { status: 'failed', ts: new Date().toISOString(), reason });
  return { ...order, statut: 'failed', _pipeline: trail, _failReason: reason };
}

function pad2(n) { return String(n).padStart(2, '0'); }
