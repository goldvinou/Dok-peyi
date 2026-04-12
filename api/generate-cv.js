export default async function handler(req, res) {
  // CORS headers (même domaine Vercel, mais sécurité défensive)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  if (req.method !== 'POST')    { res.status(405).json({ error: 'Method not allowed' }); return; }

  const apiKey = process.env.CLAUD_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'CLAUD_API_KEY non configurée sur Vercel' });
    return;
  }

  const { demande } = req.body || {};
  if (!demande) { res.status(400).json({ error: 'Données manquantes' }); return; }

  const d = demande.details || {};

  const prompt = `Tu es un expert en rédaction de CV professionnels. Génère un CV complet et moderne en HTML autonome (CSS inline uniquement, aucun JavaScript, format A4 prêt à imprimer) pour la personne suivante :

Prénom et Nom : ${demande.prenom || ''} ${demande.nom || ''}
Poste recherché : ${d['cv-poste'] || 'Non précisé'}
Expérience professionnelle : ${d['cv-experience'] || 'Non précisée'}
Formation / Diplômes : ${d['cv-formation'] || 'Non précisée'}
Compétences : ${d['cv-competences'] || 'Non précisées'}
Informations complémentaires : ${d['cv-infos'] || ''}

Consignes de design :
- Palette : bleu marine (#1e3a5f) pour l'en-tête, blanc pour le corps, accents bleu (#2563eb)
- Typographie claire, sections bien délimitées avec des séparateurs
- Mise en page professionnelle sur une colonne ou deux colonnes selon le contenu
- Inclure une section en-tête avec nom, poste, email (${demande.email || ''}), téléphone (${demande.whatsapp || ''})
- @media print inclus pour un rendu PDF optimal

Réponds UNIQUEMENT avec le code HTML complet commençant par <!DOCTYPE html> et finissant par </html>. Aucun texte avant ou après.`;

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

    if (!apiRes.ok) {
      const errData = await apiRes.json().catch(() => ({}));
      res.status(500).json({ error: errData.error?.message || 'Erreur API Anthropic' });
      return;
    }

    const data = await apiRes.json();
    const cvHtml = data.content?.[0]?.text || '';

    res.status(200).json({ cv: cvHtml });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur : ' + err.message });
  }
}
