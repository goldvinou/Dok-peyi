import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';

const { default: handler } = await import('../api/ai-chat.js');

/* ── Helpers ─────────────────────────────────────────────── */

let _ip = 0;
function makeReq(body, method = 'POST') {
  return new Request('https://dok-peyi.vercel.app/api/ai-chat', {
    method,
    headers: { 'content-type': 'application/json', 'x-forwarded-for': `10.9.${++_ip}.1` },
    body: method === 'POST' ? JSON.stringify(body) : undefined
  });
}

function mockAnthropicOk(reply = 'Réponse Claude') {
  return async () => ({
    ok:   true,
    json: async () => ({ content: [{ text: reply }] })
  });
}

function mockOpenAIOk(reply = 'Réponse GPT') {
  return async () => ({
    ok:   true,
    json: async () => ({ choices: [{ message: { content: reply } }] })
  });
}

function mockUpstreamError(status = 500) {
  return async () => ({ ok: false, status, text: async () => 'Internal error' });
}

function mockNetworkFailure() {
  return async () => { throw new Error('Network error'); };
}

let origFetch;
beforeEach(() => {
  origFetch = globalThis.fetch;
  process.env.CLAUD_API_KEY  = 'sk-ant-test';
  process.env.OPENAI_API_KEY = 'sk-oai-test';
});
afterEach(() => {
  globalThis.fetch = origFetch;
  delete process.env.CLAUD_API_KEY;
  delete process.env.OPENAI_API_KEY;
});

/* ── HTTP validation ──────────────────────────────────────── */

describe('HTTP validation', () => {
  test('OPTIONS → 200', async () => {
    const res = await handler(new Request('https://dok-peyi.vercel.app/api/ai-chat', { method: 'OPTIONS' }));
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
    const req = new Request('https://dok-peyi.vercel.app/api/ai-chat', {
      method:  'POST',
      headers: { 'content-type': 'application/json', 'x-forwarded-for': `10.9.${++_ip}.1` },
      body:    'not-json'
    });
    const res = await handler(req);
    assert.equal(res.status, 400);
  });

  test('missing prompt → 400', async () => {
    const res = await handler(makeReq({ service: 'claude' }));
    const d   = await res.json();
    assert.equal(res.status, 400);
    assert.match(d.error, /prompt/i);
  });

  test('empty prompt → 400', async () => {
    const res = await handler(makeReq({ prompt: '   ' }));
    assert.equal(res.status, 400);
  });

  test('prompt > 8000 chars → 400', async () => {
    const res = await handler(makeReq({ prompt: 'a'.repeat(8001) }));
    assert.equal(res.status, 400);
    const d   = await res.json();
    assert.match(d.error, /trop long/i);
  });

  test('history not array → 400', async () => {
    const res = await handler(makeReq({ prompt: 'Bonjour', history: 'oops' }));
    assert.equal(res.status, 400);
    const d   = await res.json();
    assert.match(d.error, /history/i);
  });

  test('unknown service → 400', async () => {
    const res = await handler(makeReq({ prompt: 'Bonjour', service: 'unknown' }));
    assert.equal(res.status, 400);
    const d   = await res.json();
    assert.match(d.error, /service inconnu/i);
  });
});

/* ── Claude (Anthropic) ───────────────────────────────────── */

describe('Claude service', () => {
  test('missing CLAUD_API_KEY → 500', async () => {
    delete process.env.CLAUD_API_KEY;
    const res = await handler(makeReq({ prompt: 'Bonjour', service: 'claude' }));
    assert.equal(res.status, 500);
    const d = await res.json();
    assert.match(d.error, /CLAUD_API_KEY/i);
  });

  test('successful Claude reply', async () => {
    globalThis.fetch = mockAnthropicOk('Bonjour, comment puis-je aider ?');
    const res = await handler(makeReq({ prompt: 'Bonjour', service: 'claude' }));
    assert.equal(res.status, 200);
    const d = await res.json();
    assert.equal(d.ok, true);
    assert.equal(d.reply, 'Bonjour, comment puis-je aider ?');
  });

  test('Claude with history (last 10 kept)', async () => {
    globalThis.fetch = mockAnthropicOk('OK');
    const history = Array.from({ length: 15 }, (_, i) => ({
      role:    i % 2 === 0 ? 'user' : 'assistant',
      content: `message ${i}`
    }));
    const res = await handler(makeReq({ prompt: 'Suite', service: 'claude', history }));
    assert.equal(res.status, 200);
  });

  test('Anthropic upstream error → 500', async () => {
    globalThis.fetch = mockUpstreamError(503);
    const res = await handler(makeReq({ prompt: 'Bonjour', service: 'claude' }));
    assert.equal(res.status, 500);
    const d = await res.json();
    assert.equal(d.ok, false);
  });

  test('Anthropic network failure → 500', async () => {
    globalThis.fetch = mockNetworkFailure();
    const res = await handler(makeReq({ prompt: 'Bonjour', service: 'claude' }));
    assert.equal(res.status, 500);
  });
});

/* ── GPT (OpenAI) ─────────────────────────────────────────── */

describe('GPT service', () => {
  test('missing OPENAI_API_KEY → 500', async () => {
    delete process.env.OPENAI_API_KEY;
    const res = await handler(makeReq({ prompt: 'Bonjour', service: 'gpt' }));
    assert.equal(res.status, 500);
    const d = await res.json();
    assert.match(d.error, /OPENAI_API_KEY/i);
  });

  test('successful GPT reply', async () => {
    globalThis.fetch = mockOpenAIOk('Réponse GPT test');
    const res = await handler(makeReq({ prompt: 'Bonjour', service: 'gpt' }));
    assert.equal(res.status, 200);
    const d = await res.json();
    assert.equal(d.ok, true);
    assert.equal(d.reply, 'Réponse GPT test');
  });

  test('OpenAI upstream error → 500', async () => {
    globalThis.fetch = mockUpstreamError(429);
    const res = await handler(makeReq({ prompt: 'Bonjour', service: 'gpt' }));
    assert.equal(res.status, 500);
  });

  test('OpenAI network failure → 500', async () => {
    globalThis.fetch = mockNetworkFailure();
    const res = await handler(makeReq({ prompt: 'Bonjour', service: 'gpt' }));
    assert.equal(res.status, 500);
  });
});

/* ── Rate limiting ────────────────────────────────────────── */

describe('Rate limiting', () => {
  test('21 requêtes sur la même IP → 429', async () => {
    globalThis.fetch = mockAnthropicOk();
    const ip  = `10.9.${++_ip}.1`;
    const mkR = () => new Request('https://dok-peyi.vercel.app/api/ai-chat', {
      method:  'POST',
      headers: { 'content-type': 'application/json', 'x-forwarded-for': ip },
      body:    JSON.stringify({ prompt: 'test' })
    });
    let last;
    for (let i = 0; i < 21; i++) last = await handler(mkR());
    assert.equal(last.status, 429);
  });
});
