/**
 * tests/documents.test.js
 * Unit tests for lib/documents.js — access control, watermark, getDocument()
 *
 * No mocks needed — all functions are pure string/set operations.
 * Covers test cases 5, 6, 7 from the specification.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  PREVIEW_STATUSES, FINAL_STATUSES,
  canAccessPreview, canAccessFinal,
  addWatermark, removeWatermark,
  getDocument
} from '../lib/documents.js';

const WATERMARK_ID = 'dok-preview-watermark';
const SAMPLE_HTML  = '<!DOCTYPE html><html><head></head><body><p>Test document</p></body></html>';

/* ── Access control sets ── */

describe('PREVIEW_STATUSES and FINAL_STATUSES sets', () => {
  test('preview is available at: generated, pending_payment, paid, needs_review, delivered', () => {
    const expected = ['generated', 'pending_payment', 'paid', 'needs_review', 'delivered'];
    for (const s of expected) {
      assert.ok(PREVIEW_STATUSES.has(s), `expected PREVIEW_STATUSES to include '${s}'`);
    }
  });

  test('preview is NOT available at: submitted, processing, failed', () => {
    for (const s of ['submitted', 'processing', 'failed']) {
      assert.ok(!PREVIEW_STATUSES.has(s), `expected PREVIEW_STATUSES to exclude '${s}'`);
    }
  });

  test('final is available at: paid, needs_review, delivered', () => {
    const expected = ['paid', 'needs_review', 'delivered'];
    for (const s of expected) {
      assert.ok(FINAL_STATUSES.has(s), `expected FINAL_STATUSES to include '${s}'`);
    }
  });

  test('final is NOT available at: generated, pending_payment', () => {
    for (const s of ['generated', 'pending_payment', 'submitted', 'failed']) {
      assert.ok(!FINAL_STATUSES.has(s), `expected FINAL_STATUSES to exclude '${s}'`);
    }
  });
});

/* ── canAccessPreview() / canAccessFinal() ── */

describe('canAccessPreview()', () => {
  test('returns false for submitted and processing', () => {
    assert.equal(canAccessPreview('submitted'),  false);
    assert.equal(canAccessPreview('processing'), false);
    assert.equal(canAccessPreview('failed'),     false);
  });

  // Case 5: preview available before payment
  test('case 5 — returns true at pending_payment (before payment confirmed)', () => {
    assert.equal(canAccessPreview('pending_payment'), true);
  });

  test('returns true at every post-generation status', () => {
    for (const s of ['generated', 'pending_payment', 'paid', 'needs_review', 'delivered']) {
      assert.equal(canAccessPreview(s), true, `expected preview at '${s}'`);
    }
  });

  test('accepts a full order object, not just a string', () => {
    assert.equal(canAccessPreview({ statut: 'pending_payment' }), true);
    assert.equal(canAccessPreview({ statut: 'submitted' }),        false);
  });
});

describe('canAccessFinal()', () => {
  // Case 6: final blocked before payment
  test('case 6 — returns false at pending_payment (payment not yet confirmed)', () => {
    assert.equal(canAccessFinal('pending_payment'), false);
  });

  test('returns false at generated', () => {
    assert.equal(canAccessFinal('generated'), false);
  });

  // Case 7: final available after payment
  test('case 7 — returns true at paid', () => {
    assert.equal(canAccessFinal('paid'), true);
  });

  test('returns true at needs_review and delivered', () => {
    assert.equal(canAccessFinal('needs_review'), true);
    assert.equal(canAccessFinal('delivered'),    true);
  });
});

/* ── addWatermark() / removeWatermark() ── */

describe('addWatermark()', () => {
  test('injects the watermark element before </body>', () => {
    const result = addWatermark(SAMPLE_HTML);
    assert.ok(result.includes(WATERMARK_ID),
      'watermark id should appear in result');
    assert.ok(result.indexOf(WATERMARK_ID) < result.indexOf('</body>'),
      'watermark should be before </body>');
  });

  test('preview HTML contains watermark; original does not', () => {
    assert.ok(!SAMPLE_HTML.includes(WATERMARK_ID),
      'original HTML must not have watermark');
    assert.ok(addWatermark(SAMPLE_HTML).includes(WATERMARK_ID),
      'watermarked copy must have watermark');
  });

  test('appends watermark when no </body> tag present', () => {
    const result = addWatermark('<p>Minimal</p>');
    assert.ok(result.includes(WATERMARK_ID));
  });

  test('handles null/undefined gracefully', () => {
    assert.equal(addWatermark(null),      null);
    assert.equal(addWatermark(undefined), undefined);
  });
});

describe('removeWatermark()', () => {
  test('removes the watermark element added by addWatermark()', () => {
    const withWm    = addWatermark(SAMPLE_HTML);
    const cleaned   = removeWatermark(withWm);
    assert.ok(!cleaned.includes(WATERMARK_ID), 'watermark should be removed');
    assert.ok(cleaned.includes('<p>Test document</p>'), 'original content preserved');
  });

  test('is a no-op on HTML that has no watermark', () => {
    const result = removeWatermark(SAMPLE_HTML);
    assert.equal(result, SAMPLE_HTML);
  });
});

/* ── getDocument() ── */

describe('getDocument()', () => {
  function orderAt(statut) {
    return { statut, _documents: { final: SAMPLE_HTML } };
  }

  // Case 5: preview available before payment
  test('case 5 — preview returned at pending_payment with watermark', () => {
    const result = getDocument(orderAt('pending_payment'), 'preview');
    assert.equal(result.ok,   true);
    assert.equal(result.type, 'preview');
    assert.ok(result.html.includes(WATERMARK_ID), 'preview must contain watermark');
    assert.ok(result.html.includes('<p>Test document</p>'), 'original content preserved');
  });

  // Case 6: final blocked before payment
  test('case 6 — final blocked at pending_payment', () => {
    const result = getDocument(orderAt('pending_payment'), 'final');
    assert.equal(result.ok, false);
    assert.ok(result.error.includes('paiement'),
      'error message should mention payment');
    assert.equal(result.html, undefined, 'no HTML should be returned');
  });

  test('case 6 — final also blocked at generated', () => {
    const result = getDocument(orderAt('generated'), 'final');
    assert.equal(result.ok, false);
  });

  // Case 7: final available after payment
  test('case 7 — final returned at paid without watermark', () => {
    const result = getDocument(orderAt('paid'), 'final');
    assert.equal(result.ok,   true);
    assert.equal(result.type, 'final');
    assert.ok(!result.html.includes(WATERMARK_ID), 'final must NOT contain watermark');
    assert.equal(result.html, SAMPLE_HTML, 'final html must be the clean original');
  });

  test('both preview and final available at delivered', () => {
    assert.equal(getDocument(orderAt('delivered'), 'preview').ok, true);
    assert.equal(getDocument(orderAt('delivered'), 'final').ok,   true);
  });

  test('error when _documents.final is missing', () => {
    const order  = { statut: 'paid', _documents: {} };
    const result = getDocument(order, 'final');
    assert.equal(result.ok, false);
    assert.ok(result.error.length > 0);
  });

  test('error when order is null', () => {
    const result = getDocument(null, 'preview');
    assert.equal(result.ok, false);
  });

  test('error for unknown document type', () => {
    const result = getDocument(orderAt('paid'), 'raw');
    assert.equal(result.ok, false);
    assert.ok(result.error.includes('inconnu'));
  });

  test('preview at submitted is blocked', () => {
    const result = getDocument(orderAt('submitted'), 'preview');
    assert.equal(result.ok, false);
  });
});
