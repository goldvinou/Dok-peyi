/**
 * tests/payment-webhook.test.js
 * Unit tests for api/payment-webhook.js
 *
 * Tests HTTP validation, secret guard, internal payment confirmation,
 * Stripe signature path, and idempotence behaviour.
 * All Firebase REST calls and Stripe signature crypto are mocked.
 */

import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';

const { default: handler } = await import('../api/payment-webhook.js');

/* ── Helpers ─────────────────────────────────────────────── */

function makeReq(body, method = 'POST', headers = {}) {
  const h = new Headers({ 'content-type': 'application/json', ...headers });
  return new Request('https://dok-peyi.vercel.app/api/payment-webhook', {
    method,
    headers: h,
    body: method === 'POST' ? JSON.stringify(body) : undefined
  });
}

/** Minimal order at pending_payment for confirm_payment tests. */
function pendingOrder(overrides = {}) {
  return {
    id:         'order_test_1',
    service:    'cv',
    prenom:     'Test',
    email:      'test@test.fr',
    montant:    8,
    statut:     'pending_payment',
    _pipeline:  [
      { status: 'submitted',       ts: '2024-01-01T00:00:00Z' },
      { status: 'processing',      ts: '2024-01-01T00:01:00Z' },
      { status: 'generated',       ts: '2024-01-01T00:02:00Z' },
      { status: 'pending_payment', ts: '2024-01-01T00:03:00Z' }
    ],
    _documents: { final: '<html><body>Doc</body></html>' },
    ...overrides
  };
}

/* ── Setup / teardown ─────────────────────────────────────── */

let origFetch;
beforeEach(() => {
  origFetch = globalThis.fetch;
  process.env.DOK_WEBHOOK_SECRET    = 'test-secret-123';
  process.env.FIREBASE_DATABASE_URL = 'https://fake-db.firebaseio.com';
  process.env.NEXT_PUBLIC_BASE_URL  = 'https://dok-peyi.vercel.app';
  // Default mock: Firebase and email calls succeed silently
  globalThis.fetch = async () => ({ ok: true, json: async () => ({}) });
});
afterEach(() => {
  globalThis.fetch = origFetch;
  delete process.env.DOK_WEBHOOK_SECRET;
  delete process.env.FIREBASE_DATABASE_URL;
  delete process.env.NEXT_PUBLIC_BASE_URL;
  delete process.env.STRIPE_WEBHOOK_SECRET;
});

/* ── HTTP method validation ───────────────────────────────── */

describe('HTTP method validation', () => {
  test('OPTIONS returns 200 (CORS preflight)', async () => {
    const req = new Request('https://dok-peyi.vercel.app/api/payment-webhook', { method: 'OPTIONS' });
    const res = await handler(req);
    assert.equal(res.status, 200);
  });

  test('GET returns 405', async () => {
    const req = new Request('https://dok-peyi.vercel.app/api/payment-webhook', { method: 'GET' });
    const res  = await handler(req);
    assert.equal(res.status, 405);
  });
});

/* ── Internal webhook (secret guard) ─────────────────────── */

describe('Internal webhook — secret validation', () => {
  test('rejects missing secret with 403', async () => {
    const res  = await handler(makeReq({ order: pendingOrder() }));
    const body = await res.json();
    assert.equal(res.status, 403);
    assert.equal(body.ok, false);
  });

  test('rejects wrong secret with 403', async () => {
    const res  = await handler(makeReq({ secret: 'wrong-secret', order: pendingOrder() }));
    assert.equal(res.status, 403);
  });

  test('accepts correct secret', async () => {
    const res  = await handler(makeReq({ secret: 'test-secret-123', order: pendingOrder() }));
    const body = await res.json();
    assert.equal(body.ok, true);
  });

  test('returns 400 when order is missing', async () => {
    const res  = await handler(makeReq({ secret: 'test-secret-123' }));
    const body = await res.json();
    assert.equal(res.status, 400);
    assert.equal(body.ok, false);
  });
});

/* ── Internal webhook — payment confirmation ──────────────── */

describe('Internal webhook — payment confirmation', () => {
  test('confirms pending_payment → paid', async () => {
    const res  = await handler(makeReq({
      secret: 'test-secret-123',
      order:  pendingOrder(),
      provider: 'manual'
    }));
    const body = await res.json();
    assert.equal(body.ok, true);
    assert.equal(body.order?.statut, 'paid');
  });

  test('records provider in _payment metadata', async () => {
    const res  = await handler(makeReq({
      secret:    'test-secret-123',
      order:     pendingOrder(),
      provider:  'momo',
      reference: 'TXN-001',
      amount:    8
    }));
    const body = await res.json();
    assert.equal(body.order?._payment?.provider,  'momo');
    assert.equal(body.order?._payment?.reference, 'TXN-001');
  });

  test('fails gracefully when order is not at pending_payment', async () => {
    const res  = await handler(makeReq({
      secret: 'test-secret-123',
      order:  pendingOrder({ statut: 'delivered' })
    }));
    const body = await res.json();
    assert.equal(body.ok, false);
  });
});

/* ── Stripe webhook path ──────────────────────────────────── */

describe('Stripe webhook path', () => {
  test('rejects invalid stripe-signature with 400 when STRIPE_WEBHOOK_SECRET is set', async () => {
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test';
    const stripeEvent = JSON.stringify({
      id:   'evt_test',
      type: 'checkout.session.completed',
      data: { object: { metadata: { order_id: 'o1' }, amount_total: 800, payment_intent: 'pi_1', customer_email: 'x@y.fr' } }
    });
    // Bad signature
    const req = new Request('https://dok-peyi.vercel.app/api/payment-webhook', {
      method:  'POST',
      headers: { 'stripe-signature': 't=invalid,v1=badsig', 'content-type': 'text/plain' },
      body:    stripeEvent
    });
    const res  = await handler(req);
    const body = await res.json();
    assert.equal(res.status, 400);
    assert.equal(body.ok, false);
  });

  test('processes checkout.session.completed when STRIPE_WEBHOOK_SECRET is absent (no sig check)', async () => {
    // When no STRIPE_WEBHOOK_SECRET is configured, signature is skipped
    delete process.env.STRIPE_WEBHOOK_SECRET;

    let firebaseCalled = false;
    globalThis.fetch = async (url) => {
      if (String(url).includes('firebaseio.com')) firebaseCalled = true;
      return { ok: true, json: async () => ({}) };
    };

    const stripeEvent = JSON.stringify({
      id:   'evt_no_sig',
      type: 'checkout.session.completed',
      data: { object: {
        metadata:       { order_id: 'order_abc' },
        amount_total:   1500,
        payment_intent: 'pi_test_xyz',
        customer_email: 'client@example.fr'
      }}
    });

    const req = new Request('https://dok-peyi.vercel.app/api/payment-webhook', {
      method:  'POST',
      headers: { 'stripe-signature': 't=1,v1=fakesig', 'content-type': 'text/plain' },
      body:    stripeEvent
    });
    const res  = await handler(req);
    const body = await res.json();
    assert.equal(res.status, 200);
    assert.equal(body.ok, true);
    assert.ok(firebaseCalled, 'Firebase should be updated after checkout.session.completed');
  });

  test('ignores unhandled Stripe event types and returns ok:true', async () => {
    delete process.env.STRIPE_WEBHOOK_SECRET;
    const stripeEvent = JSON.stringify({
      id:   'evt_refund',
      type: 'charge.refunded',
      data: { object: {} }
    });
    const req = new Request('https://dok-peyi.vercel.app/api/payment-webhook', {
      method:  'POST',
      headers: { 'stripe-signature': 't=1,v1=x', 'content-type': 'text/plain' },
      body:    stripeEvent
    });
    const res  = await handler(req);
    const body = await res.json();
    assert.equal(res.status, 200);
    assert.equal(body.ok, true);
  });
});

/* ── Idempotence ──────────────────────────────────────────── */

describe('Idempotence (Stripe duplicate events)', () => {
  test('second identical event returns ok:true with idempotent:true', async () => {
    delete process.env.STRIPE_WEBHOOK_SECRET;

    let fetchCallCount = 0;
    const processedEvents = new Map();

    globalThis.fetch = async (url, opts) => {
      const urlStr = String(url);
      fetchCallCount++;

      // Simulate Firebase processed-events check
      if (urlStr.includes('processed-events')) {
        if (opts?.method === 'PUT') {
          const key = urlStr.split('/processed-events/')[1]?.replace('.json', '');
          if (key) processedEvents.set(key, true);
          return { ok: true, json: async () => ({}) };
        }
        // GET — return null if not seen, { ts: 123 } if seen
        const key = urlStr.split('/processed-events/')[1]?.replace('.json', '');
        const seen = key && processedEvents.has(key);
        return { ok: true, json: async () => seen ? { ts: Date.now() } : null };
      }
      return { ok: true, json: async () => ({}) };
    };

    const stripeEvent = JSON.stringify({
      id:   'evt_idem_001',
      type: 'checkout.session.completed',
      data: { object: { metadata: { order_id: 'o_idem' }, amount_total: 800, payment_intent: 'pi_x' } }
    });

    const makeStripeReq = () => new Request('https://dok-peyi.vercel.app/api/payment-webhook', {
      method:  'POST',
      headers: { 'stripe-signature': 't=1,v1=x', 'content-type': 'text/plain' },
      body:    stripeEvent
    });

    // First call — should process normally
    const res1  = await handler(makeStripeReq());
    const body1 = await res1.json();
    assert.equal(body1.ok, true);
    assert.ok(!body1.idempotent, 'first call should not be marked idempotent');

    // Second call — same event id → should be idempotent
    const res2  = await handler(makeStripeReq());
    const body2 = await res2.json();
    assert.equal(body2.ok, true);
    assert.equal(body2.idempotent, true, 'duplicate event must be marked idempotent');
  });
});
