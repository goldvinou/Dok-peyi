/**
 * tests/send-email.test.js
 * Unit tests for api/send-email.js
 *
 * Tests the email builder logic and HTTP validation layer.
 * A mock fetch is injected to avoid real Resend API calls.
 */

import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';

/* ── Node 18+ provides Request/Response globally ── */
const { default: handler } = await import('../api/send-email.js');

/* ── Helpers ─────────────────────────────────────────────── */

function makeReq(body, method = 'POST') {
  return new Request('https://dok-peyi.vercel.app/api/send-email', {
    method,
    headers: { 'content-type': 'application/json' },
    body:    method === 'POST' ? JSON.stringify(body) : undefined
  });
}

const ORDER_BASE = { id: 42, service: 'cv', prenom: 'Jean', email: 'jean@test.fr', montant: 8 };

function mockResendOk() {
  return async (_url, _opts) => ({
    ok:   true,
    json: async () => ({ id: 'email_abc123' })
  });
}

function mockResendError(message = 'Invalid API key') {
  return async () => ({
    ok:   false,
    json: async () => ({ message })
  });
}

/* ── Setup / teardown ─────────────────────────────────────── */

let origFetch;
beforeEach(() => {
  origFetch = globalThis.fetch;
  process.env.RESEND_API_KEY = 'test_key_resend';
  process.env.EMAIL_FROM     = 'Dok\'péyi <noreply@dok-peyi.fr>';
  process.env.EMAIL_ADMIN    = 'admin@dok-peyi.fr';
});
afterEach(() => {
  globalThis.fetch = origFetch;
  delete process.env.RESEND_API_KEY;
});

/* ── HTTP method validation ───────────────────────────────── */

describe('HTTP method validation', () => {
  test('rejects GET with 405', async () => {
    const res = await handler(makeReq(null, 'GET'));
    assert.equal(res.status, 405);
    const body = await res.json();
    assert.equal(body.ok, false);
  });
});

/* ── Missing config ───────────────────────────────────────── */

describe('Missing configuration', () => {
  test('returns 503 when RESEND_API_KEY is absent', async () => {
    delete process.env.RESEND_API_KEY;
    const res  = await handler(makeReq({ type: 'order_confirmation', order: ORDER_BASE }));
    assert.equal(res.status, 503);
    const body = await res.json();
    assert.equal(body.ok, false);
  });
});

/* ── Input validation ─────────────────────────────────────── */

describe('Input validation', () => {
  test('returns 400 when type is missing', async () => {
    globalThis.fetch = mockResendOk();
    const res  = await handler(makeReq({ order: ORDER_BASE }));
    assert.equal(res.status, 400);
  });

  test('returns 400 when order is missing', async () => {
    globalThis.fetch = mockResendOk();
    const res  = await handler(makeReq({ type: 'order_confirmation' }));
    assert.equal(res.status, 400);
  });

  test('returns 400 for unknown email type', async () => {
    globalThis.fetch = mockResendOk();
    const res  = await handler(makeReq({ type: 'unknown_type', order: ORDER_BASE }));
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.ok(body.error.includes('inconnu'));
  });

  test('returns 400 when client email is missing for order_confirmation', async () => {
    globalThis.fetch = mockResendOk();
    const orderNoEmail = { ...ORDER_BASE, email: undefined };
    const res  = await handler(makeReq({ type: 'order_confirmation', order: orderNoEmail }));
    assert.equal(res.status, 400);
  });
});

/* ── Email types ──────────────────────────────────────────── */

describe('Email types', () => {
  test('order_confirmation: sends to client email, returns ok:true', async () => {
    let captured;
    globalThis.fetch = async (_url, opts) => {
      captured = JSON.parse(opts.body);
      return { ok: true, json: async () => ({ id: 'em_1' }) };
    };
    const res  = await handler(makeReq({ type: 'order_confirmation', order: ORDER_BASE }));
    const body = await res.json();
    assert.equal(res.status, 200);
    assert.equal(body.ok, true);
    assert.equal(body.id, 'em_1');
    assert.ok(captured.to.includes('jean@test.fr'), 'should send to client email');
    assert.ok(captured.subject.toLowerCase().includes('confirmation'));
  });

  test('new_order_admin: sends to admin email (not client)', async () => {
    let captured;
    globalThis.fetch = async (_url, opts) => {
      captured = JSON.parse(opts.body);
      return { ok: true, json: async () => ({ id: 'em_2' }) };
    };
    await handler(makeReq({ type: 'new_order_admin', order: ORDER_BASE }));
    assert.ok(captured.to.includes('admin@dok-peyi.fr'));
    assert.ok(!captured.to.includes('jean@test.fr'), 'must not send to client');
  });

  test('document_delivered: sends to client, subject mentions document', async () => {
    let captured;
    globalThis.fetch = async (_url, opts) => {
      captured = JSON.parse(opts.body);
      return { ok: true, json: async () => ({ id: 'em_3' }) };
    };
    await handler(makeReq({ type: 'document_delivered', order: ORDER_BASE }));
    assert.ok(captured.to.includes('jean@test.fr'));
    assert.ok(captured.subject.toLowerCase().includes('document') || captured.subject.toLowerCase().includes('prêt'));
  });

  test('HTML body contains the client first name', async () => {
    let captured;
    globalThis.fetch = async (_url, opts) => {
      captured = JSON.parse(opts.body);
      return { ok: true, json: async () => ({ id: 'em_4' }) };
    };
    await handler(makeReq({ type: 'order_confirmation', order: ORDER_BASE }));
    assert.ok(captured.html.includes('Jean'), 'HTML should contain client first name');
  });

  test('HTML body does not contain raw user input that could cause XSS', async () => {
    let captured;
    globalThis.fetch = async (_url, opts) => {
      captured = JSON.parse(opts.body);
      return { ok: true, json: async () => ({ id: 'em_5' }) };
    };
    const xssOrder = { ...ORDER_BASE, prenom: '<script>alert(1)</script>' };
    await handler(makeReq({ type: 'order_confirmation', order: xssOrder }));
    assert.ok(!captured.html.includes('<script>'), 'raw <script> tag must be escaped');
    assert.ok(captured.html.includes('&lt;script&gt;'), 'must contain HTML-escaped version');
  });
});

/* ── Resend API failure ───────────────────────────────────── */

describe('Resend API errors', () => {
  test('returns 500 and propagates Resend error message', async () => {
    globalThis.fetch = mockResendError('Invalid API key');
    const res  = await handler(makeReq({ type: 'order_confirmation', order: ORDER_BASE }));
    assert.equal(res.status, 500);
    const body = await res.json();
    assert.equal(body.ok, false);
    assert.ok(body.error.length > 0);
  });
});
