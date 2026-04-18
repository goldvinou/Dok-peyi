/**
 * POST /api/orchestrate — Pipeline multi-agents SSE (Edge Function)
 * Emma (génération) → Viktor (évaluation, max 2 boucles) → Sofia (optimisation) → Léa (mise en page)
 * Même structure que generate-cv.js. Retourne { cv: "<html>…</html>" }
 */
export const config = { runtime: 'edge' };

import { rateLimit }     from '../lib/rate-limit.js';
import { CORS as _CORS } from '../lib/edge-response.js';

/* ── SYSTEM PROMPTS ─────────────────────────────────────────── */
const SYS_EMMA = "Tu es Emma, experte en rédaction professionnelle chez Dok'péyi. Tu génères des documents de haute qualité : CV percutants, lettres de motivation convaincantes, dossiers administratifs rigoureux. Ton travail est soigné, sans fautes, riche en contenu et parfaitement adapté au profil de chaque client. Tu vises l'excellence à chaque document. Réponds UNIQUEMENT avec le HTML complet (<!DOCTYPE html> … </html>). Zéro texte avant ou après.";

const SYS_VIKTOR = "Tu es Viktor, responsable qualité IA chez Dok'péyi. Tu analyses chaque document avec un œil critique et méthodique : cohérence des informations, orthographe, grammaire, pertinence du contenu par rapport à la demande client, conformité au format attendu. Tu signales toute anomalie avec précision.";

const SYS_SOFIA = "Tu es Sofia, spécialiste en optimisation chez Dok'péyi. Tu améliores les documents finaux sans trahir le contenu original : fluidité du texte, impact des formulations, vocabulaire adapté au secteur professionnel du client, finition impeccable. Tu apportes la touche finale qui fait la différence. Réponds UNIQUEMENT avec le HTML complet. Zéro texte avant ou après.";

const SYS_LEA = "Tu es Léa, responsable du Pôle Qualité & Présentation chez Dok'péyi. Tu transformes les documents en créations professionnelles premium. Tu améliores : la mise en page (marges, espacement, hiérarchie visuelle), la lisibilité (taille de police, contraste, alignements), la structure (titres clairs, sections bien délimitées), l'harmonie du style (cohérence typographique, palette de couleurs professionnelle), et l'impact visuel général. Tu ne modifies pas le contenu rédactionnel, tu améliores uniquement la présentation. Tu retournes UNIQUEMENT le HTML complet mis en forme, sans aucun commentaire.";

const HAIKU = 'claude-haiku-4-5-20251001';

function _emmaModel(svc) {
  return (svc === 'sejour' || svc === 'naturalisation')
    ? 'claude-opus-4-6'
    : 'claude-sonnet-4-20250514';
}

/* ── HELPERS ANTHROPIC ──────────────────────────────────────── */

/* Non-streaming : utilisé pour Viktor et Sofia */
async function _callSync(apiKey, model, system, content, maxTokens = 4096) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key':         apiKey,
      'anthropic-version': '2023-06-01',
      'content-type':      'application/json',
    },
    body: JSON.stringify({
      model, max_tokens: maxTokens, system,
      messages: [{ role: 'user', content }]
    })
  });
  if (!res.ok) throw new Error(`Anthropic ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json();
  return data.content?.[0]?.text || '';
}

/* Streaming interne : utilisé pour Emma et Léa (évite l'idle timeout Edge) */
async function _callStream(apiKey, model, system, content, maxTokens = 4096) {
  const upstream = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key':         apiKey,
      'anthropic-version': '2023-06-01',
      'content-type':      'application/json',
    },
    body: JSON.stringify({
      model, max_tokens: maxTokens, stream: true, system,
      messages: [{ role: 'user', content }]
    })
  });
  if (!upstream.ok) throw new Error(`Anthropic ${upstream.status}: ${(await upstream.text()).slice(0, 200)}`);

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
        if (evt.type === 'content_block_delta' && evt.delta?.type === 'text_delta')
          fullText += evt.delta.text;
        else if (evt.type === 'error')
          throw new Error(evt.error?.message || 'Anthropic stream error');
      } catch(_) {}
    }
  }
  return fullText;
}

function _strip(text) {
  return text.replace(/^```(?:html)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
}

/* ── HANDLER ────────────────────────────────────────────────── */
export default async function handler(req) {
  const cors  = _CORS;
  const jsonH = { ...cors, 'content-type': 'application/json' };

  if (req.method === 'OPTIONS') return new Response(null, { status: 200, headers: cors });
  if (req.method !== 'POST')   return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: jsonH });

  const rl = rateLimit(req, { max: 5, windowMs: 60_000 });
  if (!rl.ok) return new Response(JSON.stringify({ error: 'Trop de requêtes — réessayez dans une minute.' }), {
    status: 429, headers: { ...jsonH, 'Retry-After': '60' }
  });

  const apiKey = process.env.CLAUD_API_KEY;
  if (!apiKey) return new Response(JSON.stringify({ error: 'CLAUD_API_KEY non configurée' }), { status: 500, headers: jsonH });

  let body;
  try { body = await req.json(); } catch(e) {
    return new Response(JSON.stringify({ error: 'Body invalide' }), { status: 400, headers: jsonH });
  }

  const { prompt, systemPrompt: systemPromptOverride, service } = body || {};

  if (!prompt || typeof prompt !== 'string' || !prompt.trim())
    return new Response(JSON.stringify({ error: 'Prompt manquant' }), { status: 400, headers: jsonH });
  if (prompt.length > 32000)
    return new Response(JSON.stringify({ error: 'Prompt trop long (max 32 000 caractères)' }), { status: 400, headers: jsonH });
  if (systemPromptOverride !== undefined && typeof systemPromptOverride !== 'string')
    return new Response(JSON.stringify({ error: 'systemPrompt doit être une chaîne' }), { status: 400, headers: jsonH });
  if (systemPromptOverride && systemPromptOverride.length > 4000)
    return new Response(JSON.stringify({ error: 'systemPrompt trop long (max 4 000 caractères)' }), { status: 400, headers: jsonH });

  const svc        = typeof service === 'string' ? service.trim() : '';
  const emmaSystem = (systemPromptOverride && systemPromptOverride.trim())
    ? systemPromptOverride.trim()
    : SYS_EMMA;

  try {
    /* ── 1. EMMA — génération (streaming interne) ────────── */
    let doc = _strip(await _callStream(apiKey, _emmaModel(svc), emmaSystem, prompt));

    /* ── 2. VIKTOR — évaluation qualité (max 2 boucles) ──── */
    for (let loop = 0; loop < 2; loop++) {
      const vPrompt =
        `Évalue ce document HTML généré pour le service "${svc || 'générique'}".\n\n` +
        `Document :\n${doc}\n\nPrompt original :\n${prompt}\n\n` +
        `Retourne UNIQUEMENT du JSON valide sans markdown : ` +
        `{"score":N,"items":[{"label":"…","ok":bool}]}\n` +
        `Score de 0 à 10. 7 ou plus = acceptable.`;
      const vRaw = await _callSync(apiKey, HAIKU, SYS_VIKTOR, vPrompt, 512);
      let score = 7;
      try {
        const m = vRaw.match(/\{[\s\S]*\}/);
        if (m) score = JSON.parse(m[0]).score ?? 7;
      } catch(_) {}
      if (score >= 7) break;
      if (loop === 0) doc = _strip(await _callStream(apiKey, _emmaModel(svc), emmaSystem, prompt));
    }

    /* ── 3. SOFIA — optimisation contenu (non-streaming) ─── */
    const sPrompt =
      `Optimise le contenu de ce document HTML pour le service "${svc || 'générique'}". ` +
      `Améliore la fluidité, le vocabulaire métier et la finition rédactionnelle. ` +
      `Ne modifie pas la structure HTML ni le CSS inline. Retourne UNIQUEMENT le HTML complet.\n\n${doc}`;
    const sofiaOut = _strip(await _callSync(apiKey, HAIKU, SYS_SOFIA, sPrompt));
    if (sofiaOut) doc = sofiaOut;

    /* ── 4. LÉA — mise en page finale (streaming interne) ── */
    let leaContent;
    if (svc === 'cv') {
      const styleMatch = prompt.match(/STYLE IMPOSÉ[\s\S]*?(?=\nClient :|$)/);
      const tplStyle   = styleMatch ? styleMatch[0].trim() : '';
      leaContent =
        `Réalise la mise en page finale de ce CV HTML A4 CSS-inline.` +
        (tplStyle ? `\nRespecte impérativement ce style :\n${tplStyle}` : '') +
        `\nNe modifie pas le contenu rédactionnel. Retourne UNIQUEMENT le HTML complet.\n\n${doc}`;
    } else {
      leaContent =
        `Réalise la mise en page finale de ce document HTML A4 CSS-inline ` +
        `pour le service "${svc || 'générique'}". ` +
        `Ne modifie pas le contenu rédactionnel. Retourne UNIQUEMENT le HTML complet.\n\n${doc}`;
    }
    const finalDoc = _strip(await _callStream(apiKey, HAIKU, SYS_LEA, leaContent));

    return new Response(JSON.stringify({ cv: finalDoc || doc }), { status: 200, headers: jsonH });

  } catch(err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: jsonH });
  }
}
