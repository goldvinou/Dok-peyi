/**
 * tests/admin-auth.test.js
 * Unit tests for api/admin-auth.js
 *
 * Tests HTTP validation, rate limiting (brute-force guard),
 * missing-config path, and timing-safe credential check.
 * No real env passwords are used — test env vars are injected.
 */

import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';

const { default: handler } = await import('../api/admin-auth.js');

/* ── Helpers ─────────────────────────────────────────────── */

let _ipSeed = 0;
function makeReq(body, method = 'POST', ip) {
  const xfwd = ip ?? `192.168.10.${(++_ipSeed) % 256}`;
  return new Request('https://dok-peyi.vercel.app/api/admin-auth', {
    method,
    headers: { 'content-type': 'application/json', 'x-forwarded-for': xfwd },
    body: method === 'POST' ? JSON.stringify(body) : undefined
  });
}

/* ── Setup / teardown ─────────────────────────────────────── */

beforeEach(() => {
  process.env.ADMIN_PASS_ALLAN = 'hunter2';
  process.env.NEXT_PUBLIC_BASE_URL = 'https://dok-peyi.vercel.app';
});
afterEach(() => {
  delete process.env.ADMIN_PASS_ALLAN;
  delete process.env.NEXT_PUBLIC_BASE_URL;
});

/* ── HTTP method validation ───────────────────────────────── */

describe('HTTP method validation', () => {
  test('OPTIONS returns 200 (CORS preflight)', async () => {
    const req = new Request('https://dok-peyi.vercel.app/api/admin-auth', { method: 'OPTIONS' });
    const res = await handler(req);
    assert.equal(res.status, 200);
  });

  test('GET returns 405', async () => {
    const req = new Request('https://dok-peyi.vercel.app/api/admin-auth', { method: 'GET' });
    const res = await handler(req);
    assert.equal(res.status, 405);
    const body = await res.json();
    assert.equal(body.ok, false);
  });
});

/* ── Input validation ─────────────────────────────────────── */

describe('Input validation', () => {
  test('returns 400 when username is missing', async () => {
    const res  = await handler(makeReq({ password: 'hunter2' }));
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.ok, false);
  });

  test('returns 400 when password is missing', async () => {
    const res  = await handler(makeReq({ username: 'allan' }));
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.ok, false);
  });
});

/* ── Authentication ───────────────────────────────────────── */

describe('Authentication', () => {
  test('returns ok:true with user info on valid credentials', async () => {
    const res  = await handler(makeReq({ username: 'allan', password: 'hunter2' }));
    const body = await res.json();
    assert.equal(res.status, 200);
    assert.equal(body.ok, true);
    assert.equal(body.user, 'allan');
    assert.equal(body.role, 'admin');
    assert.ok(body.nom, 'nom should be present');
    assert.ok(!body.password, 'password must not be returned');
  });

  test('returns ok:false for wrong password', async () => {
    const res  = await handler(makeReq({ username: 'allan', password: 'wrong' }));
    const body = await res.json();
    assert.equal(res.status, 200);
    assert.equal(body.ok, false);
  });

  test('returns ok:false for unknown username', async () => {
    const res  = await handler(makeReq({ username: 'hacker', password: 'hunter2' }));
    const body = await res.json();
    assert.equal(res.status, 200);
    assert.equal(body.ok, false);
  });

  test('returns ok:false when env var for user is not set', async () => {
    delete process.env.ADMIN_PASS_ALLAN;
    const res  = await handler(makeReq({ username: 'allan', password: 'hunter2' }));
    const body = await res.json();
    assert.equal(body.ok, false);
  });

  test('is case-insensitive for username', async () => {
    const res  = await handler(makeReq({ username: 'ALLAN', password: 'hunter2' }));
    const body = await res.json();
    assert.equal(body.ok, true);
  });
});

/* ── Brute-force rate limiting ────────────────────────────── */

describe('Brute-force rate limiting', () => {
  test('blocks after 5 failed attempts from the same IP', async () => {
    const IP = '10.9.8.7';
    for (let i = 0; i < 5; i++) {
      await handler(makeReq({ username: 'allan', password: 'bad' }, 'POST', IP));
    }
    const blocked = await handler(makeReq({ username: 'allan', password: 'hunter2' }, 'POST', IP));
    assert.equal(blocked.status, 429);
    const body = await blocked.json();
    assert.equal(body.ok, false);
  });

  test('different IPs are not affected by another IP being blocked', async () => {
    const BAD_IP  = '10.9.8.6';
    const GOOD_IP = '10.9.8.5';
    for (let i = 0; i < 5; i++) {
      await handler(makeReq({ username: 'allan', password: 'bad' }, 'POST', BAD_IP));
    }
    // BAD_IP is now blocked — GOOD_IP should still work
    const res  = await handler(makeReq({ username: 'allan', password: 'hunter2' }, 'POST', GOOD_IP));
    const body = await res.json();
    assert.equal(body.ok, true);
  });
});
