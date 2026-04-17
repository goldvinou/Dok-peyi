/* ============================================================
   DOK'PÉYI — Content Schema & Prompt Builder  (lib/content.js)
   ES module — imported by lib/pipeline.js only.

   Service-specific modules:
     lib/services/sejour.js — buildPrompt delegated there

   Responsibilities:
     1. Define the structured JSON schema the AI must return per service
     2. Build the AI prompt from an order (replaces client-side swBuildPrompt)
     3. Parse + validate the AI response into a content object
     4. Expose a `format` flag so the pipeline knows how to process the reply

   Two rendering modes
   ───────────────────
   format = 'json'  → AI returns a structured JSON object.
                      lib/templates.js renders it into the final HTML.
                      Deterministic layout; AI controls ONLY content.
                      Currently: cv (scratch + pro).

   format = 'html'  → AI returns a complete HTML document directly.
                      lib/templates.js passes it through unchanged.
                      Used for services not yet templated (legacy path).
                      Currently: lettre, courrier, dossier, sejour, cv/improve.
   ============================================================ */


/* ── JSON SCHEMA DEFINITIONS (documentation only) ────────── */
/*
 * CV JSON schema  (format = 'json')
 * ─────────────────────────────────
 * {
 *   "meta":     { "poste": "Job title shown in header" },
 *   "sections": [
 *     { "id": "profil",      "title": "Profil",                      "type": "paragraph",
 *       "content": "2–3 sentence summary" },
 *     { "id": "experiences", "title": "Expériences professionnelles", "type": "items",
 *       "items": [{ "title": "...", "subtitle": "...", "period": "...", "bullets": ["..."] }] },
 *     { "id": "formation",   "title": "Formation",                    "type": "items",
 *       "items": [{ "title": "...", "subtitle": "...", "period": "..." }] },
 *     { "id": "competences", "title": "Compétences",                  "type": "chips",
 *       "items": ["skill1", "skill2"] },
 *     { "id": "infos",       "title": "Informations",                 "type": "paragraph",
 *       "content": "..." }
 *   ]
 * }
 *
 * Section types
 * ─────────────
 * paragraph  → { content: string }
 * items      → { items: Array<{ title, subtitle?, period?, bullets? }> }
 * chips      → { items: string[] }
 */


/* ── PROMPT BUILDERS ──────────────────────────────────────── */

/**
 * Build the prompt to send to the AI for a given order.
 *
 * @param {object} order  - Full order object (needs .service, .details, .prenom, .nom, .email, .whatsapp)
 * @returns {{ prompt: string, format: 'json'|'html' }}
 */
export function buildPrompt(order) {
  const service = order.service || '';
  const details = order.details || {};
  const choice  = details['sw-choice'] || details['cv-choix'] || '';
  const nom     = [order.prenom, order.nom].filter(Boolean).join(' ');
  const email   = order.email    || '';
  const tel     = order.whatsapp || '';

  switch (service) {
    case 'cv':
      if (choice === 'improve') return _cvImprovPrompt(nom, email, tel, details);
      return _cvScratchPrompt(nom, email, tel, details);

    case 'lettre':
      return _lettrePrompt(nom, email, tel, details, choice);

    case 'courrier':
      return _courrierPrompt(nom, email, tel, details, choice);

    case 'dossier':
      return _dossierPrompt(nom, email, tel, details, choice);

    case 'sejour':
      // Delegated entirely to the isolated service module
      return sejourBuildPrompt(details, { prenom: order.prenom, nom: order.nom, email, whatsapp: tel });

    case 'impot':
      // Delegated entirely to the isolated service module
      return impotBuildPrompt(details, { prenom: order.prenom, nom: order.nom, email, whatsapp: tel });

    case 'naturalisation':
      // Delegated entirely to the isolated service module
      return naturalisationBuildPrompt(details, { prenom: order.prenom, nom: order.nom, email, whatsapp: tel });

    default:
      return {
        prompt: `Tu es un assistant administratif. Génère un document HTML complet (CSS inline, format A4) pour : ${nom}. Réponds UNIQUEMENT avec le code HTML complet.`,
        format: 'html'
      };
  }
}

/**
 * Parse the raw text returned by the AI into a content object.
 *
 * @param {string} raw    - Raw text from the AI.
 * @param {'json'|'html'} format - Expected format.
 * @returns {{ ok: boolean, content: object|string, error?: string }}
 *   For html format: content is the HTML string.
 *   For json format: content is the parsed object.
 */
export function parseContent(raw, format) {
  const cleaned = (raw || '')
    .replace(/^```(?:json|html)?\s*/i, '')
    .replace(/\s*```\s*$/i, '')
    .trim();

  if (format === 'html') {
    return { ok: true, content: cleaned };
  }

  // json format
  try {
    const parsed = JSON.parse(cleaned);
    return { ok: true, content: parsed };
  } catch (err) {
    return {
      ok:      false,
      content: cleaned,   // keep raw for debugging
      error:   `JSON invalide : ${err.message}`
    };
  }
}


/* ── IMPORTS ─────────────────────────────────────────────── */
import { buildPrompt as sejourBuildPrompt }         from './services/sejour.js';
import { buildPrompt as impotBuildPrompt }          from './services/impot.js';
import { buildPrompt as naturalisationBuildPrompt } from './services/naturalisation.js';

/* ── INTERNAL PROMPT BUILDERS ─────────────────────────────── */

const HTML_INSTRUCTION =
  'Réponds UNIQUEMENT avec le code HTML complet (<!DOCTYPE html> … </html>). Zéro texte avant ou après.';

const JSON_INSTRUCTION =
  'Réponds UNIQUEMENT avec le JSON valide correspondant au schéma. Zéro texte avant ou après.';

/** CV créé de zéro — returns JSON format */
function _cvScratchPrompt(nom, email, tel, d) {
  const schema = JSON.stringify({
    meta:     { poste: 'poste visé' },
    sections: [
      { id: 'profil',      title: 'Profil',                      type: 'paragraph', content: '...' },
      { id: 'experiences', title: 'Expériences professionnelles', type: 'items',
        items: [{ title: '...', subtitle: '...', period: '...', bullets: ['...'] }] },
      { id: 'formation',   title: 'Formation',                    type: 'items',
        items: [{ title: '...', subtitle: '...', period: '...' }] },
      { id: 'competences', title: 'Compétences',                  type: 'chips', items: ['...'] },
      { id: 'infos',       title: 'Informations',                 type: 'paragraph', content: '...' }
    ]
  }, null, 2);

  return {
    format: 'json',
    prompt: `Expert CV France/Guyane. Génère le contenu JSON pour ce profil.

DÉTECTION SECTEUR automatique selon poste/expérience :
- Santé/médico-social → vocabulaire soins, certifications, protocoles
- BTP/industrie → habilitations, chantiers, matériaux, sécurité
- Commerce/vente → CA réalisé, portefeuille clients, objectifs
- Éducation/formation → pédagogie, niveaux, résultats élèves
- Administration/juridique → procédures, conformité, textes réglementaires
- Agriculture/environnement → cultures, techniques, certifications
- Autre → vocabulaire professionnel adapté

PROFIL JUNIOR (0-3 ans exp) : valoriser formations, stages, projets, compétences transverses, motivation
PROFIL CONFIRMÉ (4-10 ans) : valoriser réalisations chiffrées, progression, responsabilités
PROFIL SENIOR (10+ ans) : valoriser impact, management, expertise, transmission

RÈGLES :
- Verbes d'action en début de bullet (Géré, Développé, Optimisé, Supervisé)
- Réalisations chiffrées si données disponibles (ex: 'Géré une équipe de 8 personnes')
- Jamais de bullet vide ou générique type 'Travail en équipe'
- Accroche (summary) : 3 lignes max, percutante, spécifique au poste visé
Respecte EXACTEMENT ce schéma JSON : ${schema}
Client : ${nom} | Email : ${email} | Tél : ${tel} | Poste : ${d.poste || ''} | Exp : ${d.experience || ''} | Formation : ${d.formation || ''} | Compétences : ${d.competences || ''} | Infos : ${d.infos || ''}
RÉPONDS UNIQUEMENT avec le JSON valide. Zéro texte avant ou après.`
  };
}

/** CV à améliorer — returns HTML (client sends existing CV text) */
function _cvImprovPrompt(nom, email, tel, d) {
  return {
    format: 'html',
    prompt: `Expert CV. Analyse et améliore ce CV existant.
DIAGNOSTIC D'ABORD : identifie les 3 faiblesses principales (accroche faible, bullets vagues, mise en page, manque de chiffres, etc.)
AMÉLIORATIONS :
- Renforce chaque bullet avec verbe d'action + résultat concret
- Réécris l'accroche pour qu'elle soit spécifique au poste visé
- Ajoute les chiffres manquants si déductibles du contexte
- Améliore la hiérarchie visuelle (titres, espacement, couleurs)
Design : en-tête #1e3a5f, corps blanc, accents #2563eb, @media print marges 15mm
Client : ${nom} | Souhaits : ${d.note || ''}
RÉPONDS UNIQUEMENT avec le HTML complet.`
  };
}

/** Lettre de motivation — returns HTML */
function _lettrePrompt(nom, email, tel, d, choice) {
  if (choice === 'improve') return _lettreImprovePrompt(nom, d);
  if (choice === 'adapt')   return _lettreAdaptPrompt(nom, d);
  return _lettreCreatePrompt(nom, email, tel, d);
}

function _lettreCreatePrompt(nom, email, tel, d) {
  return {
    format: 'html',
    prompt: `Expert lettres de motivation France/Guyane. Rédige une lettre HTML A4 CSS-inline.

DÉTECTION TON automatique :
- Secteur public/administration → formel, valeurs service public, stabilité
- Santé/social → empathie, engagement humain, vocation
- BTP/technique → compétences concrètes, fiabilité, expérience terrain
- Commerce/privé → dynamisme, résultats, orientation client
- Éducation → pédagogie, patience, transmission
- Autre → professionnel et direct

STRUCTURE OBLIGATOIRE :
Coordonnées candidat (gauche) | Date + ville (droite)
Destinataire + entreprise
Objet : Candidature au poste de ${d.poste || ''}
§1 ACCROCHE (2 lignes max) : élément différenciant, jamais 'Je me permets de vous adresser'
§2 POURQUOI EUX : ce que le candidat sait de l'entreprise/poste + adéquation réelle
§3 POURQUOI LUI : 2-3 réalisations concrètes et chiffrées liées au poste
§4 PROJECTION : ce qu'il apportera, ton enthousiaste mais factuel
Formule : 'Dans l'attente de vous rencontrer, je reste disponible pour un entretien à votre convenance.'
Signature manuscrite simulée en italique

Marges 25mm. Longueur : 3/4 de page max.
Client : ${nom} | Email : ${email} | Tél : ${tel} | Poste : ${d.poste || ''} | Entreprise : ${d.entreprise || ''} | Exp : ${d.experience || ''} | Motivation : ${d.motivation || ''}
RÈGLE : zéro formule d'accroche générique. Si entreprise inconnue, adapter sans inventer.`
  };
}

function _lettreImprovePrompt(nom, d) {
  return {
    format: 'html',
    prompt: `Expert lettres de motivation. Améliore cette lettre existante.
DIAGNOSTIC : identifie les 3 problèmes principaux (accroche, longueur, ton, manque de spécificité, formules usées)
CORRECTIONS :
- Réécris l'accroche si générique
- Remplace les formules creuses par du concret
- Coupe tout ce qui dépasse 3/4 de page
- Aligne le ton sur le secteur détecté
Conserve la structure HTML existante, améliore uniquement le contenu.
Client : ${nom} | Poste : ${d.poste || ''} | Souhaits : ${d.note || ''}`
  };
}

function _lettreAdaptPrompt(nom, d) {
  return {
    format: 'html',
    prompt: `Expert lettres de motivation. Adapte cette lettre existante pour un nouveau poste.
ANALYSE : extraire les 3 points forts de la lettre originale à conserver
ADAPTATION :
- Réécris §2 (pourquoi eux) pour la nouvelle entreprise/poste
- Ajuste §3 pour mettre en avant les expériences pertinentes pour ce poste
- Modifie l'objet et les références entreprise
- Conserve le ton et le style original
Client : ${nom} | Poste : ${d.poste || ''} | Entreprise : ${d.entreprise || ''} | Lettre originale dans note : ${d.note || ''}`
  };
}

/** Courrier officiel — returns HTML */
function _courrierPrompt(nom, email, tel, d, choice) {
  if (choice === 'reclamation')  return _courrierReclamationPrompt(nom, email, tel, d);
  if (choice === 'contestation') return _courrierContestationPrompt(nom, email, tel, d);
  return _courrierDemandePrompt(nom, email, tel, d);
}

function _courrierDemandePrompt(nom, email, tel, d) {
  return {
    format: 'html',
    prompt: `Expert courriers administratifs France/Guyane. Rédige un courrier de demande HTML A4 CSS-inline.
Structure : expéditeur (gauche) | Cayenne + date (droite) | destinataire | Objet en gras | corps | formule | signature
Corps en 3 paragraphes :
§1 CONTEXTE : qui est le demandeur, sa situation en 2 lignes
§2 DEMANDE : formulation précise de ce qui est demandé, base légale si applicable
§3 DÉLAI : demande de réponse sous X jours, coordonnées pour réponse
Formule selon destinataire :
- Préfet/Sous-préfet → 'Veuillez agréer, Monsieur le Préfet, l'expression de ma haute considération.'
- Directeur organisme → 'Veuillez agréer, Madame/Monsieur le Directeur, l'expression de ma considération distinguée.'
- Service générique → 'Dans l'attente de votre réponse, je vous adresse mes cordiales salutations.'
Client : ${nom} | Email : ${email} | Tél : ${tel} | Destinataire : ${d.destinataire || ''} | Objet : ${d.objet || ''} | Situation : ${d.description || ''}
RÈGLE : toujours préciser un délai de réponse attendu (15 jours ouvrés standard).`
  };
}

function _courrierReclamationPrompt(nom, email, tel, d) {
  return {
    format: 'html',
    prompt: `Expert courriers administratifs. Rédige un courrier de réclamation HTML A4 CSS-inline.
Structure identique + LRAR recommandé mentionné en bas.
Corps en 4 paragraphes :
§1 FAITS : chronologie précise avec dates, références dossier si disponibles
§2 PRÉJUDICE : impact concret subi (financier, administratif, délai)
§3 DEMANDE : action précise attendue + délai de 15 jours avant recours
§4 RECOURS POSSIBLE : mention discrète 'À défaut de réponse sous 15 jours, je me réserve le droit de saisir [médiateur/tribunal compétent].'
Référence légale selon objet :
- CAF/sécurité sociale → art. R.142-1 CSS
- Impôts → art. R.197-1 LPF
- Logement → loi ALUR ou loi du 6 juillet 1989
- Autre → mention générale du droit à réclamation
Client : ${nom} | Email : ${email} | Tél : ${tel} | Destinataire : ${d.destinataire || ''} | Objet : ${d.objet || ''} | Situation : ${d.description || ''}`
  };
}

function _courrierContestationPrompt(nom, email, tel, d) {
  return {
    format: 'html',
    prompt: `Expert courriers administratifs. Rédige un courrier de contestation HTML A4 CSS-inline.
Corps en 4 paragraphes :
§1 DÉCISION CONTESTÉE : référence exacte de la décision, date, organisme émetteur
§2 MOTIFS : arguments factuels et juridiques contre la décision — jamais émotionnel
§3 DEMANDE : révision ou annulation de la décision + délai
§4 VOIES DE RECOURS : mention du recours gracieux puis contentieux si besoin
Référence légale OBLIGATOIRE adaptée au type :
- Refus titre séjour → art. L.611-1 CESEDA + recours CNDA si asile
- Refus prestation sociale → art. L.142-1 CSS + tribunal judiciaire
- Décision fiscale → art. L.190 LPF + tribunal administratif
- Décision préfectorale → recours gracieux + tribunal administratif de Cayenne
Client : ${nom} | Email : ${email} | Tél : ${tel} | Destinataire : ${d.destinataire || ''} | Objet : ${d.objet || ''} | Situation : ${d.description || ''}
RÈGLE : ton neutre et factuel. Jamais agressif. La force vient des arguments juridiques.`
  };
}

/** Dossier administratif — returns HTML */
function _dossierPrompt(nom, email, tel, d, choice) {
  return {
    format: 'html',
    prompt: `Tu es expert en démarches administratives (France / Guyane). Génère un guide d'aide en HTML (CSS inline, A4).
Client : ${nom} | Email : ${email} | Tél : ${tel}
Type : ${d.type || choice} | Situation : ${d.description || ''} | Documents disponibles : ${d.documents || ''}
Contenu : 1) résumé 2) checklist documents ☐ 3) étapes numérotées 4) conseils et délais 5) organismes utiles.
En-tête #1e3a5f, accents #2563eb.
${HTML_INSTRUCTION}`
  };
}

// _sejourPrompt removed — logic moved to lib/services/sejour.js
