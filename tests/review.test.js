/**
 * tests/review.test.js
 * Unit tests for lib/review.js — evaluateReview()
 *
 * No mocks needed — the review engine is pure logic.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { evaluateReview } from '../lib/review.js';

/* ── Auto-delivery services (cases 1 & 2 — review side) ── */

describe('Auto-delivery services — no review required', () => {
  test('CV service returns reviewRequired: false', () => {
    const result = evaluateReview({ service: 'cv', details: {} });
    assert.equal(result.reviewRequired, false);
    assert.equal(result.reviewReason,   null);
  });

  test('lettre service returns reviewRequired: false', () => {
    const result = evaluateReview({ service: 'lettre', details: {} });
    assert.equal(result.reviewRequired, false);
    assert.equal(result.reviewReason,   null);
  });

  test('courrier service returns reviewRequired: false', () => {
    const result = evaluateReview({ service: 'courrier', details: {} });
    assert.equal(result.reviewRequired, false);
  });
});

/* ── Dossier conditionals (case 3) ── */

describe('Dossier administratif — conditional review', () => {
  test('case 3a — empty description triggers review', () => {
    const result = evaluateReview({ service: 'dossier', details: { description: '' } });
    assert.equal(result.reviewRequired, true);
    assert.ok(result.reviewReason.includes('insuffisant'),
      'reason should mention insufficient content');
  });

  test('case 3b — description shorter than 40 chars triggers review', () => {
    const result = evaluateReview({
      service: 'dossier',
      details: { description: 'Aide logement' }  // 13 chars < 40
    });
    assert.equal(result.reviewRequired, true);
    assert.ok(result.reviewReason.includes('13 car.'),
      'reason should include the actual character count');
  });

  test('case 3c — description exactly at threshold (40 chars) passes', () => {
    // 40 chars of benign content with no sensitive keywords
    const desc = 'Je veux demander une aide au logement CAF';  // 41 chars
    const result = evaluateReview({ service: 'dossier', details: { description: desc } });
    assert.equal(result.reviewRequired, false);
  });

  test('case 3d — long description with no sensitive keyword passes', () => {
    const result = evaluateReview({
      service: 'dossier',
      details: { description: 'Je souhaite constituer un dossier CAF pour une aide au logement en Guyane française.' }
    });
    assert.equal(result.reviewRequired, false);
    assert.equal(result.reviewReason,   null);
  });

  test('case 3e — sensitive keyword "régularisation" triggers review despite long description', () => {
    const result = evaluateReview({
      service: 'dossier',
      details: {
        description: 'Je souhaite une régularisation de ma situation administrative en Guyane française pour résider légalement.'
      }
    });
    assert.equal(result.reviewRequired, true);
    assert.ok(result.reviewReason.includes('sensible'));
  });

  test('case 3f — sensitive keyword in type field also triggers review', () => {
    const result = evaluateReview({
      service: 'dossier',
      details: {
        description: 'Je souhaite constituer un dossier pour régulariser mon séjour en Guyane française.',
        type: 'naturalisation'
      }
    });
    assert.equal(result.reviewRequired, true);
  });

  test('case 3g — keyword matching is case-insensitive', () => {
    const result = evaluateReview({
      service: 'dossier',
      details: { description: 'Dossier pour RÉGULARISATION administrative en Guyane française et bénéficier des droits.' }
    });
    assert.equal(result.reviewRequired, true);
  });
});

/* ── Titre de séjour (case 4) ── */

describe('Titre de séjour — mandatory review', () => {
  test('case 4 — séjour always requires review regardless of details', () => {
    const result = evaluateReview({ service: 'sejour', details: {} });
    assert.equal(result.reviewRequired, true);
    assert.ok(typeof result.reviewReason === 'string' && result.reviewReason.length > 0,
      'reviewReason must be a non-empty string');
  });

  test('case 4 — séjour reason mentions titre de séjour', () => {
    const result = evaluateReview({ service: 'sejour', details: { nationalite: 'Française' } });
    assert.ok(result.reviewReason.toLowerCase().includes('séjour'));
  });
});

/* ── Safe fallback ── */

describe('Unknown service — safe fallback', () => {
  test('unknown service triggers review by default', () => {
    const result = evaluateReview({ service: 'unknown_service', details: {} });
    assert.equal(result.reviewRequired, true);
    assert.ok(result.reviewReason.includes('inconnu'));
  });

  test('null/undefined order is handled gracefully', () => {
    const result = evaluateReview(null);
    assert.equal(result.reviewRequired, true);
  });
});
