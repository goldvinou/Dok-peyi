/**
 * tests/rate-limit.test.js
 * Unit tests for lib/rate-limit.js
 *
 * Tests the sliding-window counter, IP extraction, and edge cases.
 * Uses real Date.now() — no mocking needed since windows are identified
 * by timestamp buckets and each test uses a unique IP to avoid cross-test state.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { rateLimit } from '../lib/rate-limit.js';

/* ── Helpers ─────────────────────────────────────────────── */

let ipCounter = 0;

/** Build a minimal Request-like object with a given IP header. */
function makeReq(ip, headerName = 'x-forwarded-for') {
  const headers = new Map([[headerName, ip]]);
  return { headers: { get: k => headers.get(k) ?? null } };
}

/** Use a fresh unique IP for each test to avoid shared state. */
function freshReq(headerName = 'x-forwarded-for') {
  return makeReq(`10.0.0.${++ipCounter}`, headerName);
}

/* ── Basic window behaviour ───────────────────────────────── */

describe('Basic window behaviour', () => {
  test('first request is allowed', () => {
    const result = rateLimit(freshReq(), { max: 3, windowMs: 60_000 });
    assert.equal(result.ok, true);
    assert.equal(result.remaining, 2);
  });

  test('requests within limit are all allowed', () => {
    const req = freshReq();
    for (let i = 0; i < 5; i++) {
      const r = rateLimit(req, { max: 5, windowMs: 60_000 });
      assert.equal(r.ok, true, `request ${i + 1} should be allowed`);
    }
  });

  test('request exceeding max is rejected', () => {
    const req = freshReq();
    for (let i = 0; i < 5; i++) rateLimit(req, { max: 5, windowMs: 60_000 });
    const blocked = rateLimit(req, { max: 5, windowMs: 60_000 });
    assert.equal(blocked.ok, false);
    assert.equal(blocked.remaining, 0);
  });

  test('remaining decrements with each request', () => {
    const req = freshReq();
    const r1 = rateLimit(req, { max: 4, windowMs: 60_000 });
    const r2 = rateLimit(req, { max: 4, windowMs: 60_000 });
    const r3 = rateLimit(req, { max: 4, windowMs: 60_000 });
    assert.equal(r1.remaining, 3);
    assert.equal(r2.remaining, 2);
    assert.equal(r3.remaining, 1);
  });

  test('resetAt is in the future', () => {
    const before = Date.now();
    const result = rateLimit(freshReq(), { max: 5, windowMs: 60_000 });
    assert.ok(result.resetAt > before, 'resetAt must be in the future');
  });

  test('blocked result carries resetAt', () => {
    const req = freshReq();
    for (let i = 0; i < 3; i++) rateLimit(req, { max: 3, windowMs: 60_000 });
    const blocked = rateLimit(req, { max: 3, windowMs: 60_000 });
    assert.ok(typeof blocked.resetAt === 'number');
    assert.ok(blocked.resetAt > Date.now());
  });
});

/* ── IP isolation ─────────────────────────────────────────── */

describe('IP isolation', () => {
  test('different IPs have independent counters', () => {
    const req1 = freshReq();
    const req2 = freshReq();
    for (let i = 0; i < 5; i++) rateLimit(req1, { max: 5, windowMs: 60_000 });
    // req1 is now at limit
    const blocked = rateLimit(req1, { max: 5, windowMs: 60_000 });
    assert.equal(blocked.ok, false);
    // req2 is untouched
    const allowed = rateLimit(req2, { max: 5, windowMs: 60_000 });
    assert.equal(allowed.ok, true);
  });
});

/* ── IP header priority ───────────────────────────────────── */

describe('IP header extraction', () => {
  test('uses cf-connecting-ip header when present (highest priority)', () => {
    const req = { headers: { get: k => k === 'cf-connecting-ip' ? '1.2.3.4' : null } };
    const r = rateLimit(req, { max: 2, windowMs: 60_000 });
    assert.equal(r.ok, true);
  });

  test('falls back to x-forwarded-for when cf header absent', () => {
    const req = makeReq('5.6.7.8', 'x-forwarded-for');
    const r = rateLimit(req, { max: 2, windowMs: 60_000 });
    assert.equal(r.ok, true);
  });

  test('trims first IP from x-forwarded-for list (proxy chain)', () => {
    // x-forwarded-for can be "client, proxy1, proxy2"
    const req = { headers: { get: k => k === 'x-forwarded-for' ? '11.22.33.44, 99.99.99.99' : null } };
    const r1 = rateLimit(req, { max: 3, windowMs: 60_000 });
    assert.equal(r1.ok, true);
    assert.equal(r1.remaining, 2);
    // Second request with same first IP in chain
    const r2 = rateLimit(req, { max: 3, windowMs: 60_000 });
    assert.equal(r2.remaining, 1, 'counter should increment for same first-IP');
  });

  test('uses x-real-ip as final fallback', () => {
    const req = { headers: { get: k => k === 'x-real-ip' ? '77.88.99.0' : null } };
    const r = rateLimit(req, { max: 2, windowMs: 60_000 });
    assert.equal(r.ok, true);
  });

  test('uses "unknown" when no IP header present', () => {
    const req = { headers: { get: () => null } };
    // Should not throw, just use 'unknown' as key
    assert.doesNotThrow(() => rateLimit(req, { max: 2, windowMs: 60_000 }));
  });
});

/* ── Default options ──────────────────────────────────────── */

describe('Default options', () => {
  test('default max=10 allows 10 requests before blocking', () => {
    const req = freshReq();
    for (let i = 0; i < 10; i++) {
      const r = rateLimit(req);
      assert.equal(r.ok, true, `request ${i + 1} should pass with default max`);
    }
    const blocked = rateLimit(req);
    assert.equal(blocked.ok, false);
  });
});
