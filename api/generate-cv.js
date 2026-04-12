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
  const hasExistingCV = d['cv-actuel'] && d['cv-actuel'].trim().length > 30;

  const prompt = `Tu es un expert en design et rédaction de CV professionnels. ${hasExistingCV ? 'Modernise et améliore le CV existant du client en conservant toutes ses informations, mais en le reformatant avec un design moderne et professionnel.' : 'Crée un CV complet, moderne et professionnel.'} Le résultat doit être un fichier HTML autonome (CSS inline uniquement, aucun JavaScript, format A4 prêt à imprimer via Ctrl+P).

=== DONNÉES DU CLIENT ===
Prénom et Nom : ${demande.prenom || ''} ${demande.nom || ''}
Email : ${demande.email || ''}
Téléphone / WhatsApp : ${demande.whatsapp || ''}
Poste recherché : ${d['cv-poste'] || 'Non précisé'}
Expériences professionnelles : ${d['cv-experience'] || 'Non précisées'}
Formation / Diplômes : ${d['cv-formation'] || 'Non précisée'}
Compétences : ${d['cv-competences'] || 'Non précisées'}
Informations complémentaires : ${d['cv-infos'] || ''}
${hasExistingCV ? `\n=== CV ACTUEL À MODERNISER ===\n${d['cv-actuel']}\n` : ''}
=== CONSIGNES DE DESIGN ===
- En-tête impactant : nom en grand, poste, email, téléphone sur fond bleu marine (#1e3a5f)
- Corps blanc avec sections : Expériences → Formation → Compétences → Infos
- Chaque expérience : titre du poste en gras, entreprise, dates, description
- Typographie : system-ui ou Arial, tailles hiérarchiques claires
- Accents couleur : #2563eb pour les titres de section
- Séparateurs subtils entre sections
- @media print : marges 15mm, pas de coupure de section entre pages
- ${hasExistingCV ? 'Conserver TOUTES les informations du CV original, reformater et enrichir avec les nouvelles données fournies' : 'Layout propre sur 1-2 pages selon la quantité de contenu'}

Réponds UNIQUEMENT avec le code HTML complet (<!DOCTYPE html> … </html>). Zéro texte avant ou après.`;

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
