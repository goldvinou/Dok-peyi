// Runtime Node.js — pas Edge (Edge a un timeout trop court pour générer du HTML complet)

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin',  '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  if (req.method !== 'POST')   { res.status(405).json({ error: 'Method not allowed' }); return; }

  const apiKey = process.env.CLAUD_API_KEY;
  if (!apiKey) { res.status(500).json({ error: 'CLAUD_API_KEY non configurée' }); return; }

  const { prompt } = req.body || {};
  if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
    res.status(400).json({ error: 'Prompt manquant ou invalide' });
    return;
  }

  try {
    const ctrl = new AbortController();
    const tid  = setTimeout(() => ctrl.abort(), 55000); // 55s — sous la limite Vercel de 60s

    const upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      signal: ctrl.signal,
      headers: {
        'x-api-key':         apiKey,
        'anthropic-version': '2023-06-01',
        'content-type':      'application/json',
      },
      body: JSON.stringify({
        model:      'claude-haiku-4-5-20251001',
        max_tokens: 4096,
        messages:   [{ role: 'user', content: prompt }]
      })
    });
    clearTimeout(tid);

    if (!upstream.ok) {
      const t = await upstream.text();
      res.status(500).json({ error: `Anthropic ${upstream.status} : ${t.substring(0, 400)}` });
      return;
    }

    const data = await upstream.json();
    const html = (data.content?.[0]?.text) || '';
    res.status(200).json({ cv: html });

  } catch (err) {
    const msg = err.name === 'AbortError'
      ? 'Délai dépassé (55s) — le document est peut-être trop complexe, réessaie.'
      : 'Erreur : ' + err.message;
    res.status(500).json({ error: msg });
  }
}
