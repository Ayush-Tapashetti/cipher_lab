import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { ENGLISH_FREQ, ENGLISH_IC, indexOfCoincidence, letterCounts, relativeFrequencies } from '../index';

describe('letterCounts', () => {
  it('AAB gives A=2, B=1 and zeros elsewhere', () => {
    const c = letterCounts('AAB');
    expect(c[0]).toBe(2);
    expect(c[1]).toBe(1);
    expect(c.slice(2).every((n) => n === 0)).toBe(true);
    expect(c).toHaveLength(26);
  });
  it('is case-insensitive and ignores non-letters', () => {
    expect(letterCounts('aA b! 1 é')).toEqual(letterCounts('AAB'));
  });
  it('property: the total equals the number of ASCII letters', () => {
    fc.assert(
      fc.property(fc.string({ unit: 'binary', maxLength: 200 }), (t) => {
        const total = letterCounts(t).reduce((a, b) => a + b, 0);
        return total === [...t].filter((ch) => /[A-Za-z]/.test(ch)).length;
      }),
    );
  });
});

describe('relativeFrequencies', () => {
  it('sums to 1 within 1e-9 when there is text', () => {
    fc.assert(
      fc.property(fc.stringMatching(/^[A-Za-z ]{1,200}$/), (t) => {
        if (letterCounts(t).every((n) => n === 0)) return true;
        const sum = relativeFrequencies(letterCounts(t)).reduce((a, b) => a + b, 0);
        return Math.abs(sum - 1) < 1e-9;
      }),
    );
  });
  it('returns zeros, never NaN, for empty input', () => {
    const f = relativeFrequencies(letterCounts(''));
    expect(f).toHaveLength(26);
    expect(f.every((x) => x === 0)).toBe(true);
  });
});

describe('indexOfCoincidence', () => {
  it('is 1 for a single repeated letter and null below two letters', () => {
    expect(indexOfCoincidence(letterCounts('AAAA'))).toBe(1);
    expect(indexOfCoincidence(letterCounts('A'))).toBeNull();
    expect(indexOfCoincidence(letterCounts(''))).toBeNull();
  });
  it('is 0 when every letter is different', () => {
    expect(indexOfCoincidence(letterCounts('ABCDEFGHIJKLMNOPQRSTUVWXYZ'))).toBe(0);
  });
  it('matches the hand calculation for AAB: 2·1 / (3·2) = 1/3', () => {
    expect(indexOfCoincidence(letterCounts('AAB'))).toBeCloseTo(1 / 3, 12);
  });
});

describe('English reference', () => {
  it('totals exactly 1 and E is the most frequent letter', () => {
    expect(Math.abs(ENGLISH_FREQ.reduce((a, b) => a + b, 0) - 1)).toBeLessThan(1e-12);
    expect(ENGLISH_FREQ.indexOf(Math.max(...ENGLISH_FREQ))).toBe(4);
  });
  it('expected index of coincidence of English is about 0.0655', () => {
    expect(ENGLISH_IC).toBeGreaterThan(0.064);
    expect(ENGLISH_IC).toBeLessThan(0.068);
  });
});
