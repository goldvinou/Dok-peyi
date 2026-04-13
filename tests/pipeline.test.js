/**
 * tests/pipeline.test.js
 * Integration tests for lib/pipeline.js
 *
 * Tests cases 1–4 (auto-flow / review routing) use a mocked global fetch
 * so no real Anthropic call is made.
 * Tests cases 8–9 (delivery guards) need no mock — they are pure logic.
 */

import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  createOrder, applyTransition, handlers, VALID_TRANSITIONS
} from '../lib/pipeline.js';

/* ── Mock helpers ─────────────────────────────────────────── */

/** Minimal valid HTML the AI might return for html-format services */
const MOCK_HTML = '<!DOCTYPE html><html><head></head><body><p>Document test</p></body></html>';

/** Minimal valid JSON for the CV (scratch) schema */
const MOCK_CV_JSON = JSON.stringify({
  meta: { poste: 'Développeur Web' },
  sections: [
    { id: 'profil', title: 'Profil', type: 'paragraph', content: 'Profil de test.' }
  ]
});

/** Minimal valid JSON for the séjour schema */
const MOCK_SEJOUR_JSON = JSON.stringify({
  titre:           'Première demande de titre de séjour',
  situation:       'Client présent en Guyane depuis 2 ans.',
  conditions:      ['Résidence légale'],
  documents:       [{ nom: 'Passeport', detail: 'En cours de validité', obligatoire: true }],
  etapes:          [{ titre: 'Étape 1 — Rassembler les pièces', detail: 'Voir checklist' }],
  delais:          'Environ 3 à 6 mois',
  avertissements:  ['Ce document est une aide à la préparation. Il ne remplace pas un conseil juridique professionnel.'],
  organismes:      [{ nom: 'Préfecture de Guyane', adresse: 'Cayenne', tel: '05 94 39 45 00', horaires: 'Lun-Ven 9h-12h' }]
});

/**
 * Build a fake fetch that responds like Anthropic's /v1/messages endpoint.
 * The pipeline calls res.json() and reads content[0].text.
 */
function mockFetch(responseText) {
  return async (_url, _opts) => ({
    ok:   true,
    json: async () => ({ content: [{ text: responseText }] })
  });
}

/** A fetch that simulates an Anthropic server error */
function mockFetchError(status = 503) {
  return async () => ({
    ok:     false,
    status,
    text:   async () => 'Service unavailable'
  });
}

/* ── Order factories ────────────────────────────────────── */

const API_KEY = 'test-key';  // any non-empty string satisfies the handler

function makeOrder(service, details = {}, price = 8) {
  return createOrder({
    id:       Date.now(),
    service,
    personal: { prenom: 'Test', nom: 'Utilisateur', email: 'test@dokpeyi.fr', phone: '0600000000' },
    details,
    price
  });
}

/* ── createOrder() ──────────────────────────────────────── */

describe('createOrder()', () => {
  test('new order starts at submitted status', () => {
    const order = makeOrder('cv');
    assert.equal(order.statut, 'submitted');
  });

  test('_pipeline audit trail has one submitted entry', () => {
    const order = makeOrder('cv');
    assert.ok(Array.isArray(order._pipeline));
    assert.equal(order._pipeline.length, 1);
    assert.equal(order._pipeline[0].status, 'submitted');
  });

  test('order carries service and personal data', () => {
    const order = makeOrder('lettre', { 'l-poste': 'Assistante' }, 5);
    assert.equal(order.service,  'lettre');
    assert.equal(order.prenom,   'Test');
    assert.equal(order.montant,  5);
  });
});

/* ── applyTransition() ──────────────────────────────────── */

describe('applyTransition()', () => {
  test('valid transition advances status and appends to audit trail', () => {
    const order  = makeOrder('cv');                          // submitted
    const result = applyTransition(order, 'processing');
    assert.equal(result.ok, true);
    assert.equal(result.order.statut, 'processing');
    assert.equal(result.order._pipeline.length, 2);
    assert.equal(result.order._pipeline[1].status, 'processing');
  });

  test('each audit entry has an ISO timestamp', () => {
    const result = applyTransition(makeOrder('cv'), 'processing');
    const ts = result.order._pipeline[1].ts;
    assert.ok(!isNaN(Date.parse(ts)), 'timestamp should be a valid ISO date string');
  });

  test('invalid transition returns ok:false without mutating the original', () => {
    const order  = makeOrder('cv');                          // submitted
    const result = applyTransition(order, 'delivered');      // submitted → delivered invalid
    assert.equal(result.ok, false);
    assert.ok(result.error.includes('Transition invalide'));
    assert.equal(order.statut, 'submitted', 'original order must not be mutated');
  });

  test('needs_review → pending_payment is valid (pre-payment review path)', () => {
    const order  = { ...makeOrder('sejour'), statut: 'needs_review',
      _pipeline: [{ status: 'needs_review', ts: new Date().toISOString() }] };
    const result = applyTransition(order, 'pending_payment');
    assert.equal(result.ok, true);
    assert.equal(result.order.statut, 'pending_payment');
  });

  test('VALID_TRANSITIONS graph is consistent with key pipeline paths', () => {
    // Standard path
    assert.ok(VALID_TRANSITIONS.submitted.includes('processing'));
    assert.ok(VALID_TRANSITIONS.processing.includes('generated'));
    assert.ok(VALID_TRANSITIONS.generated.includes('pending_payment'));
    assert.ok(VALID_TRANSITIONS.pending_payment.includes('paid'));
    assert.ok(VALID_TRANSITIONS.paid.includes('delivered'));
    // Pre-payment review path
    assert.ok(VALID_TRANSITIONS.generated.includes('needs_review'));
    assert.ok(VALID_TRANSITIONS.needs_review.includes('pending_payment'));
    // Post-payment review path
    assert.ok(VALID_TRANSITIONS.paid.includes('needs_review'));
    assert.ok(VALID_TRANSITIONS.needs_review.includes('delivered'));
  });
});

/* ── handlers.generate() — with mocked fetch ───────────── */

describe('handlers.generate() — auto-flow and review routing', () => {
  let originalFetch;
  beforeEach(() => { originalFetch = globalThis.fetch; });
  afterEach(()  => { globalThis.fetch = originalFetch; });

  // Case 1: CV → pending_payment
  test('case 1 — CV (scratch) reaches pending_payment automatically', async () => {
    globalThis.fetch = mockFetch(MOCK_CV_JSON);
    const result = await handlers.generate(
      makeOrder('cv', { 'cv-choix': 'scratch', 'cv-poste': 'Développeur' }),
      { apiKey: API_KEY }
    );
    assert.equal(result.ok,                  true);
    assert.equal(result.order.statut,        'pending_payment');
    assert.equal(result.order.reviewRequired, false);
    assert.ok(result.order._documents?.final, 'final HTML must be stored');
    // Audit trail must include all intermediate statuses
    const statuses = result.order._pipeline.map(e => e.status);
    assert.ok(statuses.includes('processing'),      'audit: processing');
    assert.ok(statuses.includes('generated'),       'audit: generated');
    assert.ok(statuses.includes('pending_payment'), 'audit: pending_payment');
  });

  // Case 2: lettre → pending_payment
  test('case 2 — cover letter reaches pending_payment automatically', async () => {
    globalThis.fetch = mockFetch(MOCK_HTML);
    const result = await handlers.generate(
      makeOrder('lettre', { 'l-poste': 'Assistant(e)', 'l-entreprise': 'Mairie', 'sw-choice': 'classique' }, 5),
      { apiKey: API_KEY }
    );
    assert.equal(result.ok,                  true);
    assert.equal(result.order.statut,        'pending_payment');
    assert.equal(result.order.reviewRequired, false);
  });

  // Case 3: dossier with short description → needs_review
  test('case 3 — dossier with insufficient description goes to needs_review', async () => {
    globalThis.fetch = mockFetch(MOCK_HTML);
    const result = await handlers.generate(
      makeOrder('dossier', { description: 'Aide logement', type: 'CAF' }, 12),
      // ↑ 13 chars < 40 minimum → triggers insufficient content review
      { apiKey: API_KEY }
    );
    assert.equal(result.ok,                  true);
    assert.equal(result.order.statut,        'needs_review');
    assert.equal(result.order.reviewRequired, true);
    assert.ok(result.order.reviewReason.includes('insuffisant'),
      'review reason should mention insufficient content');
    assert.ok(result.order._documents?.final, 'document still generated even when review required');
  });

  // Case 4: séjour → always needs_review
  test('case 4 — titre de séjour always goes to needs_review', async () => {
    globalThis.fetch = mockFetch(MOCK_SEJOUR_JSON);
    const result = await handlers.generate(
      makeOrder('sejour', { nationalite: 'Haïtienne', situation: 'En Guyane depuis 2 ans.', 'sw-choice': 'premiere' }, 15),
      { apiKey: API_KEY }
    );
    assert.equal(result.ok,                  true);
    assert.equal(result.order.statut,        'needs_review');
    assert.equal(result.order.reviewRequired, true);
    assert.ok(result.order.reviewReason.toLowerCase().includes('séjour'));
  });

  test('generate fails gracefully and sets status to failed on Anthropic error', async () => {
    globalThis.fetch = mockFetchError(503);
    const result = await handlers.generate(makeOrder('cv'), { apiKey: API_KEY });
    assert.equal(result.ok,           false);
    assert.equal(result.order.statut, 'failed');
    assert.ok(result.error.length > 0, 'error message should be set');
  });
});

/* ── handlers.confirm_payment() ────────────────────────── */

describe('handlers.confirm_payment()', () => {
  /** Order sitting at pending_payment with a generated document */
  function makePendingOrder() {
    return {
      ...makeOrder('cv', {}, 8),
      statut:     'pending_payment',
      _pipeline:  [
        { status: 'submitted',       ts: '2024-01-01T00:00:00Z' },
        { status: 'processing',      ts: '2024-01-01T00:01:00Z' },
        { status: 'generated',       ts: '2024-01-01T00:02:00Z' },
        { status: 'pending_payment', ts: '2024-01-01T00:03:00Z' }
      ],
      _documents: { final: '<html><body>Doc</body></html>' }
    };
  }

  test('advances pending_payment → paid', async () => {
    const result = await handlers.confirm_payment(makePendingOrder(), {});
    assert.equal(result.ok,           true);
    assert.equal(result.order.statut, 'paid');
  });

  test('records _payment metadata (provider, reference, amount)', async () => {
    const result = await handlers.confirm_payment(makePendingOrder(), {
      provider: 'momo', reference: 'TXN-2024-001', amount: 8
    });
    assert.ok(result.order._payment,                       '_payment must be set');
    assert.equal(result.order._payment.provider,  'momo');
    assert.equal(result.order._payment.reference, 'TXN-2024-001');
    assert.equal(result.order._payment.amount,    8);
    assert.ok(result.order._payment.confirmedAt,           'confirmedAt timestamp must exist');
  });

  test('defaults to provider="manual" when not specified', async () => {
    const result = await handlers.confirm_payment(makePendingOrder(), {});
    assert.equal(result.order._payment.provider, 'manual');
  });

  test('does NOT auto-deliver after payment — stops at paid', async () => {
    const result = await handlers.confirm_payment(makePendingOrder(), {});
    assert.notEqual(result.order.statut, 'delivered',
      'payment must NOT auto-deliver; delivery is a separate admin action');
  });

  test('fails when order is not at pending_payment', async () => {
    const order  = { ...makePendingOrder(), statut: 'submitted' };
    const result = await handlers.confirm_payment(order, {});
    assert.equal(result.ok, false);
    assert.ok(result.error.includes('Transition invalide'));
  });
});

/* ── handlers.deliver() — payment gate (cases 8 & 9) ───── */

describe('handlers.deliver()', () => {
  /** Order that has been fully paid via the pipeline */
  function makePaidOrder() {
    return {
      ...makeOrder('cv', {}, 8),
      statut:   'paid',
      _pipeline: [
        { status: 'submitted',       ts: '2024-01-01T00:00:00Z' },
        { status: 'processing',      ts: '2024-01-01T00:01:00Z' },
        { status: 'generated',       ts: '2024-01-01T00:02:00Z' },
        { status: 'pending_payment', ts: '2024-01-01T00:03:00Z' },
        { status: 'paid',            ts: '2024-01-01T00:04:00Z' }   // ← key entry
      ],
      _payment: { confirmedAt: '2024-01-01T00:04:00Z', provider: 'manual', reference: null, amount: 8 }
    };
  }

  test('case 9a — deliver succeeds when paid entry is in _pipeline', async () => {
    const result = await handlers.deliver(makePaidOrder());
    assert.equal(result.ok,           true);
    assert.equal(result.order.statut, 'delivered');
  });

  // Case 9: delivered only happens after paid
  test('case 9b — deliver blocked when _pipeline has no paid entry', async () => {
    const orderNoPaidTrail = {
      ...makePaidOrder(),
      _pipeline: [
        { status: 'submitted',       ts: '2024-01-01T00:00:00Z' },
        { status: 'pending_payment', ts: '2024-01-01T00:03:00Z' }
        // ← 'paid' entry deliberately missing to simulate tampered/manually-set order
      ]
    };
    const result = await handlers.deliver(orderNoPaidTrail);
    assert.equal(result.ok, false);
    assert.ok(result.error.includes('paiement'),
      'error should mention that payment is required');
  });

  // Case 8: failed status blocks delivery
  test('case 8 — deliver blocked for a failed order', async () => {
    const failedOrder = {
      ...makeOrder('cv'),
      statut:    'failed',
      _pipeline: [
        { status: 'submitted', ts: '2024-01-01T00:00:00Z' },
        { status: 'failed',    ts: '2024-01-01T00:01:00Z', reason: 'API error' }
      ]
    };
    const result = await handlers.deliver(failedOrder);
    assert.equal(result.ok, false,
      'a failed order must never be deliverable');
  });

  test('deliver works from needs_review when payment was already confirmed (post-pay review path)', async () => {
    const postPayReviewOrder = {
      ...makePaidOrder(),
      statut: 'needs_review',
      _pipeline: [
        { status: 'submitted',    ts: '2024-01-01T00:00:00Z' },
        { status: 'paid',         ts: '2024-01-01T00:04:00Z' },  // paid before review
        { status: 'needs_review', ts: '2024-01-01T00:05:00Z' }
      ]
    };
    const result = await handlers.deliver(postPayReviewOrder);
    assert.equal(result.ok,           true);
    assert.equal(result.order.statut, 'delivered');
  });

  test('deliver blocked from needs_review when no payment on record (pre-pay review path)', async () => {
    const prePayReviewOrder = {
      ...makeOrder('sejour'),
      statut: 'needs_review',
      _pipeline: [
        { status: 'submitted',    ts: '2024-01-01T00:00:00Z' },
        { status: 'needs_review', ts: '2024-01-01T00:01:00Z' }
        // ← never went through paid
      ]
    };
    const result = await handlers.deliver(prePayReviewOrder);
    assert.equal(result.ok, false);
  });
});

/* ── handlers.fail() ───────────────────────────────────── */

describe('handlers.fail()', () => {
  test('marks any order as failed with a reason', async () => {
    const result = await handlers.fail(makeOrder('cv'), { reason: 'Test failure' });
    assert.equal(result.ok,               true);
    assert.equal(result.order.statut,     'failed');
    assert.equal(result.order._failReason, 'Test failure');
  });

  test('fail works from any status including delivered (force-write)', async () => {
    const delivered = { ...makeOrder('cv'), statut: 'delivered' };
    const result    = await handlers.fail(delivered, { reason: 'Admin override' });
    assert.equal(result.order.statut, 'failed');
  });

  test('failed entry is appended to _pipeline trail', async () => {
    const result   = await handlers.fail(makeOrder('cv'), { reason: 'Crash' });
    const lastEntry = result.order._pipeline.at(-1);
    assert.equal(lastEntry.status, 'failed');
    assert.equal(lastEntry.reason, 'Crash');
  });
});
