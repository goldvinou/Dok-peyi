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
     submitted → processing → generated → pending_payment → paid → delivered
                           ↘              ↘                ↘
                           needs_review   failed           failed
   (any step can also move to failed via the fail() handler)
   ============================================================ */


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
  processing:      ['generated', 'needs_review', 'failed'],
  generated:       ['pending_payment', 'failed'],
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
   * generate — submitted → processing → generated
   *
   * Calls the Anthropic API with the prompt supplied by the client.
   * On success: order.statut = 'generated', order._generatedContent = html.
   * On AI failure: order.statut = 'failed', order._failReason = message.
   *
   * @param {object} order
   * @param {object} ctx   - { prompt: string, apiKey: string, systemPrompt?: string }
   */
  async generate(order, { prompt, apiKey, systemPrompt = '' }) {
    /* Step A — submitted → processing */
    const toProcessing = applyTransition(order, 'processing');
    if (!toProcessing.ok) return { ok: false, order, error: toProcessing.error };

    /* Step B — call Anthropic (non-streaming for pipeline use) */
    let content;
    try {
      const body = {
        model:      'claude-haiku-4-5-20251001',
        max_tokens: 4096,
        messages:   [{ role: 'user', content: prompt }]
      };
      if (systemPrompt) body.system = systemPrompt;

      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key':         apiKey,
          'anthropic-version': '2023-06-01',
          'content-type':      'application/json'
        },
        body: JSON.stringify(body)
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Anthropic ${res.status}: ${text.slice(0, 200)}`);
      }

      const data = await res.json();
      content = (data.content?.[0]?.text || '').trim();

    } catch (err) {
      /* AI call failed — transition to failed */
      const failed = _forceFail(toProcessing.order, err.message);
      return { ok: false, order: failed, error: err.message };
    }

    /* Step C — processing → generated */
    const toGenerated = applyTransition(toProcessing.order, 'generated');
    if (!toGenerated.ok) {
      return { ok: false, order: toProcessing.order, error: toGenerated.error };
    }

    return {
      ok:    true,
      order: { ...toGenerated.order, _generatedContent: content }
    };
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
