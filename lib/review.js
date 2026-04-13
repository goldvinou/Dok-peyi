/* ============================================================
   DOK'PÉYI — Review Rules Engine  (lib/review.js)
   ES module — imported by lib/pipeline.js only.

   Determines whether a generated order needs human review before
   it can proceed to delivery, and why.

   Rules summary
   ─────────────
   cv       (all choices)   → auto
   lettre   (all choices)   → auto
   courrier (all choices)   → auto
   dossier                  → review if content is too short
                               OR contains a sensitive keyword
   sejour                   → always review (mandatory)
   unknown service          → review by default (safe fallback)
   ============================================================ */


/* ── THRESHOLDS & KEYWORDS ───────────────────────────────── */

/**
 * Minimum character count for dossier.description before we
 * consider the content "sufficient" for auto-processing.
 */
const DOSSIER_MIN_DESCRIPTION_LENGTH = 40;

/**
 * Keywords that flag a dossier as sensitive regardless of length.
 * Matched case-insensitively against the concatenation of
 * description + type fields.
 */
const SENSITIVE_KEYWORDS = [
  'titre de séjour',
  'titre sejour',
  'régularisation',
  'regularisation',
  'sans-papier',
  'sans papier',
  'clandestin',
  'expulsion',
  'reconduite',
  'naturalisation',
  'réfugié',
  'refugie',
  'asile',
  'ofpra',
  'cnda'
];


/* ── REVIEW EVALUATOR ────────────────────────────────────── */

/**
 * Decide whether an order requires human review.
 *
 * Called by the pipeline's generate handler after the AI document
 * has been produced. The decision is based entirely on the service
 * type and the client-submitted details — not on the AI output.
 *
 * @param {object} order - Order object (must have .service and .details).
 * @returns {{ reviewRequired: boolean, reviewReason: string|null }}
 */
export function evaluateReview(order) {
  const service = order?.service || '';
  const details = order?.details || {};

  switch (service) {

    /* ── Auto-delivery services ── */
    case 'cv':
    case 'lettre':
    case 'courrier':
      return { reviewRequired: false, reviewReason: null };

    /* ── Conditional review: dossier administratif ── */
    case 'dossier': {
      const description = (details.description || '').trim();
      const type        = (details.type        || '').trim();

      // Rule 1 — insufficient content
      if (description.length < DOSSIER_MIN_DESCRIPTION_LENGTH) {
        return {
          reviewRequired: true,
          reviewReason: `Contenu insuffisant : description trop courte `
            + `(${description.length} car., minimum ${DOSSIER_MIN_DESCRIPTION_LENGTH}).`
        };
      }

      // Rule 2 — sensitive keyword match
      const haystack = (description + ' ' + type).toLowerCase();
      const matched  = SENSITIVE_KEYWORDS.find(kw => haystack.includes(kw));
      if (matched) {
        return {
          reviewRequired: true,
          reviewReason: `Contenu sensible détecté (mot-clé : "${matched}").`
        };
      }

      return { reviewRequired: false, reviewReason: null };
    }

    /* ── Mandatory review: titre de séjour ── */
    case 'sejour':
      return {
        reviewRequired: true,
        reviewReason: 'Titre de séjour : vérification manuelle obligatoire avant traitement.'
      };

    /* ── Safe fallback for unknown services ── */
    default:
      return {
        reviewRequired: true,
        reviewReason: `Service inconnu "${service}" : revue par précaution.`
      };
  }
}
