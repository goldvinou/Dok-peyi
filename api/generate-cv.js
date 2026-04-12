const https = require('https');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  if (req.method !== 'POST')   { res.status(405).json({ error: 'Method not allowed' }); return; }

  const apiKey = process.env.CLAUD_API_KEY;
  if (!apiKey) { res.status(500).json({ error: 'CLAUD_API_KEY non configuree sur Vercel' }); return; }

  const { prompt } = req.body || {};
  if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
    res.status(400).json({ error: 'Prompt manquant ou invalide' });
    return;
  }

  try {
    const bodyStr = JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }]
    });

    const result = await new Promise((resolve, reject) => {
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
      const req2 = https.request(options, r => {
        let data = '';
        r.on('data', c => { data += c; });
        r.on('end',  () => resolve({ status: r.statusCode, body: data }));
      });
      req2.on('error', reject);
      req2.write(bodyStr);
      req2.end();
    });

    if (result.status !== 200) {
      res.status(500).json({ error: 'Anthropic ' + result.status + ' : ' + result.body.substring(0, 400) });
      return;
    }

    let data;
    try { data = JSON.parse(result.body); } catch(e) {
      res.status(500).json({ error: 'Reponse non-JSON : ' + result.body.substring(0, 200) });
      return;
    }

    const html = (data.content && data.content[0] && data.content[0].text) || '';
    res.status(200).json({ cv: html });

  } catch (err) {
    res.status(500).json({ error: 'Erreur : ' + err.message });
  }
};
