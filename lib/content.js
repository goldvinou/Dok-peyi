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
import { buildPrompt as sejourBuildPrompt } from './services/sejour.js';
import { buildPrompt as impotBuildPrompt }  from './services/impot.js';

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
    prompt: `Tu es expert en rédaction de CV professionnels.
Génère le contenu d'un CV pour ce client. Respecte ce schéma JSON exactement :
${schema}

Règles :
- N'invente aucune information non fournie.
- Corrige les fautes d'orthographe et de grammaire.
- Omets les sections sans données (ex. pas d'expérience → omets "experiences").
- bullets : 1–3 points par expérience, commencer par un verbe d'action.
${JSON_INSTRUCTION}

Données client :
Nom : ${nom} | Email : ${email} | Tél : ${tel}
Poste recherché : ${d.poste || ''}
Expériences : ${d.experience || ''}
Formation : ${d.formation || ''}
Compétences : ${d.competences || ''}
Informations : ${d.infos || ''}`
  };
}

/** CV à améliorer — returns HTML (client sends existing CV text) */
function _cvImprovPrompt(nom, email, tel, d) {
  return {
    format: 'html',
    prompt: `Tu es expert en design et rédaction de CV. Modernise et améliore ce CV.
Client : ${nom} | Email : ${email} | Tél : ${tel}
Souhaits : ${d.note || ''}
Design : en-tête #1e3a5f, corps blanc, accents #2563eb, @media print marges 15mm.
${HTML_INSTRUCTION}`
  };
}

/** Lettre de motivation — returns HTML */
function _lettrePrompt(nom, email, tel, d, choice) {
  return {
    format: 'html',
    prompt: `Tu es expert en lettres de motivation. Rédige une lettre professionnelle en HTML (CSS inline, A4).
Candidat : ${nom} | Email : ${email} | Tél : ${tel}
Poste : ${d.poste || ''} | Entreprise : ${d.entreprise || ''}
Expérience : ${d.experience || ''} | Motivation : ${d.motivation || ''}
Notes / lettre existante : ${d.note || ''}
Type : ${choice}
Structure : coordonnées candidat (gauche) / date + destinataire (droite) / objet en gras / corps / formule.
Marges 25mm, typographie professionnelle.
${HTML_INSTRUCTION}`
  };
}

/** Courrier officiel — returns HTML */
function _courrierPrompt(nom, email, tel, d, choice) {
  return {
    format: 'html',
    prompt: `Tu es expert en courriers officiels français. Rédige un courrier formel en HTML (CSS inline, A4).
Expéditeur : ${nom} | Email : ${email} | Tél : ${tel}
Destinataire : ${d.destinataire || ''} | Objet : ${d.objet || ''} | Type : ${choice}
Situation : ${d.description || ''}
Structure : coordonnées (gauche) / ville+date (droite) / destinataire / objet gras / corps / formule officielle.
Marges 25mm.
${HTML_INSTRUCTION}`
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
