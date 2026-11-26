import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { DomainError, euclidSteps, extendedGcd, gcd, mod, modInverse, solveLinearCongruence, totient } from '../index';

const codeOf = (fn: () => unknown): string | null => {
  try {
    fn();
    return null;
  } catch (e) {
    return e instanceof DomainError ? e.code : 'NOT_A_DOMAIN_ERROR';
  }
};

describe('mod', () => {
  it('is always in [0, n-1], including for negatives', () => {
    expect(mod(-1, 26)).toBe(25);
    expect(mod(-26, 26)).toBe(0);
    expect(mod(27, 26)).toBe(1);
    expect(mod(0, 26)).toBe(0);
  });
  it('rejects a bad modulus and non-integers with named errors', () => {
    expect(codeOf(() => mod(5, 0))).toBe('InvalidModulus');
    expect(codeOf(() => mod(5, -3))).toBe('InvalidModulus');
    expect(codeOf(() => mod(1.5, 26))).toBe('NotAnInteger');
  });
  it('property: result in range and congruent to the input', () => {
    fc.assert(
      fc.property(fc.integer({ min: -1_000_000, max: 1_000_000 }), fc.integer({ min: 1, max: 500 }), (a, n) => {
        const r = mod(a, n);
        return r >= 0 && r < n && (a - r) % n === 0;
      }),
    );
  });
});

describe('gcd and extended gcd', () => {
  it('known values', () => {
    expect(gcd(26, 13)).toBe(13);
    expect(gcd(26, 5)).toBe(1);
    expect(gcd(0, 0)).toBe(0);
    expect(gcd(-12, 18)).toBe(6);
  });
  it('property: Bezout identity a·x + b·y = g', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 10_000 }), fc.integer({ min: 0, max: 10_000 }), (a, b) => {
        const { g, x, y } = extendedGcd(a, b);
        return g === gcd(a, b) && a * x + b * y === g;
      }),
    );
  });
  it('euclidSteps ends with the gcd as the last non-zero remainder chain', () => {
    const steps = euclidSteps(26, 5);
    expect(steps).toEqual([
      { dividend: 26, divisor: 5, quotient: 5, remainder: 1 },
      { dividend: 5, divisor: 1, quotient: 5, remainder: 0 },
    ]);
    expect(euclidSteps(0, 0)).toEqual([]);
  });
});

describe('modInverse', () => {
  it('5 · 21 ≡ 1 (mod 26)', () => {
    expect(modInverse(5, 26)).toBe(21);
    expect(modInverse(21, 26)).toBe(5);
  });
  it('throws NoModularInverse when gcd(a, n) != 1', () => {
    expect(codeOf(() => modInverse(13, 26))).toBe('NoModularInverse');
    expect(codeOf(() => modInverse(2, 26))).toBe('NoModularInverse');
    expect(codeOf(() => modInverse(0, 26))).toBe('NoModularInverse');
  });
  it('property: a · a⁻¹ ≡ 1 whenever the inverse exists', () => {
    fc.assert(
      fc.property(fc.integer({ min: -500, max: 500 }), fc.integer({ min: 2, max: 200 }), (a, n) => {
        if (gcd(mod(a, n), n) !== 1) return codeOf(() => modInverse(a, n)) === 'NoModularInverse';
        return mod(mod(a, n) * modInverse(a, n), n) === 1;
      }),
    );
  });
});

describe('totient and linear congruences', () => {
  it('φ(26) = 12, φ(1) = 1', () => {
    expect(totient(26)).toBe(12);
    expect(totient(1)).toBe(1);
  });
  it('solves a·x ≡ b (mod n), all solutions', () => {
    expect(solveLinearCongruence(5, 1, 26)).toEqual([21]);
    expect(solveLinearCongruence(13, 13, 26)).toHaveLength(13); // every odd x
    expect(solveLinearCongruence(13, 1, 26)).toEqual([]); // 13 does not divide 1
  });
});
