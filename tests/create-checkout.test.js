/**
 * tests/create-checkout.test.js
 * Unit tests for api/create-checkout.js
 *
 * Tests HTTP validation, input validation, Stripe payload construction,
 * and the toFormData serialiser via a mocked fetch.
 */

import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';

const { default: handler } = await import('../api/create-checkout.js');

/* ── Helpers ─────────────────────────────────────────────── */

function makeReq(body, method = 'POST') {
  return new Request('https://dok-peyi.vercel.app/api/create-checkout', {
    method,
    headers: { 'content-type': 'application/json' },
    body:    method === 'POST' ? JSON.stringify(body) : undefined
  });
}

const VALID_BODY = { service: 'cv', amount: 8, orderId: 'order_99', email: 'client@test.fr', prenom: 'Marie', nom: 'Dupont' };

function mockStripeOk(sessionId = 'cs_test_abc', url = 'https://checkout.stripe.com/pay/cs_test_abc') {
  return async (_url, opts) => ({
    ok:   true,
    json: async () => ({ id: sessionId, url })
  });
}

function mockStripeError(msg = 'Your card was declined.') {
  return async () => ({
    ok:   false,
    json: async () => ({ error: { message: msg } })
  });
}

/* ── Setup / teardown ─────────────────────────────────────── */

let origFetch;
beforeEach(() => {
  origFetch = globalThis.fetch;
  process.env.STRIPE_SECRET_KEY    = 'sk_test_fake';
  process.env.NEXT_PUBLIC_BASE_URL = 'https://dok-peyi.vercel.app';
});
afterEach(() => {
  globalThis.fetch = origFetch;
  delete process.env.STRIPE_SECRET_KEY;
  delete process.env.NEXT_PUBLIC_BASE_URL;
});

/* ── HTTP method validation ───────────────────────────────── */

describe('HTTP method validation', () => {
  test('rejects GET with 405', async () => {
    const res  = await handler(makeReq(null, 'GET'));
    assert.equal(res.status, 405);
    const body = await res.json();
    assert.equal(body.ok, false);
  });
});

/* ── Missing config ───────────────────────────────────────── */

describe('Missing configuration', () => {
  test('returns 503 when STRIPE_SECRET_KEY is absent', async () => {
    delete process.env.STRIPE_SECRET_KEY;
    const res  = await handler(makeReq(VALID_BODY));
    assert.equal(res.status, 503);
    const body = await res.json();
    assert.equal(body.ok, false);
  });
});

/* ── Input validation ─────────────────────────────────────── */

describe('Input validation', () => {
  test('returns 400 when service is missing', async () => {
    globalThis.fetch = mockStripeOk();
    const res = await handler(makeReq({ amount: 8, orderId: 'x' }));
    assert.equal(res.status, 400);
  });

  test('returns 400 when amount is missing', async () => {
    globalThis.fetch = mockStripeOk();
    const res = await handler(makeReq({ service: 'cv', orderId: 'x' }));
    assert.equal(res.status, 400);
  });

  test('returns 400 when orderId is missing', async () => {
    globalThis.fetch = mockStripeOk();
    const res = await handler(makeReq({ service: 'cv', amount: 8 }));
    assert.equal(res.status, 400);
  });
});

/* ── Successful checkout creation ─────────────────────────── */

describe('Successful session creation', () => {
  test('returns ok:true with url and sessionId', async () => {
    globalThis.fetch = mockStripeOk('cs_test_001', 'https://checkout.stripe.com/c/pay/cs_test_001');
    const res  = await handler(makeReq(VALID_BODY));
    const body = await res.json();
    assert.equal(res.status, 200);
    assert.equal(body.ok, true);
    assert.equal(body.sessionId, 'cs_test_001');
    assert.ok(body.url.startsWith('https://checkout.stripe.com'));
  });

  test('success_url contains order_id parameter', async () => {
    let capturedBody;
    globalThis.fetch = async (_url, opts) => {
      capturedBody = opts.body;
      return { ok: true, json: async () => ({ id: 'cs_x', url: 'https://stripe.com/pay' }) };
    };
    await handler(makeReq(VALID_BODY));
    assert.ok(capturedBody.includes('success_url'), 'payload must contain success_url');
    assert.ok(capturedBody.includes('order_99'),    'success_url must contain the orderId');
    assert.ok(capturedBody.includes('success%3D1') || capturedBody.includes('success=1'), 'success flag present');
  });

  test('cancel_url references the service slug', async () => {
    let capturedBody;
    globalThis.fetch = async (_url, opts) => {
      capturedBody = opts.body;
      return { ok: true, json: async () => ({ id: 'cs_x', url: 'https://stripe.com/pay' }) };
    };
    await handler(makeReq(VALID_BODY));
    assert.ok(capturedBody.includes('cancel_url'), 'payload must contain cancel_url');
    assert.ok(capturedBody.includes('cv'), 'cancel_url must reference service slug');
  });

  test('amount is converted to cents', async () => {
    let capturedBody;
    globalThis.fetch = async (_url, opts) => {
      capturedBody = opts.body;
      return { ok: true, json: async () => ({ id: 'cs_x', url: 'https://stripe.com/pay' }) };
    };
    await handler(makeReq({ ...VALID_BODY, amount: 12.50 }));
    assert.ok(capturedBody.includes('1250'), 'amount must be converted to cents (12.50€ → 1250)');
  });

  test('customer_email is pre-filled when provided', async () => {
    let capturedBody;
    globalThis.fetch = async (_url, opts) => {
      capturedBody = opts.body;
      return { ok: true, json: async () => ({ id: 'cs_x', url: '' }) };
    };
    await handler(makeReq(VALID_BODY));
    assert.ok(capturedBody.includes('customer_email'), 'customer_email should be set');
    assert.ok(capturedBody.includes('client%40test.fr') || capturedBody.includes('client@test.fr'));
  });

  test('metadata contains order_id and service', async () => {
    let capturedBody;
    globalThis.fetch = async (_url, opts) => {
      capturedBody = opts.body;
      return { ok: true, json: async () => ({ id: 'cs_x', url: '' }) };
    };
    await handler(makeReq(VALID_BODY));
    assert.ok(capturedBody.includes('metadata'), 'metadata must be present');
    assert.ok(capturedBody.includes('order_99'), 'order_id in metadata');
  });

  test('currency is EUR', async () => {
    let capturedBody;
    globalThis.fetch = async (_url, opts) => {
      capturedBody = opts.body;
      return { ok: true, json: async () => ({ id: 'cs_x', url: '' }) };
    };
    await handler(makeReq(VALID_BODY));
    assert.ok(capturedBody.includes('eur'), 'currency must be EUR');
  });
});

/* ── Stripe API failure ───────────────────────────────────── */

describe('Stripe API errors', () => {
  test('returns 500 and propagates Stripe error message', async () => {
    globalThis.fetch = mockStripeError('Your card was declined.');
    const res  = await handler(makeReq(VALID_BODY));
    assert.equal(res.status, 500);
    const body = await res.json();
    assert.equal(body.ok, false);
    assert.ok(body.error.length > 0);
  });
});
