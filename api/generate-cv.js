const https = require('https');

function callAnthropic(apiKey, prompt) {
  return new Promise((resolve, reject) => {
    const bodyStr = JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }]
    });
    const options = {
      hostname: 'api.anthropic.com',
      path:     '/v1/messages',
      method:   'POST',
      headers: {
        'x-api-key':         apiKey,
        'anthropic-version': '2023-06-01',
        'content-type':      'application/json',
        'content-length':    Buffer.byteLength(bodyStr)
      }
    };
    const req = https.request(options, res => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end',  () => resolve({ status: res.statusCode, body: data }));
    });
    req.on('error', reject);
    req.write(bodyStr);
    req.end();
  });
}

function buildPrompt(demande) {
  const d       = demande.details || {};
  const service = demande.service || 'cv';
  const nom     = `${demande.prenom || ''} ${demande.nom || ''}`.trim();
  const email   = demande.email    || '';
  const tel     = demande.whatsapp || '';

  const FOOTER = `\nRéponds UNIQUEMENT avec le code HTML complet (<!DOCTYPE html> … </html>). Zéro texte avant ou après.`;
  const PRINT   = '@media print { body { margin: 20mm; } }';

  if (service === 'cv') {
    const choix = d['cv-choix'] || 'scratch';

    if (choix === 'improve') {
      return `Tu es un expert en design et rédaction de CV professionnels.
Un client souhaite améliorer et moderniser son CV existant.

=== INFORMATIONS DU CLIENT ===
Nom complet : ${nom}
Email : ${email}
Téléphone : ${tel}

=== SOUHAITS DE MODIFICATION ===
${d['cv-note'] || 'Moderniser le design, rendre plus professionnel'}

=== CONSIGNES ===
Génère un CV HTML moderne et professionnel en intégrant les souhaits du client.
Applique toutes les modifications demandées (reformuler, ajouter sections, améliorer mise en page…).

=== DESIGN ===
- En-tête fond bleu marine #1e3a5f : nom en grand, email, téléphone
- Corps blanc : Expériences → Formation → Compétences
- Typographie system-ui/Arial, accents #2563eb pour les titres de section
- ${PRINT}
${FOOTER}`;
    }

    return `Tu es un expert en design et rédaction de CV professionnels.
Crée un CV complet, moderne et professionnel en HTML autonome (CSS inline, sans JS, format A4).

=== DONNÉES DU CLIENT ===
Nom complet : ${nom}
Email : ${email}
Téléphone : ${tel}
Poste recherché : ${d['cv-poste'] || 'Non précisé'}
Expériences : ${d['cv-experience'] || 'Non précisées'}
Formation : ${d['cv-formation']   || 'Non précisée'}
Compétences : ${d['cv-competences'] || 'Non précisées'}
Informations : ${d['cv-infos'] || ''}

=== DESIGN ===
- En-tête fond bleu marine #1e3a5f : nom en grand, poste, email, téléphone
- Corps blanc : Expériences → Formation → Compétences → Infos
- Typographie system-ui/Arial, accents #2563eb pour les titres de section
- Séparateurs subtils, layout 1-2 pages
- ${PRINT}
${FOOTER}`;
  }

  if (service === 'lettre') {
    return `Tu es un expert en rédaction de lettres de motivation professionnelles.
Rédige une lettre de motivation complète, personnalisée et convaincante en HTML (CSS inline, sans JS, format A4).

=== INFORMATIONS DU CANDIDAT ===
Nom complet : ${nom}
Email : ${email}
Téléphone : ${tel}
Poste visé : ${d['l-poste']      || 'Non précisé'}
Entreprise : ${d['l-entreprise'] || 'Non précisée'}
Expérience : ${d['l-experience'] || 'Non précisée'}
Motivation : ${d['l-motivation'] || 'Non précisée'}

=== STRUCTURE ===
- Coordonnées candidat (haut gauche), date + destinataire (haut droite)
- Objet en gras
- Corps : Introduction percutante → Pourquoi ce poste / cette entreprise → Ce que j'apporte → Conclusion + appel à action
- Formule de politesse professionnelle, signature

=== DESIGN ===
- Format A4, marges 25mm, typographie system-ui/Arial
- Ton professionnel, dynamique et personnalisé
- ${PRINT}
${FOOTER}`;
  }

  if (service === 'dossier') {
    return `Tu es un expert en démarches administratives (France / Guyane).
Génère un document d'aide complet et pratique en HTML (CSS inline, sans JS, format A4).

=== INFORMATIONS ===
Nom complet : ${nom}
Email : ${email}
Téléphone : ${tel}
Type de dossier : ${d['d-type']        || 'Non précisé'}
Besoin : ${d['d-description']          || 'Non précisé'}
Documents disponibles : ${d['d-documents'] || 'Non précisés'}

=== CONTENU DU DOCUMENT ===
1. Titre + résumé de la situation du client
2. Liste des documents à fournir avec cases à cocher ☐
3. Étapes numérotées à suivre (claires et concrètes)
4. Conseils pratiques et délais habituels
5. Coordonnées des organismes utiles (CAF, CPAM, Pôle Emploi, Préfecture, etc. selon le type de dossier)

=== DESIGN ===
- En-tête fond bleu marine #1e3a5f : nom + type de dossier
- Sections avec icônes, cases à cocher pour checklist
- Typographie system-ui/Arial, accents #2563eb
- ${PRINT}
${FOOTER}`;
  }

  if (service === 'courrier') {
    return `Tu es un expert en rédaction de courriers officiels pour l'administration française.
Rédige un courrier formel, clair et professionnel en HTML (CSS inline, sans JS, format A4).

=== INFORMATIONS ===
Expéditeur : ${nom}
Email : ${email}
Téléphone : ${tel}
Destinataire : ${d['c-destinataire'] || 'Non précisé'}
Objet : ${d['c-objet']              || 'Non précisé'}
Situation / Demande : ${d['c-description'] || 'Non précisée'}

=== STRUCTURE DU COURRIER ===
- Coordonnées expéditeur (haut gauche)
- Ville et date (haut droite)
- Coordonnées destinataire
- Objet en gras
- Formule d'appel adaptée
- Corps structuré : contexte → demande précise → justification
- Formule de politesse officielle
- Signature

=== DESIGN ===
- Format A4, marges 25mm, typographie system-ui/Arial
- Ton officiel, respectueux et adapté à l'administration
- ${PRINT}
${FOOTER}`;
  }

  return null;
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  if (req.method !== 'POST')   { res.status(405).json({ error: 'Method not allowed' }); return; }

  const apiKey = process.env.CLAUD_API_KEY;
  if (!apiKey) { res.status(500).json({ error: 'CLAUD_API_KEY non configuree sur Vercel' }); return; }

  const { demande } = req.body || {};
  if (!demande) { res.status(400).json({ error: 'Donnees manquantes' }); return; }

  const prompt = buildPrompt(demande);
  if (!prompt) { res.status(400).json({ error: 'Service non reconnu : ' + demande.service }); return; }

  try {
    const result = await callAnthropic(apiKey, prompt);

    if (result.status !== 200) {
      res.status(500).json({ error: 'Anthropic ' + result.status + ' : ' + result.body.substring(0, 400) });
      return;
    }

    let data;
    try { data = JSON.parse(result.body); } catch(e) {
      res.status(500).json({ error: 'Reponse non-JSON : ' + result.body.substring(0, 200) });
      return;
    }

    const docHtml = (data.content && data.content[0] && data.content[0].text) || '';
    res.status(200).json({ cv: docHtml });

  } catch (err) {
    res.status(500).json({ error: 'Erreur reseau : ' + err.message });
  }
};
