/* ============================================================
   DOK'PÉYI — Impôt Service  (lib/services/impot.js)
   ES module — single source of truth for this service.
   Imported by: lib/content.js.

   Canonical isolated definition of the "avis d'impôt" service.
   Modeled on lib/services/sejour.js.

   Three sub-types (choice):
     comprendre → décoder un avis d'imposition
     aide       → guide des aides / déductions / obligations
     courrier   → courrier officiel adressé à la DGFiP

   Integration points:
     lib/content.js → calls buildPrompt() to get { prompt, format }
   ============================================================ */

export const SERVICE_KEY = 'impot';

/* ── SERVICE CONFIG ──────────────────────────────────────── */
export const config = Object.freeze({
  key:   SERVICE_KEY,
  name:  "Avis d'impôt",
  icon:  '🧾',
  color: '#0369a1',
  light: '#e0f2fe',
  price: 10
});

/* ── MANDATORY REVIEW ────────────────────────────────────── */
export const REVIEW_REQUIRED = false;
export const REVIEW_REASON   = null;

/* ── INTAKE QUESTIONS ────────────────────────────────────── */
export const choices = Object.freeze([
  {
    id:    'comprendre',
    label: 'Comprendre mon avis',
    desc:  "Décoder mon avis d'imposition ou de non-imposition"
  },
  {
    id:    'aide',
    label: "Aide liée à l'impôt",
    desc:  'Réductions, exonérations, aides CAF, délais de paiement…'
  },
  {
    id:    'courrier',
    label: 'Écrire aux impôts',
    desc:  'Contester, demander un délai, faire une réclamation'
  }
]);

export const questions = Object.freeze({
  comprendre: [
    { id: 'type',        label: "Type d'avis *",               type: 'text',     required: true,  placeholder: "Ex : Avis d'imposition, avis de non-imposition, taxe foncière…" },
    { id: 'revenus',     label: 'Revenus annuels',             type: 'text',     required: false, placeholder: 'Ex : 18 000€/an, RSA uniquement, sans revenus…' },
    { id: 'situation',   label: 'Situation familiale',         type: 'text',     required: false, placeholder: 'Ex : Célibataire, marié(e) avec 2 enfants, veuf(ve)…' },
    { id: 'description', label: 'Votre question / demande *',  type: 'textarea', required: true,  placeholder: "Qu'est-ce que vous ne comprenez pas ? Quel type d'aide cherchez-vous ?" }
  ],
  aide: [
    { id: 'type',        label: "Type d'avis *",               type: 'text',     required: true,  placeholder: "Ex : Avis d'imposition, non-imposition, taxe foncière…" },
    { id: 'revenus',     label: 'Revenus annuels',             type: 'text',     required: false, placeholder: 'Ex : 18 000€/an, RSA, sans revenus…' },
    { id: 'situation',   label: 'Situation familiale',         type: 'text',     required: false, placeholder: 'Ex : Célibataire, marié(e) avec 2 enfants…' },
    { id: 'description', label: 'Votre question / demande *',  type: 'textarea', required: true,  placeholder: 'Quel type d\'aide ou de déduction cherchez-vous ?' }
  ],
  courrier: [
    { id: 'destinataire', label: 'Destinataire *',     type: 'text',     required: true,  placeholder: 'Ex : Trésor Public de Guyane, DGFiP, Centre des impôts de Cayenne…' },
    { id: 'objet',        label: 'Objet du courrier *', type: 'text',     required: true,  placeholder: "Ex : Demande de délai de paiement, contestation d'imposition…" },
    { id: 'description',  label: 'Votre situation *',   type: 'textarea', required: true,  placeholder: 'Expliquez votre situation et ce que vous demandez…' }
  ]
});

/* ── CONTENT SCHEMA ──────────────────────────────────────── */

/**
 * Conceptual structure of the document produced for each sub-type.
 * buildPrompt() emits HTML directly (format: 'html'), so this schema
 * is documentation-only — it describes the sections each mode must
 * contain. Used as a reference when tightening prompts or adding
 * post-generation validators.
 */
export const CONTENT_SCHEMA = Object.freeze({
  comprendre: {
    resume:           'Montant dû, échéance, situation fiscale (3 lignes max)',
    decomposition:    'Chaque ligne de l\'avis expliquée en langage simple',
    pointsAttention:  'Retards, pénalités, erreurs probables (surlignés)',
    prochaineEtape:   'Action concrète + date limite'
  },
  aide: {
    obligations:      'Ce que le client doit déclarer',
    deductions:       'Liste exhaustive applicable (charges, frais réels, abattement DOM-TOM 30–40%)',
    erreursFrequentes: '5 erreurs courantes pour ce profil',
    calendrierFiscal: 'Dates clés',
    contacts:         'DGFiP Guyane — 0809 401 401 · impots.gouv.fr'
  },
  courrier: {
    expediteur:    'Coordonnées du client (gauche)',
    lieuDate:      'Cayenne + date (droite)',
    destinataire:  'Monsieur le Directeur des Finances Publiques de Guyane — 13 rue Lallouette, 97300 Cayenne',
    objet:         'Objet en gras',
    corps:         'Motif + chronologie + demande + référence légale adaptée',
    formule:       'Formule officielle + signature',
    referenceLegale: 'L.257 A du LPF (délai) · R.197-1 du LPF (réclamation)'
  }
});

/* ── PROMPT BUILDER ──────────────────────────────────────── */

/**
 * Build the AI prompt for this service.
 * Called by lib/content.js buildPrompt() when order.service === 'impot'.
 *
 * @param {object} details  - order.details (form answers from the wizard)
 * @param {object} personal - { prenom, nom, email, whatsapp }
 * @returns {{ prompt: string, format: 'html' }}
 */
export function buildPrompt(details, personal) {
  const nom    = [personal.prenom, personal.nom].filter(Boolean).join(' ');
  const email  = personal.email    || '';
  const tel    = personal.whatsapp || '';
  const choice = details['sw-choice'] || '';

  if (choice === 'courrier') return _courrierPrompt(nom, email, tel, details);
  if (choice === 'aide')     return _aidePrompt(nom, details);
  return _comprendrePrompt(nom, details);
}

/* ── SUB-TYPE PROMPTS ────────────────────────────────────── */

function _comprendrePrompt(nom, d) {
  return {
    format: 'html',
    prompt: `Expert fiscal France/Guyane. Analyse cet avis d'imposition et produis un document HTML A4 CSS-inline structuré ainsi :
1. RÉSUMÉ (3 lignes max) : montant dû, échéance, situation fiscale
2. DÉCOMPOSITION LIGNE PAR LIGNE : chaque ligne de l'avis expliquée en langage simple
3. POINTS D'ATTENTION : surligné en orange si retard/pénalité/erreur probable
4. PROCHAINE ÉTAPE : action concrète à faire avant quelle date
Client : ${nom} | Revenus : ${d.revenus || ''} | Situation : ${d.situation || ''} | Question : ${d.description || ''}
RÈGLE : jamais de placeholder. Si donnée absente, adapte sans la mentionner.`
  };
}

function _aidePrompt(nom, d) {
  return {
    format: 'html',
    prompt: `Expert fiscal France/Guyane. Produis un guide HTML A4 CSS-inline :
1. OBLIGATIONS : ce que ce client doit déclarer selon sa situation
2. DÉDUCTIONS POSSIBLES : liste exhaustive applicable à son profil (charges familiales, frais réels, DOM-TOM abattement 30-40%)
3. ERREURS FRÉQUENTES : 5 erreurs courantes pour ce profil
4. CALENDRIER FISCAL : dates clés pour sa situation
5. CONTACTS UTILES : DGFiP Guyane — 0809 401 401 / impots.gouv.fr
Client : ${nom} | Revenus : ${d.revenus || ''} | Situation familiale : ${d.situation || ''} | Question : ${d.description || ''}
RÈGLE : abattement DOM-TOM toujours mentionné si applicable.`
  };
}

function _courrierPrompt(nom, email, tel, d) {
  return {
    format: 'html',
    prompt: `Expert fiscal. Rédige un courrier HTML A4 CSS-inline adressé à la DGFiP.
Structure : expéditeur (gauche) / Cayenne + date (droite) / destinataire / objet en gras / corps / formule officielle / signature
Destinataire : Monsieur le Directeur des Finances Publiques de Guyane — 13 rue Lallouette, 97300 Cayenne
Types de courrier selon l'objet :
- Demande de délai : motif légitime + proposition de plan d'apurement + référence article L.257 A du LPF
- Réclamation : faits chronologiques + préjudice + demande de révision + référence article R.197-1 du LPF
- Demande d'information : objet précis + référence avis + coordonnées
Client : ${nom} | Email : ${email} | Tél : ${tel} | Objet : ${d.objet || ''} | Situation : ${d.description || ''}
RÈGLE : toujours inclure la référence légale adaptée au type de courrier.`
  };
}
