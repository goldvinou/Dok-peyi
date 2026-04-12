// Edge runtime — le streaming évite le timeout Vercel Hobby (10s)
export const config = { runtime: 'edge' };

export default async function handler(req) {
  const cors = {
    'Access-Control-Allow-Origin':  '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (req.method === 'OPTIONS') return new Response(null, { status: 200, headers: cors });
  if (req.method !== 'POST')   return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: { ...cors, 'content-type': 'application/json' } });

  const apiKey = process.env.CLAUD_API_KEY;
  if (!apiKey) return new Response(JSON.stringify({ error: 'CLAUD_API_KEY non configurée' }), { status: 500, headers: { ...cors, 'content-type': 'application/json' } });

  let body;
  try { body = await req.json(); } catch(e) {
    return new Response(JSON.stringify({ error: 'Body invalide' }), { status: 400, headers: { ...cors, 'content-type': 'application/json' } });
  }

  const { prompt } = body || {};
  if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
    return new Response(JSON.stringify({ error: 'Prompt manquant' }), { status: 400, headers: { ...cors, 'content-type': 'application/json' } });
  }

  try {
    const upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key':         apiKey,
        'anthropic-version': '2023-06-01',
        'content-type':      'application/json',
      },
      body: JSON.stringify({
        model:      'claude-haiku-4-5-20251001',
        max_tokens: 4096,
        stream:     true,   // ← streaming : Anthropic envoie les tokens au fur et à mesure
        messages:   [{ role: 'user', content: prompt }]
      })
    });

    if (!upstream.ok) {
      const t = await upstream.text();
      return new Response(
        JSON.stringify({ error: `Anthropic ${upstream.status} : ${t.substring(0, 300)}` }),
        { status: 500, headers: { ...cors, 'content-type': 'application/json' } }
      );
    }

    // Pipe le flux SSE d'Anthropic directement vers le client
    // → les données circulent sans interruption → pas de timeout
    return new Response(upstream.body, {
      status: 200,
      headers: {
        ...cors,
        'content-type':    'text/event-stream',
        'cache-control':   'no-cache, no-transform',
        'x-accel-buffering': 'no',
      }
    });

  } catch(err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...cors, 'content-type': 'application/json' } }
    );
  }
}
