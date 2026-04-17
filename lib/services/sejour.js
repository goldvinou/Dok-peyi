/* ============================================================
   DOK'PÉYI — Titre de Séjour Service  (lib/services/sejour.js)
   ES module — single source of truth for this service.
   Imported by: lib/content.js, lib/review.js, lib/templates.js.

   This is the canonical isolated definition of the "titre de séjour"
   service. Everything specific to this service lives here:
     - service metadata (config)
     - intake questions
     - JSON content schema (what the AI must produce)
     - prompt builder
     - mandatory review flag + reason

   Integration points:
     lib/content.js  → calls buildPrompt() to get { prompt, format }
     lib/review.js   → reads REVIEW_REQUIRED and REVIEW_REASON
     lib/templates.js → reads CONTENT_SCHEMA to understand the structure
   ============================================================ */

export const SERVICE_KEY = 'sejour';

/* ── SERVICE CONFIG ──────────────────────────────────────── */

/**
 * Metadata used by both client wizard (SVC object) and server pipeline.
 */
export const config = Object.freeze({
  key:   SERVICE_KEY,
  name:  'Titre de séjour',
  icon:  '🛂',
  color: '#ef4444',
  light: '#fef2f2',
  price: 15
});

/* ── MANDATORY REVIEW ────────────────────────────────────── */

/**
 * Titre de séjour ALWAYS requires human review before delivery.
 * The pipeline routes every completed order to needs_review status.
 */
export const REVIEW_REQUIRED = true;

export const REVIEW_REASON =
  'Titre de séjour : vérification manuelle obligatoire avant tout traitement.';

/* ── INTAKE QUESTIONS ────────────────────────────────────── */

/**
 * Questions presented to the user in the wizard (step 2).
 * The answers populate order.details which is passed to buildPrompt().
 */
export const choices = Object.freeze([
  { id: 'premiere',       label: 'Première demande',      desc: 'Je n\'ai pas encore de titre de séjour' },
  { id: 'renouvellement', label: 'Renouvellement',         desc: 'Mon titre arrive à expiration' },
  { id: 'regularisation', label: 'Régularisation',         desc: 'Je souhaite régulariser ma situation' },
  { id: 'information',    label: 'Demande d\'information', desc: 'Comprendre mes droits et démarches' }
]);

export const questions = Object.freeze([
  {
    id:          'nationalite',
    label:       'Nationalité *',
    type:        'text',
    required:    true,
    placeholder: 'Ex : Haïtienne, Brésilienne, Surinamaise, Dominicaine…'
  },
  {
    id:          'situation',
    label:       'Votre situation actuelle *',
    type:        'textarea',
    required:    true,
    placeholder: 'Depuis quand êtes-vous en Guyane / France ? '
      + 'Avec quel document (visa, passeport, sans papier) ? '
      + 'Quel est votre projet de séjour ?'
  },
  {
    id:          'documents',
    label:       'Documents dont vous disposez',
    type:        'textarea',
    required:    false,
    placeholder: 'Passeport, visa, actes d\'état civil, contrats de travail, '
      + 'attestation d\'hébergement, certificats de scolarité…'
  }
]);

/* ── CONTENT SCHEMA ──────────────────────────────────────── */

/**
 * The JSON object structure the AI must return for this service.
 * Used in buildPrompt() as an inline schema example, and by
 * lib/templates.js to understand how to render the output.
 *
 * TypeScript-style type reference:
 * {
 *   titre:           string           — type + summary of the request
 *   situation:       string           — 2–3 sentence analysis
 *   conditions:      string[]         — eligibility conditions
 *   documents:       DocumentItem[]   — required documents
 *   etapes:          StepItem[]       — numbered steps to follow
 *   delais:          string           — processing time + practical info
 *   avertissements:  string[]         — MUST include the legal limit warning
 *   organismes:      OrgItem[]        — Guiana agencies with contact info
 * }
 *
 * DocumentItem: { nom, detail, obligatoire }
 * StepItem:     { titre, detail }
 * OrgItem:      { nom, adresse, tel, horaires }
 */
export const CONTENT_SCHEMA = Object.freeze({
  titre:          'Type de demande + résumé en une phrase',
  situation:      'Analyse de la situation du client en 2–3 phrases',
  conditions:     [
    'Condition d\'éligibilité 1',
    'Condition d\'éligibilité 2'
  ],
  documents: [
    { nom: 'Nom du document', detail: 'Comment l\'obtenir ou où le trouver', obligatoire: true },
    { nom: 'Autre document',  detail: '...',                                  obligatoire: false }
  ],
  etapes: [
    { titre: 'Titre de l\'étape', detail: 'Ce qu\'il faut faire concrètement' }
  ],
  delais: 'Délais habituels de traitement et informations pratiques',
  avertissements: [
    'Ce document est une aide à la préparation. Il ne remplace pas un conseil juridique professionnel.'
  ],
  organismes: [
    { nom: 'Préfecture de Guyane', adresse: '...', tel: '...', horaires: '...' }
  ]
});

/* ── PROMPT BUILDER ──────────────────────────────────────── */

/**
 * Build the AI prompt for this service.
 * Called by lib/content.js buildPrompt() when order.service === 'sejour'.
 *
 * @param {object} details  - order.details (form answers from the wizard)
 * @param {object} personal - { prenom, nom, email, whatsapp }
 * @returns {{ prompt: string, format: 'json' }}
 */
export function buildPrompt(details, personal) {
  const nom    = [personal.prenom, personal.nom].filter(Boolean).join(' ');
  const email  = personal.email    || '';
  const tel    = personal.whatsapp || '';
  const choice = details['sw-choice'] || '';

  const schemaStr = JSON.stringify(CONTENT_SCHEMA, null, 2);

  const prompt = `Expert droit des étrangers France/Guyane. Produis un guide JSON personnalisé pour ce client.
Respecte EXACTEMENT ce schéma JSON :
${schemaStr}

ANALYSE PRÉALABLE (selon le choix du client) :
- premiere_demande    → identifier le titre adapté (VLS-TS, CST vie privée, étudiant, salarié, passeport talent…) selon nationalité + situation
- renouvellement      → vérifier délai (2 mois avant expiration), pièces exigées, cas de refus possible
- regularisation      → analyser admission exceptionnelle au séjour (AES) : circulaire Valls, ancienneté, intégration, travail
- information         → cadrer les droits, délais, recours et orientation vers l'interlocuteur adapté

SPÉCIFICITÉS GUYANE OBLIGATOIRES :
- Préfecture de Guyane : 2 Cité Rebard, 97300 Cayenne — 05 94 39 45 00 — rendez-vous uniquement (prise en ligne)
- Délais réels Guyane : 6 à 18 mois selon la nature du titre (contexte territorial + volume dossiers)
- Récépissé de demande : droit au séjour pendant l'instruction, à renouveler tous les 3 à 6 mois
- CIMADE Guyane (aide juridique gratuite) : 05 94 30 48 87
- Sous-préfecture Saint-Laurent-du-Maroni pour l'Ouest guyanais
- Tribunal administratif de Cayenne pour les recours

RÈGLES ABSOLUES :
1. N'invente aucune information non fournie par le client.
2. Corrige orthographe et grammaire silencieusement.
3. Mentionne les accords bilatéraux applicables selon la nationalité (UE, accord franco-haïtien, accord franco-algérien, etc.).
4. Indique toujours la voie de recours (gracieux / hiérarchique / contentieux — Tribunal administratif de Cayenne, délai 2 mois).
5. avertissements DOIT contenir : "Ce document est une aide à la préparation. Il ne remplace pas un conseil juridique professionnel. Pour un dossier sensible, consultez la CIMADE Guyane ou un avocat en droit des étrangers."
6. organismes DOIT inclure la Préfecture de Guyane avec coordonnées réelles, et au moins un organisme de soutien (CIMADE, Secours Catholique, France Terre d'Asile selon le cas).
7. etapes : concrètes, numérotées implicitement, avec délais indicatifs.
8. documents : distinguer obligatoire (true) des documents utiles (false) et préciser où/comment les obtenir en Guyane.
9. Réponds UNIQUEMENT avec l'objet JSON valide. Zéro texte avant ou après.

Données client :
Nom : ${nom}
Email : ${email}
Téléphone : ${tel}
Nationalité : ${details.nationalite || 'non précisée'}
Choix : ${choice}
Visa / titre actuel : ${details.visa_actuel || 'non précisé'}
Date d'expiration : ${details.date_expiration || 'non précisée'}
Durée de présence en France/Guyane : ${details.duree_presence || 'non précisée'}
Situation professionnelle : ${details.situation_pro || 'non précisée'}
Situation familiale : ${details.famille || 'non précisée'}
Historique de refus : ${details.historique_refus || 'non précisé'}
Situation détaillée : ${details.situation || ''}
Documents disponibles : ${details.documents || 'non précisés'}`;

  return { prompt, format: 'json' };
}
