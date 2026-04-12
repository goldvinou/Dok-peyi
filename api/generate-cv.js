const https = require('https');

function callAnthropic(apiKey, messages, maxTokens) {
  return new Promise((resolve, reject) => {
    const bodyStr = JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: maxTokens || 4096,
      messages
    });
    const options = {
      hostname: 'api.anthropic.com',
      path:     '/v1/messages',
      method:   'POST',
      headers: {
        'x-api-key':          apiKey,
        'anthropic-version':  '2023-06-01',
        'content-type':       'application/json',
        'content-length':     Buffer.byteLength(bodyStr)
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

  const d     = demande.details || {};
  const choix = d['cv-choix'] || 'scratch';
  const nom   = `${demande.prenom || ''} ${demande.nom || ''}`.trim();

  let prompt;

  if (choix === 'improve') {
    prompt = `Tu es un expert en design et rédaction de CV professionnels.
Un client souhaite améliorer et moderniser son CV existant.

=== INFORMATIONS DU CLIENT ===
Nom complet : ${nom}
Email : ${demande.email || ''}
Téléphone : ${demande.whatsapp || ''}

=== SOUHAITS DU CLIENT ===
${d['cv-note'] || 'Moderniser le design et rendre plus professionnel'}

=== CONSIGNES ===
Le client a fourni son CV en fichier (joint séparément). En te basant sur ses souhaits, génère un nouveau CV HTML moderne et professionnel.
Si les souhaits mentionnent des éléments spécifiques (reformuler, ajouter des sections, améliorer la mise en page, etc.), applique-les.
Intègre toutes les informations client disponibles (nom, email, téléphone) dans l'en-tête du CV.

=== DESIGN ===
- En-tête impactant : nom en grand, email, téléphone sur fond bleu marine (#1e3a5f)
- Corps blanc avec sections structurées : Expériences → Formation → Compétences
- Typographie : system-ui ou Arial, tailles hiérarchiques claires
- Accents couleur : #2563eb pour les titres de section
- Séparateurs subtils entre sections
- @media print : marges 15mm, pas de coupure entre pages

Réponds UNIQUEMENT avec le code HTML complet (<!DOCTYPE html> … </html>). Zéro texte avant ou après.`;

  } else {
    prompt = `Tu es un expert en design et rédaction de CV professionnels.
Crée un CV complet, moderne et professionnel. Le résultat doit être un fichier HTML autonome (CSS inline uniquement, aucun JavaScript, format A4 prêt à imprimer).

=== DONNÉES DU CLIENT ===
Nom complet : ${nom}
Email : ${demande.email || ''}
Téléphone : ${demande.whatsapp || ''}
Poste recherché : ${d['cv-poste'] || 'Non précisé'}
Expériences professionnelles : ${d['cv-experience'] || 'Non précisées'}
Formation / Diplômes : ${d['cv-formation'] || 'Non précisée'}
Compétences : ${d['cv-competences'] || 'Non précisées'}
Informations complémentaires : ${d['cv-infos'] || ''}

=== DESIGN ===
- En-tête impactant : nom en grand, poste, email, téléphone sur fond bleu marine (#1e3a5f)
- Corps blanc avec sections : Expériences → Formation → Compétences → Infos
- Typographie : system-ui ou Arial, tailles hiérarchiques claires
- Accents couleur : #2563eb pour les titres de section
- Séparateurs subtils entre sections
- @media print : marges 15mm, pas de coupure de section entre pages
- Layout propre sur 1-2 pages selon la quantité de contenu

Réponds UNIQUEMENT avec le code HTML complet (<!DOCTYPE html> … </html>). Zéro texte avant ou après.`;
  }

  try {
    const result = await callAnthropic(apiKey, [{ role: 'user', content: prompt }]);

    if (result.status !== 200) {
      res.status(500).json({ error: 'Anthropic ' + result.status + ' : ' + result.body.substring(0, 400) });
      return;
    }

    let data;
    try { data = JSON.parse(result.body); } catch(e) {
      res.status(500).json({ error: 'Reponse non-JSON : ' + result.body.substring(0, 200) });
      return;
    }

    const cvHtml = (data.content && data.content[0] && data.content[0].text) || '';
    res.status(200).json({ cv: cvHtml });

  } catch (err) {
    res.status(500).json({ error: 'Erreur reseau : ' + err.message });
  }
};
