/* ============================================================
   DOK'PÉYI — Status System  (lib/statuses.js)
   Loaded as a plain <script> in service.html + admin/index.html.
   Exposes three globals: DOK_STATUS, DOK_STATUS_META, dokTransition.
   ============================================================ */

/**
 * Status constants — use these everywhere instead of raw strings.
 *
 * Flow:
 *  submitted
 *    └─► processing
 *          └─► generated ──► pending_payment
 *                │                 └─► paid ──► needs_review ──► delivered
 *                │                       └────────────────────► delivered
 *                └─► failed
 *          └─► failed
 */
const DOK_STATUS = Object.freeze({
  SUBMITTED:       'submitted',
  PROCESSING:      'processing',
  GENERATED:       'generated',
  PENDING_PAYMENT: 'pending_payment',
  PAID:            'paid',
  NEEDS_REVIEW:    'needs_review',
  DELIVERED:       'delivered',
  FAILED:          'failed'
});

/**
 * Per-status metadata used by both the wizard and the admin panel.
 *   label   — human-readable French label
 *   cssClass — CSS class for the badge (admin uses .badge-{cssClass})
 *   terminal — true if no further automatic transitions should happen
 */
const DOK_STATUS_META = Object.freeze({
  submitted:       { label: 'Soumis',            cssClass: 'submitted',       terminal: false },
  processing:      { label: 'Génération IA',     cssClass: 'processing',      terminal: false },
  generated:       { label: 'Généré',            cssClass: 'generated',       terminal: false },
  pending_payment: { label: 'Paiement en cours', cssClass: 'pending-payment', terminal: false },
  paid:            { label: 'Payé',              cssClass: 'paid',            terminal: false },
  needs_review:    { label: 'À vérifier',        cssClass: 'needs-review',    terminal: false },
  delivered:       { label: 'Livré',             cssClass: 'delivered',       terminal: true  },
  failed:          { label: 'Échec',             cssClass: 'failed',          terminal: true  },
  /* ── Legacy statuses kept for backward compatibility ── */
  en_attente:      { label: 'En attente',        cssClass: 'attente',         terminal: false },
  en_cours:        { label: 'En cours',          cssClass: 'cours',           terminal: false },
  terminé:         { label: 'Terminé',           cssClass: 'termine',         terminal: true  },
  annulé:          { label: 'Annulé',            cssClass: 'annule',          terminal: true  }
});

/**
 * Valid transitions graph.
 * Key = current status, value = array of allowed next statuses.
 * Admin overrides (e.g. manual force-set) bypass this via the
 * { force: true } option of dokTransition().
 */
const DOK_STATUS_TRANSITIONS = Object.freeze({
  submitted:       ['processing', 'failed'],
  processing:      ['generated',  'failed'],
  generated:       ['pending_payment', 'failed'],
  pending_payment: ['paid', 'failed'],
  paid:            ['needs_review', 'delivered'],
  needs_review:    ['delivered'],
  delivered:       [],
  failed:          [],
  /* Legacy → new bridge: admin can promote old orders into new flow */
  en_attente:      ['processing', 'needs_review', 'delivered', 'failed', 'annulé'],
  en_cours:        ['needs_review', 'delivered', 'failed', 'annulé'],
  terminé:         [],
  annulé:          []
});

/**
 * Attempt a status transition.
 *
 * @param {string} current   - Current status of the order.
 * @param {string} next      - Desired new status.
 * @param {object} [opts]
 * @param {boolean} [opts.force=false] - Skip validation (admin manual override).
 * @returns {{ ok: boolean, status: string, error?: string }}
 *   ok=true  → status contains the new status string.
 *   ok=false → status contains the unchanged current status, error explains why.
 */
function dokTransition(current, next, opts) {
  const force = opts && opts.force === true;

  if (!DOK_STATUS_META[next]) {
    return { ok: false, status: current, error: 'Statut inconnu : ' + next };
  }

  if (!force) {
    const allowed = DOK_STATUS_TRANSITIONS[current] || [];
    if (!allowed.includes(next)) {
      return {
        ok: false,
        status: current,
        error: 'Transition invalide : ' + current + ' → ' + next
      };
    }
  }

  return { ok: true, status: next };
}

/* Make globals accessible on window so both service.js and admin.js can use them */
window.DOK_STATUS            = DOK_STATUS;
window.DOK_STATUS_META       = DOK_STATUS_META;
window.DOK_STATUS_TRANSITIONS= DOK_STATUS_TRANSITIONS;
window.dokTransition         = dokTransition;
