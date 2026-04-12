export const config = { runtime: 'edge' };

export default async function handler(req) {
  const cors = {
    'Access-Control-Allow-Origin':  '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
  const jsonH = { ...cors, 'content-type': 'application/json' };

  if (req.method === 'OPTIONS') return new Response(null, { status: 200, headers: cors });
  if (req.method !== 'POST')   return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: jsonH });

  const apiKey = process.env.CLAUD_API_KEY;
  if (!apiKey) return new Response(JSON.stringify({ error: 'CLAUD_API_KEY non configurée' }), { status: 500, headers: jsonH });

  let body;
  try { body = await req.json(); } catch(e) {
    return new Response(JSON.stringify({ error: 'Body invalide' }), { status: 400, headers: jsonH });
  }
  const { prompt } = body || {};
  if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
    return new Response(JSON.stringify({ error: 'Prompt manquant' }), { status: 400, headers: jsonH });
  }

  try {
    // Anthropic streaming — les tokens arrivent en continu → pas d'idle timeout
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
        stream:     true,
        messages:   [{ role: 'user', content: prompt }]
      })
    });

    if (!upstream.ok) {
      const t = await upstream.text();
      return new Response(JSON.stringify({ error: `Anthropic ${upstream.status} : ${t.substring(0, 300)}` }), { status: 500, headers: jsonH });
    }

    // Collecter le flux SSE dans l'Edge function (garde la connexion active)
    const reader  = upstream.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '', fullText = '';

    outer: while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const raw = line.slice(6).trim();
        if (raw === '[DONE]') break outer;
        try {
          const evt = JSON.parse(raw);
          if (evt.type === 'content_block_delta' && evt.delta?.type === 'text_delta') {
            fullText += evt.delta.text;
          } else if (evt.type === 'error') {
            return new Response(JSON.stringify({ error: evt.error?.message || 'Erreur Anthropic' }), { status: 500, headers: jsonH });
          }
        } catch(_) {}
      }
    }

    // Retourner le texte complet en JSON — client n'a pas besoin de gérer le SSE
    return new Response(JSON.stringify({ cv: fullText }), { status: 200, headers: jsonH });

  } catch(err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: jsonH });
  }
}
