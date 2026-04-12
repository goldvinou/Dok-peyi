module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  if (req.method !== 'POST')    { res.status(405).json({ error: 'Method not allowed' }); return; }

  const apiKey = process.env.CLAUD_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'CLAUD_API_KEY non configuree sur Vercel' });
    return;
  }

  const { demande } = req.body || {};
  if (!demande) { res.status(400).json({ error: 'Donnees manquantes' }); return; }

  const d = demande.details || {};

  const prompt = `Tu es un expert en design et redaction de CV professionnels. Cree un CV complet, moderne et professionnel. Le resultat doit etre un fichier HTML autonome (CSS inline uniquement, aucun JavaScript, format A4 pret a imprimer via Ctrl+P).

=== DONNEES DU CLIENT ===
Prenom et Nom : ${demande.prenom || ''} ${demande.nom || ''}
Email : ${demande.email || ''}
Telephone / WhatsApp : ${demande.whatsapp || ''}
Poste recherche : ${d['cv-poste'] || 'Non precise'}
Experiences professionnelles : ${d['cv-experience'] || 'Non precisees'}
Formation / Diplomes : ${d['cv-formation'] || 'Non precisee'}
Competences : ${d['cv-competences'] || 'Non precisees'}
Informations complementaires : ${d['cv-infos'] || ''}

=== CONSIGNES DE DESIGN ===
- En-tete impactant : nom en grand, poste, email, telephone sur fond bleu marine (#1e3a5f)
- Corps blanc avec sections : Experiences -> Formation -> Competences -> Infos
- Chaque experience : titre du poste en gras, entreprise, dates, description
- Typographie : system-ui ou Arial, tailles hierarchiques claires
- Accents couleur : #2563eb pour les titres de section
- Separateurs subtils entre sections
- @media print : marges 15mm, pas de coupure de section entre pages
- Layout propre sur 1-2 pages selon la quantite de contenu

Reponds UNIQUEMENT avec le code HTML complet (<!DOCTYPE html> ... </html>). Zero texte avant ou apres.`;

  try {
    const apiRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 4096,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const rawText = await apiRes.text();

    if (!apiRes.ok) {
      res.status(500).json({ error: 'Anthropic ' + apiRes.status + ' : ' + rawText.substring(0, 300) });
      return;
    }

    let data;
    try { data = JSON.parse(rawText); } catch(e) {
      res.status(500).json({ error: 'Reponse non-JSON : ' + rawText.substring(0, 200) });
      return;
    }

    const cvHtml = (data.content && data.content[0] && data.content[0].text) || '';
    res.status(200).json({ cv: cvHtml });

  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur : ' + err.message });
  }
};
