/**
 * Eval v1: does the frequency attack recover a known key?
 * Dataset: fixed (passage, cipher, key) triples drawn from the bundled corpus. Everything is deterministic and local.
 * GATED cases use 120 letters (well above the unicity distance); SHORT cases use 12 letters and are only reported,
 * because short ciphertext is expected to fail, and the app must say so with low confidence instead.
 * Writes reports/eval-report.json. Fails below THRESHOLD.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { expect, test } from 'vitest';
import {
  SAMPLE_CORPUS,
  breakConfidence,
  encrypt,
  rankAffineCandidates,
  rankCaesarCandidates,
  totalLetters,
  letterCounts,
  validateKey,
} from '../src';
import type { BreakableCipher, KeySpec } from '../src';

const THRESHOLD = 0.95;
const KEYS: ReadonlyArray<{ cipher: BreakableCipher; spec: KeySpec }> = [
  { cipher: 'caesar', spec: { cipher: 'caesar', shift: 1 } },
  { cipher: 'caesar', spec: { cipher: 'caesar', shift: 7 } },
  { cipher: 'caesar', spec: { cipher: 'caesar', shift: 13 } },
  { cipher: 'caesar', spec: { cipher: 'caesar', shift: 25 } },
  { cipher: 'affine', spec: { cipher: 'affine', a: 5, b: 8 } },
  { cipher: 'affine', spec: { cipher: 'affine', a: 9, b: 3 } },
  { cipher: 'affine', spec: { cipher: 'affine', a: 25, b: 25 } },
  { cipher: 'affine', spec: { cipher: 'affine', a: 3, b: 0 } },
];

interface Row {
  id: string;
  set: 'gated' | 'short';
  passed: boolean;
  confidence: string;
  ms: number;
}

function runSet(set: 'gated' | 'short', length: number): Row[] {
  const rows: Row[] = [];
  SAMPLE_CORPUS.forEach((passage, p) => {
    const letters = passage.replace(/[^A-Za-z]/g, '').toUpperCase();
    for (const { cipher, spec } of KEYS) {
      const start = Math.min(p * 7, letters.length - length);
      const key = validateKey(spec);
      const cipherText = encrypt(letters.slice(start, start + length), key);
      const t0 = performance.now();
      const ranked = cipher === 'caesar' ? rankCaesarCandidates(cipherText) : rankAffineCandidates(cipherText);
      const ms = performance.now() - t0;
      const top = ranked[0];
      const second = ranked[1];
      const passed = top !== undefined && sameKey(top.key, key);
      const confidence =
        top && second
          ? breakConfidence(totalLetters(letterCounts(cipherText)), top.chiSquared, second.chiSquared)
          : 'low';
      rows.push({ id: `${set}/p${p}/${JSON.stringify(spec)}`, set, passed, confidence, ms });
    }
  });
  return rows;
}

// Compare keys by their defining numbers only (the validated object also carries a derived inverse).
function sameKey(x: ReturnType<typeof validateKey>, y: ReturnType<typeof validateKey>): boolean {
  if (x.cipher === 'caesar' && y.cipher === 'caesar') return x.shift === y.shift;
  if (x.cipher === 'affine' && y.cipher === 'affine') return x.a === y.a && x.b === y.b;
  return false;
}

test('frequency attack recovers the true key (eval v1)', () => {
  const gated = runSet('gated', 120);
  const short = runSet('short', 12);
  const score = gated.filter((r) => r.passed).length / gated.length;
  const shortScore = short.filter((r) => r.passed).length / short.length;
  const shortLowConfidence = short.filter((r) => !r.passed && r.confidence === 'low').length;
  const shortFailures = short.filter((r) => !r.passed).length;
  const avgMs = gated.reduce((t, r) => t + r.ms, 0) / gated.length;

  for (const r of gated)
    console.log(`${r.passed ? 'PASS' : 'FAIL'} ${r.id} confidence=${r.confidence} ${r.ms.toFixed(1)}ms`);
  console.log(
    `eval v1: score=${score.toFixed(3)} (${gated.length} cases, threshold ${THRESHOLD}) short-text recovery=${shortScore.toFixed(3)}, ` +
      `short failures flagged low-confidence ${shortLowConfidence}/${shortFailures}, mean break time ${avgMs.toFixed(1)}ms, fallback rate n/a (no model)`,
  );

  mkdirSync('../../reports', { recursive: true });
  writeFileSync(
    '../../reports/eval-report.json',
    JSON.stringify(
      {
        eval: 'break v1',
        threshold: THRESHOLD,
        score,
        cases: gated.length,
        shortTextRecovery: shortScore,
        shortFailuresFlaggedLowConfidence: `${shortLowConfidence}/${shortFailures}`,
        meanBreakMs: avgMs,
        fallbackRate: null,
        networked: false,
        rows: [...gated, ...short],
      },
      null,
      2,
    ),
  );

  expect(score).toBeGreaterThanOrEqual(THRESHOLD);
  // Wrong answers on short text must never be presented confidently.
  expect(shortLowConfidence).toBe(shortFailures);
});
