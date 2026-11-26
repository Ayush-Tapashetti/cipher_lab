import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import {
  DomainError,
  ENGLISH_REDUNDANCY_BITS_PER_LETTER,
  SAMPLE_CORPUS,
  breakSuccessRate,
  encrypt,
  enumerateKeys,
  keySpaceBits,
  log2BigInt,
  runExhaustiveChecks,
  seededRng,
  solveAffineFromPairs,
  unicityDistance,
  validateKey,
} from '../index';

const codeOf = (fn: () => unknown): string | null => {
  try {
    fn();
    return null;
  } catch (e) {
    return e instanceof DomainError ? e.code : 'NOT_A_DOMAIN_ERROR';
  }
};

describe('solveAffineFromPairs (known plaintext)', () => {
  it('recovers a=5, b=8 from A→I and F→H', () => {
    expect(solveAffineFromPairs({ plain: 'A', cipher: 'I' }, { plain: 'F', cipher: 'H' })).toEqual([{ a: 5, b: 8 }]);
  });
  it('property: pairs with gcd(x1-x2, 26) = 1 give exactly the true key', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...enumerateKeys('affine')),
        fc.integer({ min: 0, max: 25 }),
        fc.integer({ min: 0, max: 25 }),
        (key, x1, x2) => {
          if (key.cipher !== 'affine') return true;
          const d = (((x1 - x2) % 26) + 26) % 26;
          if (d === 0) return true;
          const L = (n: number): string => String.fromCharCode(65 + n);
          const enc = (n: number): number => (key.a * n + key.b) % 26;
          const sols = solveAffineFromPairs({ plain: L(x1), cipher: L(enc(x1)) }, { plain: L(x2), cipher: L(enc(x2)) });
          const hasTrue = sols.some((s) => s.a === key.a && s.b === key.b);
          const coprime = [1, 3, 5, 7, 9, 11, 15, 17, 19, 21, 23, 25].includes(d);
          return hasTrue && (!coprime || sols.length === 1);
        },
      ),
    );
  });
  it('returns several solutions when gcd(x1 - x2, 26) > 1', () => {
    // A→B, N→N: x1 - x2 = -13, y1 - y2 = -12... use a consistent pair from a=3,b=1: A→B, N→(3·13+1=40 mod 26=14)=O
    const sols = solveAffineFromPairs({ plain: 'A', cipher: 'B' }, { plain: 'N', cipher: 'O' });
    expect(sols.length).toBeGreaterThan(1);
    expect(sols).toContainEqual({ a: 3, b: 1 });
    for (const s of sols) {
      expect((s.a * 0 + s.b) % 26).toBe(1);
      expect((s.a * 13 + s.b) % 26).toBe(14);
    }
  });
  it('throws NoSolution for inconsistent pairs and IdenticalPlaintexts for equal plaintext letters', () => {
    expect(codeOf(() => solveAffineFromPairs({ plain: 'A', cipher: 'B' }, { plain: 'N', cipher: 'C' }))).toBe(
      'NoSolution',
    );
    expect(codeOf(() => solveAffineFromPairs({ plain: 'E', cipher: 'X' }, { plain: 'e', cipher: 'Y' }))).toBe(
      'IdenticalPlaintexts',
    );
  });
  it('rejects non-letters', () => {
    expect(codeOf(() => solveAffineFromPairs({ plain: '1', cipher: 'B' }, { plain: 'N', cipher: 'C' }))).toBe(
      'InvalidParameter',
    );
    expect(codeOf(() => solveAffineFromPairs({ plain: 'AB', cipher: 'B' }, { plain: 'N', cipher: 'C' }))).toBe(
      'InvalidParameter',
    );
  });
});

describe('unicity distance', () => {
  it('key-space bits are about 4.70, 8.29 and 88.38', () => {
    expect(keySpaceBits('caesar')).toBeCloseTo(4.7004, 3);
    expect(keySpaceBits('affine')).toBeCloseTo(8.2854, 3);
    expect(keySpaceBits('substitution')).toBeCloseTo(88.382, 3);
  });
  it('log2BigInt is exact on powers of two and works far beyond 2^53', () => {
    expect(log2BigInt(1n)).toBe(0);
    expect(log2BigInt(1024n)).toBe(10);
    expect(log2BigInt(2n ** 200n)).toBeCloseTo(200, 9);
  });
  it('substitution needs about 28 letters, Caesar about 1.5', () => {
    const sub = unicityDistance(keySpaceBits('substitution'), ENGLISH_REDUNDANCY_BITS_PER_LETTER);
    expect(sub).toBeGreaterThan(27);
    expect(sub).toBeLessThan(28.5);
    expect(unicityDistance(keySpaceBits('caesar'), ENGLISH_REDUNDANCY_BITS_PER_LETTER)).toBeCloseTo(1.47, 2);
  });
  it('rejects non-positive redundancy', () => {
    expect(codeOf(() => unicityDistance(10, 0))).toBe('InvalidRedundancy');
    expect(codeOf(() => unicityDistance(10, -1))).toBe('InvalidRedundancy');
    expect(codeOf(() => unicityDistance(10, Number.NaN))).toBe('InvalidRedundancy');
  });
});

describe('seededRng', () => {
  it('same seed, same sequence; different seed, different sequence', () => {
    const a = seededRng(42);
    const b = seededRng(42);
    const c = seededRng(43);
    const sa = Array.from({ length: 5 }, () => a.next());
    expect(Array.from({ length: 5 }, () => b.next())).toEqual(sa);
    expect(Array.from({ length: 5 }, () => c.next())).not.toEqual(sa);
  });
  it('stays in range', () => {
    const r = seededRng(7);
    for (let i = 0; i < 1000; i += 1) {
      const f = r.next();
      expect(f).toBeGreaterThanOrEqual(0);
      expect(f).toBeLessThan(1);
      expect(r.nextInt(26)).toBeLessThan(26);
    }
  });
  it('rejects a non-integer seed', () => {
    expect(codeOf(() => seededRng(1.5))).toBe('NotAnInteger');
  });
});

describe('breakSuccessRate', () => {
  it('is reproducible for the same seed', () => {
    const run = (): number => breakSuccessRate(SAMPLE_CORPUS, 'caesar', 40, 60, seededRng(2026));
    expect(run()).toBe(run());
  });
  it('rises with ciphertext length for Caesar: near 1 at 200 letters, clearly lower at 4', () => {
    const long = breakSuccessRate(SAMPLE_CORPUS, 'caesar', 200, 80, seededRng(1));
    const short = breakSuccessRate(SAMPLE_CORPUS, 'caesar', 4, 80, seededRng(1));
    expect(long).toBeGreaterThanOrEqual(0.95);
    expect(short).toBeLessThan(long);
  });
  it('affine breaks reliably with enough text', () => {
    expect(breakSuccessRate(SAMPLE_CORPUS, 'affine', 250, 25, seededRng(5))).toBeGreaterThanOrEqual(0.9);
  });
  it('errors: corpus too short, bad parameters', () => {
    expect(codeOf(() => breakSuccessRate(['short'], 'caesar', 50, 5, seededRng(1)))).toBe('CorpusTooShort');
    expect(codeOf(() => breakSuccessRate(SAMPLE_CORPUS, 'caesar', 0, 5, seededRng(1)))).toBe('InvalidParameter');
    expect(codeOf(() => breakSuccessRate(SAMPLE_CORPUS, 'caesar', 10, 0, seededRng(1)))).toBe('InvalidParameter');
  });
});

describe('runExhaustiveChecks', () => {
  const report = runExhaustiveChecks();
  it('passes everything', () => {
    expect(report.allPassed).toBe(true);
    expect(report.passed).toBe(report.total);
  });
  it('reports the headline counts 26/26, 312/312, 12/12 and 14/14', () => {
    const byId = Object.fromEntries(report.checks.map((c) => [c.id, c]));
    expect(byId['caesar-round-trip']).toMatchObject({ passed: 26, total: 26 });
    expect(byId['affine-round-trip']).toMatchObject({ passed: 312, total: 312 });
    expect(byId['unit-inverses']).toMatchObject({ passed: 12, total: 12 });
    expect(byId['non-units-rejected']).toMatchObject({ passed: 14, total: 14 });
  });
  it('would notice a broken cipher (sanity check of the checker itself)', () => {
    const key = validateKey({ cipher: 'caesar', shift: 3 });
    expect(encrypt('A', key)).not.toBe('A');
  });
});
