import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';

const { default: handler } = await import('../api/generate-cv.js');

/* ── Helpers ─────────────────────────────────────────────── */

let _ip = 0;
function makeReq(body, method = 'POST') {
  return new Request('https://dok-peyi.vercel.app/api/generate-cv', {
    method,
    headers: { 'content-type': 'application/json', 'x-forwarded-for': `10.8.${++_ip}.1` },
    body: method === 'POST' ? JSON.stringify(body) : undefined
  });
}

const HTML_DOC = '<!DOCTYPE html><html><body><h1>CV Test</h1></body></html>';

/* SSE stream simulant une réponse Anthropic complète */
function mockAnthropicStream(text = HTML_DOC) {
  const events = [
    `data: ${JSON.stringify({ type: 'content_block_delta', delta: { type: 'text_delta', text } })}\n\n`,
    `data: [DONE]\n\n`
  ].join('');

  const encoder = new TextEncoder();
  const stream  = new ReadableStream({
    start(ctrl) {
      ctrl.enqueue(encoder.encode(events));
      ctrl.close();
    }
  });

  return async () => ({
    ok:   true,
    body: stream,
    text: async () => ''
  });
}

function mockAnthropicError(status = 500, msg = 'Internal error') {
  return async () => ({ ok: false, status, text: async () => msg });
}

function mockAnthropicStreamError() {
  const events = `data: ${JSON.stringify({ type: 'error', error: { message: 'Stream error' } })}\n\n`;
  const encoder = new TextEncoder();
  const stream  = new ReadableStream({
    start(ctrl) { ctrl.enqueue(encoder.encode(events)); ctrl.close(); }
  });
  return async () => ({ ok: true, body: stream });
}

let origFetch;
beforeEach(() => {
  origFetch = globalThis.fetch;
  process.env.CLAUD_API_KEY = 'sk-ant-test';
});
afterEach(() => {
  globalThis.fetch = origFetch;
  delete process.env.CLAUD_API_KEY;
});

/* ── HTTP validation ──────────────────────────────────────── */

describe('HTTP validation', () => {
  test('OPTIONS → 200', async () => {
    const res = await handler(new Request('https://x.com/api/generate-cv', { method: 'OPTIONS' }));
    assert.equal(res.status, 200);
  });

  test('GET → 405', async () => {
    const res = await handler(makeReq(null, 'GET'));
    assert.equal(res.status, 405);
  });
});

/* ── Body validation ──────────────────────────────────────── */

describe('Body validation', () => {
  test('invalid JSON → 400', async () => {
    const req = new Request('https://dok-peyi.vercel.app/api/generate-cv', {
      method:  'POST',
      headers: { 'content-type': 'application/json', 'x-forwarded-for': `10.8.${++_ip}.1` },
      body:    'not-json'
    });
    const res = await handler(req);
    assert.equal(res.status, 400);
  });

  test('missing prompt → 400', async () => {
    const res = await handler(makeReq({}));
    assert.equal(res.status, 400);
    const d = await res.json();
    assert.match(d.error, /prompt/i);
  });

  test('empty prompt → 400', async () => {
    const res = await handler(makeReq({ prompt: '  ' }));
    assert.equal(res.status, 400);
  });

  test('prompt > 12000 chars → 400', async () => {
    const res = await handler(makeReq({ prompt: 'x'.repeat(12001) }));
    assert.equal(res.status, 400);
    const d = await res.json();
    assert.match(d.error, /trop long/i);
  });

  test('systemPrompt not string → 400', async () => {
    const res = await handler(makeReq({ prompt: 'test', systemPrompt: 42 }));
    assert.equal(res.status, 400);
  });

  test('systemPrompt > 4000 chars → 400', async () => {
    const res = await handler(makeReq({ prompt: 'test', systemPrompt: 's'.repeat(4001) }));
    assert.equal(res.status, 400);
    const d = await res.json();
    assert.match(d.error, /trop long/i);
  });
});

/* ── API key ──────────────────────────────────────────────── */

describe('API key', () => {
  test('missing CLAUD_API_KEY → 500', async () => {
    delete process.env.CLAUD_API_KEY;
    const res = await handler(makeReq({ prompt: 'Génère un CV' }));
    assert.equal(res.status, 500);
    const d = await res.json();
    assert.match(d.error, /CLAUD_API_KEY/i);
  });
});

/* ── Génération réussie ───────────────────────────────────── */

describe('Génération réussie', () => {
  test('retourne le HTML généré', async () => {
    globalThis.fetch = mockAnthropicStream(HTML_DOC);
    const res = await handler(makeReq({ prompt: 'Génère un CV pour Jean Dupont' }));
    assert.equal(res.status, 200);
    const d = await res.json();
    assert.ok(d.cv.includes('<h1>CV Test</h1>'));
  });

  test('utilise le systemPrompt custom si fourni', async () => {
    let capturedBody;
    globalThis.fetch = async (_url, opts) => {
      capturedBody = JSON.parse(opts.body);
      return mockAnthropicStream()();
    };
    await handler(makeReq({ prompt: 'test', systemPrompt: 'Prompt custom' }));
    assert.equal(capturedBody.system, 'Prompt custom');
  });

  test('utilise le system prompt global si systemPrompt absent', async () => {
    let capturedBody;
    globalThis.fetch = async (_url, opts) => {
      capturedBody = JSON.parse(opts.body);
      return mockAnthropicStream()();
    };
    await handler(makeReq({ prompt: 'test' }));
    assert.ok(capturedBody.system.includes("Dok'péyi"));
  });
});

/* ── Erreurs upstream ─────────────────────────────────────── */

describe('Erreurs upstream', () => {
  test('Anthropic HTTP error → 500', async () => {
    globalThis.fetch = mockAnthropicError(503, 'Service unavailable');
    const res = await handler(makeReq({ prompt: 'test' }));
    assert.equal(res.status, 500);
    const d = await res.json();
    assert.match(d.error, /503/);
  });

  test('Anthropic stream error event → 500', async () => {
    globalThis.fetch = mockAnthropicStreamError();
    const res = await handler(makeReq({ prompt: 'test' }));
    assert.equal(res.status, 500);
  });

  test('network failure → 500', async () => {
    globalThis.fetch = async () => { throw new Error('Network down'); };
    const res = await handler(makeReq({ prompt: 'test' }));
    assert.equal(res.status, 500);
    const d = await res.json();
    assert.match(d.error, /Network down/);
  });
});

/* ── Rate limiting ────────────────────────────────────────── */

describe('Rate limiting', () => {
  test('6 requêtes sur la même IP → 429', async () => {
    globalThis.fetch = mockAnthropicStream();
    const ip  = `10.8.${++_ip}.1`;
    const mkR = () => new Request('https://dok-peyi.vercel.app/api/generate-cv', {
      method:  'POST',
      headers: { 'content-type': 'application/json', 'x-forwarded-for': ip },
      body:    JSON.stringify({ prompt: 'test' })
    });
    let last;
    for (let i = 0; i < 6; i++) last = await handler(mkR());
    assert.equal(last.status, 429);
  });
});
