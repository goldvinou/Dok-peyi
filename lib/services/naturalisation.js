/* ============================================================
   DOK'PÉYI — Naturalisation Service  (lib/services/naturalisation.js)
   ES module — single source of truth for this service.
   Imported by: lib/content.js.

   Canonical isolated definition of the "naturalisation" service.
   Modeled on lib/services/sejour.js.

   Three sub-types (choice):
     situation → analyse d'éligibilité
     dossier   → guide de constitution de dossier
     lettre    → lettre de motivation pour le Préfet

   Model: claude-sonnet-4-5 (upgrade vers Opus après validation).
   Review admin obligatoire avant livraison (comme sejour).

   Integration points:
     lib/content.js → calls buildPrompt() to get { prompt, format }
     lib/review.js  → reads REVIEW_REQUIRED and REVIEW_REASON
   ============================================================ */

export const SERVICE_KEY = 'naturalisation';

/* ── SERVICE CONFIG ──────────────────────────────────────── */
export const config = Object.freeze({
  key:   SERVICE_KEY,
  name:  'Naturalisation',
  icon:  '🇫🇷',
  color: '#1d4ed8',
  light: '#eff6ff',
  price: 20,
  model: 'claude-sonnet-4-5'
});

/* ── MANDATORY REVIEW ────────────────────────────────────── */
export const REVIEW_REQUIRED = true;

export const REVIEW_REASON =
  'Naturalisation : vérification manuelle obligatoire avant tout traitement.';

/* ── INTAKE QUESTIONS ────────────────────────────────────── */
export const choices = Object.freeze([
  {
    id:    'situation',
    label: 'Vérifier mon éligibilité',
    desc:  'Suis-je en mesure de faire une demande ?'
  },
  {
    id:    'dossier',
    label: 'Préparer mon dossier',
    desc:  'Liste complète des documents et étapes à suivre'
  },
  {
    id:    'lettre',
    label: "Lettre d'intégration",
    desc:  'Rédiger ma lettre de motivation de vie en France'
  }
]);

export const questions = Object.freeze({
  situation: [
    { id: 'nationalite', label: 'Nationalité actuelle *',         type: 'text',     required: true,  placeholder: 'Ex : Haïtienne, Brésilienne, Camerounaise…' },
    { id: 'duree',       label: 'Durée de résidence en France *', type: 'text',     required: true,  placeholder: 'Ex : 5 ans, depuis 2018…' },
    { id: 'famille',     label: 'Situation familiale',            type: 'text',     required: false, placeholder: "Ex : Marié(e) à un(e) Français(e), enfants nés en France…" },
    { id: 'travail',     label: 'Situation professionnelle',      type: 'text',     required: false, placeholder: 'Ex : CDI, fonctionnaire, auto-entrepreneur, sans emploi…' },
    { id: 'situation',   label: 'Informations complémentaires',   type: 'textarea', required: false, placeholder: 'Casier judiciaire vierge ? Niveau de français ? Titre de séjour actuel ?' }
  ],
  dossier: [
    { id: 'nationalite', label: 'Nationalité actuelle *',         type: 'text',     required: true,  placeholder: 'Ex : Haïtienne, Brésilienne, Camerounaise…' },
    { id: 'duree',       label: 'Durée de résidence en France *', type: 'text',     required: true,  placeholder: 'Ex : 5 ans, depuis 2018…' },
    { id: 'famille',     label: 'Situation familiale',            type: 'text',     required: false, placeholder: "Ex : Marié(e) à un(e) Français(e), enfants nés en France…" },
    { id: 'travail',     label: 'Situation professionnelle',      type: 'text',     required: false, placeholder: 'Ex : CDI, fonctionnaire, auto-entrepreneur, sans emploi…' },
    { id: 'documents',   label: 'Documents dont vous disposez',   type: 'textarea', required: false, placeholder: "Passeport, titre de séjour, actes d'état civil, diplômes, bulletins de salaire…" }
  ],
  lettre: [
    { id: 'nationalite', label: 'Nationalité actuelle *',             type: 'text',     required: true,  placeholder: 'Ex : Haïtienne, Brésilienne, Camerounaise…' },
    { id: 'duree',       label: 'Durée de résidence en France *',     type: 'text',     required: true,  placeholder: 'Ex : 5 ans, depuis 2018…' },
    { id: 'parcours',    label: 'Votre parcours en France *',         type: 'textarea', required: true,  placeholder: 'Vie sociale, emploi, associations, liens avec la France…' },
    { id: 'famille',     label: 'Situation familiale',                type: 'text',     required: false, placeholder: "Ex : Marié(e) à un(e) Français(e), enfants nés en France…" },
    { id: 'motivation',  label: 'Pourquoi souhaitez-vous la nationalité ?', type: 'textarea', required: false, placeholder: 'Vos raisons personnelles, votre attachement aux valeurs françaises…' }
  ]
});

/* ── CONTENT SCHEMA ──────────────────────────────────────── */

/**
 * JSON structure documenting the output per sub-type.
 * buildPrompt() emits HTML directly (format: 'html'), so this schema
 * is a reference for what each section must contain.
 *
 * {
 *   titre:          string
 *   sous_titre:     string
 *   verdict:        string    — situation uniquement
 *   criteres:       Array<{ nom, statut, detail }>    — situation uniquement
 *   sections:       Array<{ titre, contenu: string | string[] }>
 *   documents:      Array<{ nom, obligatoire: bool, validite, original: bool, traduction: bool }>  — dossier uniquement
 *   avertissements: string[]
 *   contact:        { nom, adresse, telephone, site }
 * }
 */
export const CONTENT_SCHEMA = Object.freeze({
  titre:      'Titre du document',
  sous_titre: 'Sous-titre contextualisant la demande',
  verdict:    "Éligible | Probablement éligible | Insuffisant (situation uniquement)",
  criteres: [
    { nom: 'Durée de résidence', statut: '✅ | ⚠️ | ❌', detail: 'Justification' }
  ],
  sections: [
    { titre: 'Titre de section', contenu: 'Texte ou tableau de points' }
  ],
  documents: [
    { nom: 'Nom du document', obligatoire: true, validite: 'Durée de validité', original: true, traduction: false }
  ],
  avertissements: [
    "Ce document est une aide à la préparation. Il ne remplace pas un conseil juridique. Consultez un avocat ou une association d'aide aux étrangers pour votre dossier officiel."
  ],
  contact: {
    nom:       'Préfecture de Guyane',
    adresse:   '2 Cité Rebard, 97300 Cayenne',
    telephone: '05 94 39 45 00',
    site:      'naturalisation.interieur.gouv.fr'
  }
});

/* ── PROMPT BUILDER ──────────────────────────────────────── */

/**
 * Build the AI prompt for this service.
 * Called by lib/content.js buildPrompt() when order.service === 'naturalisation'.
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

  if (choice === 'lettre')  return _lettrePrompt(nom, email, tel, details);
  if (choice === 'dossier') return _dossierPrompt(nom, details);
  return _situationPrompt(nom, details);
}

/* ── SUB-TYPE PROMPTS ────────────────────────────────────── */

function _situationPrompt(nom, d) {
  return {
    format: 'html',
    prompt: `Expert naturalisation France/Guyane. Analyse l'éligibilité de ce client et produis un guide HTML A4 CSS-inline :
1. ÉLIGIBILITÉ : verdict clair (Éligible / Probablement éligible / Insuffisant) + justification selon critères légaux
2. CRITÈRES VÉRIFIÉS : tableau — Durée résidence (≥5 ans requis) / Intégration / Ressources stables / Casier judiciaire / Langue française — statut ✅ ⚠️ ❌ pour chaque
3. POINTS BLOQUANTS : si non éligible, exact motif légal + délai avant rééligibilité
4. PROCHAINE ÉTAPE : action concrète et délai
5. CONTACT : Préfecture de Guyane — 2 Cité Rebard, 97300 Cayenne — 05 94 39 45 00
Client : ${nom} | Nationalité : ${d.nationalite || ''} | Durée résidence : ${d.duree || ''} | Famille : ${d.famille || ''} | Travail : ${d.travail || ''} | Situation : ${d.situation || ''}
AVERTISSEMENT LÉGAL OBLIGATOIRE en rouge : 'Ce document est une aide à la préparation. Il ne remplace pas un conseil juridique. Consultez un avocat ou une association d'aide aux étrangers pour votre dossier officiel.'`
  };
}

function _dossierPrompt(nom, d) {
  return {
    format: 'html',
    prompt: `Expert naturalisation France/Guyane. Produis un guide de constitution de dossier HTML A4 CSS-inline :
1. DOCUMENTS OBLIGATOIRES : liste exhaustive avec ☐ checkbox, validité, original ou copie, traduction requise oui/non
2. DOCUMENTS COMPLÉMENTAIRES : pièces renforçant le dossier selon le profil client
3. PREUVES D'INTÉGRATION : liste adaptée au profil (travail, enfants scolarisés, associations, impôts, logement stable)
4. PIÈGES À ÉVITER : 5 erreurs qui font rejeter un dossier en Guyane
5. DÉPÔT : Préfecture Guyane — sur rendez-vous uniquement — 05 94 39 45 00
6. DÉLAIS : instruction 12-18 mois en Guyane, suivi dossier possible sur naturalisation.interieur.gouv.fr
Client : ${nom} | Nationalité : ${d.nationalite || ''} | Durée résidence : ${d.duree || ''} | Documents disponibles : ${d.documents || ''}
AVERTISSEMENT LÉGAL OBLIGATOIRE.`
  };
}

function _lettrePrompt(nom, email, tel, d) {
  return {
    format: 'html',
    prompt: `Expert naturalisation. Rédige une lettre de motivation HTML A4 CSS-inline pour une demande de naturalisation.
Structure : expéditeur / Cayenne + date / Monsieur le Préfet de Guyane, 2 Cité Rebard 97300 Cayenne / Objet : Demande de naturalisation française / corps / formule / signature
Corps en 4 paragraphes :
§1 PRÉSENTATION : identité, nationalité, durée de résidence en France/Guyane
§2 INTÉGRATION : vie professionnelle, sociale, familiale — concret et chiffré
§3 ATTACHEMENT : pourquoi la France, valeurs républicaines, contribution à la société
§4 ENGAGEMENT : respect des lois, projet de vie en France
Ton : respectueux, sincère, factuel — jamais suppliant
Client : ${nom} | Nationalité : ${d.nationalite || ''} | Durée résidence : ${d.duree || ''} | Famille : ${d.famille || ''} | Travail : ${d.travail || ''} | Motivation : ${d.motivation || d.parcours || ''}
RÈGLE : personnaliser chaque paragraphe avec les données réelles du client. Zéro formule générique.`
  };
}
