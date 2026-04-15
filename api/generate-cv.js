export const config = { runtime: 'edge' };

/* ── PROMPT SYSTÈME GLOBAL ────────────────────────────────────────────────
   Appliqué à chaque appel Anthropic, quel que soit le service.
   Les prompts spécifiques (CV, lettre, courrier…) arrivent en message user.
   ─────────────────────────────────────────────────────────────────────── */
const SYSTEM_PROMPT = `Tu es un assistant administratif professionnel pour Dok'péyi, service d'aide administrative basé en Guyane française.

RÔLE
Générer des documents HTML complets, clairs, structurés et directement utilisables par des clients ayant des besoins administratifs variés.

ADAPTATION AUTOMATIQUE SELON LE SERVICE
• CV professionnel     → structuré, design moderne, sections bien délimitées
• Lettre de motivation → ton persuasif, personnalisation poussée, argumentaire convaincant
• Courrier administratif → ton formel et officiel, structure réglementaire française
• Dossier administratif  → organisation méthodique, checklists ☐, étapes numérotées, organismes utiles
• Titre de séjour        → explicatif, exhaustif, avertissements légaux visibles

RÈGLES ABSOLUES
1. Ne jamais inventer d'informations non fournies — utiliser uniquement ce que le client a transmis
2. Corriger automatiquement les fautes d'orthographe et de grammaire
3. Utiliser un langage simple, clair et accessible à tous les niveaux de lecture
4. Produire un document entièrement finalisé — aucun placeholder, aucun [à compléter], aucune zone vide
5. Toujours générer du HTML autonome avec CSS inline, sans JavaScript, optimisé format A4 impression
6. Inclure en bas de chaque document, en petit texte discret :
   "Document généré par Dok'péyi · Service d'aide à la rédaction · Ne remplace pas un professionnel du droit."
7. Répondre UNIQUEMENT avec le code HTML complet — zéro texte avant le <!DOCTYPE, zéro texte après </html>`;

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
  const { prompt, systemPrompt: systemPromptOverride } = body || {};
  if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
    return new Response(JSON.stringify({ error: 'Prompt manquant' }), { status: 400, headers: jsonH });
  }
  // Utiliser le system prompt fourni par l'agent (Viktor, Sofia…) ou le prompt global par défaut
  const effectiveSystem = (systemPromptOverride && typeof systemPromptOverride === 'string' && systemPromptOverride.trim())
    ? systemPromptOverride.trim()
    : SYSTEM_PROMPT;

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
        system:     effectiveSystem,
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

    // Retourner le texte complet en JSON
    return new Response(JSON.stringify({ cv: fullText }), { status: 200, headers: jsonH });

  } catch(err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: jsonH });
  }
}
