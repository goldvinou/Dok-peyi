export const config = { runtime: 'edge' };

export default async function handler(req) {
  const h = {
    'Access-Control-Allow-Origin':  '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type':                 'application/json',
  };

  if (req.method === 'OPTIONS') return new Response(null, { status: 200, headers: h });
  if (req.method !== 'POST')   return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: h });

  const apiKey = process.env.CLAUD_API_KEY;
  if (!apiKey) return new Response(JSON.stringify({ error: 'CLAUD_API_KEY non configuree' }), { status: 500, headers: h });

  let body;
  try { body = await req.json(); } catch(e) {
    return new Response(JSON.stringify({ error: 'Body invalide' }), { status: 400, headers: h });
  }

  const { prompt } = body || {};
  if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
    return new Response(JSON.stringify({ error: 'Prompt manquant ou invalide' }), { status: 400, headers: h });
  }

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
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

    if (!res.ok) {
      const t = await res.text();
      return new Response(JSON.stringify({ error: `Anthropic ${res.status} : ${t.substring(0, 400)}` }), { status: 500, headers: h });
    }

    const data = await res.json();
    const html = (data.content && data.content[0] && data.content[0].text) || '';
    return new Response(JSON.stringify({ cv: html }), { status: 200, headers: h });

  } catch (err) {
    return new Response(JSON.stringify({ error: 'Erreur : ' + err.message }), { status: 500, headers: h });
  }
}
