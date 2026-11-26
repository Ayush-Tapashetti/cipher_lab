import { describe, expect, it } from 'vitest';
import {
  DomainError,
  cayleyTable,
  elementOrder,
  generators,
  gcd,
  keySpaceSize,
  mod,
  modInverse,
  orbit,
  unitsModN,
} from '../index';

const codeOf = (fn: () => unknown): string | null => {
  try {
    fn();
    return null;
  } catch (e) {
    return e instanceof DomainError ? e.code : 'NOT_A_DOMAIN_ERROR';
  }
};

describe('keySpaceSize', () => {
  it('is 26, 312 and exactly 26!', () => {
    expect(keySpaceSize('caesar')).toBe(26n);
    expect(keySpaceSize('affine')).toBe(312n);
    expect(keySpaceSize('substitution')).toBe(403291461126605635584000000n);
  });
});

describe('units of Z26', () => {
  const units = [1, 3, 5, 7, 9, 11, 15, 17, 19, 21, 23, 25];
  it('are the 12 numbers coprime to 26', () => {
    expect(unitsModN(26)).toEqual(units);
  });
  it('are closed under multiplication and every unit has an inverse in the set', () => {
    for (const a of units) {
      expect(units).toContain(modInverse(a, 26));
      for (const b of units) expect(units).toContain(mod(a * b, 26));
    }
  });
  it('rejects moduli below 2', () => {
    expect(codeOf(() => unitsModN(1))).toBe('InvalidModulus');
  });
});

describe('orders and generators', () => {
  it('additive order of a in Z26 is 26 / gcd(a, 26)', () => {
    for (let a = 0; a < 26; a += 1) expect(elementOrder(a, 26, 'add')).toBe(26 / gcd(a, 26));
  });
  it('additive generators of Z26 are exactly the units', () => {
    expect(generators(26, 'add')).toEqual(unitsModN(26));
  });
  it('multiplicative orders divide 12 (Lagrange) and the group is cyclic with 4 generators', () => {
    for (const u of unitsModN(26)) expect(12 % elementOrder(u, 26, 'mul')).toBe(0);
    expect(generators(26, 'mul')).toEqual([7, 11, 15, 19]);
  });
  it('multiplicative order of a non-unit is a NotAUnit error', () => {
    expect(codeOf(() => elementOrder(13, 26, 'mul'))).toBe('NotAUnit');
    expect(codeOf(() => elementOrder(2, 26, 'mul'))).toBe('NotAUnit');
  });
  it('orbit lists the powers until the identity', () => {
    expect(orbit(5, 26, 'add')).toEqual([
      5, 10, 15, 20, 25, 4, 9, 14, 19, 24, 3, 8, 13, 18, 23, 2, 7, 12, 17, 22, 1, 6, 11, 16, 21, 0,
    ]);
    expect(orbit(5, 26, 'mul')).toEqual([5, 25, 21, 1]);
    expect(orbit(13, 26, 'add')).toEqual([13, 0]);
  });
});

describe('cayleyTable', () => {
  it('addition table of Z5 is a Latin square starting 0 1 2 3 4', () => {
    const t = cayleyTable([0, 1, 2, 3, 4], 5, 'add');
    expect(t[0]).toEqual([0, 1, 2, 3, 4]);
    expect(t[4]).toEqual([4, 0, 1, 2, 3]);
    for (const row of t) expect(new Set(row).size).toBe(5);
  });
  it('the multiplication table of the 12 units has every unit once per row', () => {
    const u = unitsModN(26);
    for (const row of cayleyTable(u, 26, 'mul')) expect([...row].sort((x, y) => x - y)).toEqual(u);
  });
});
