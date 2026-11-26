import { DomainError } from './errors';
import { gcd, mod, totient } from './modular';
import type { CipherType, GroupOp } from './types';

function assertModulus(n: number): void {
  if (!Number.isSafeInteger(n) || n < 2) {
    throw new DomainError('InvalidModulus', `n must be an integer of at least 2, got ${String(n)}`);
  }
}

/** Units of Z_n: the a in [1, n-1] with gcd(a, n) = 1. For n = 26 these are the 12 valid affine multipliers. */
export function unitsModN(n: number): number[] {
  assertModulus(n);
  const units: number[] = [];
  for (let a = 1; a < n; a += 1) if (gcd(a, n) === 1) units.push(a);
  return units;
}

function factorial(k: number): bigint {
  let result = 1n;
  for (let i = 2; i <= k; i += 1) result *= BigInt(i);
  return result;
}

/** 26 Caesar keys, 12 · 26 = 312 affine keys, 26! substitution keys. Exact (bigint), never floating point. */
export function keySpaceSize(cipher: CipherType): bigint {
  switch (cipher) {
    case 'caesar':
      return 26n;
    case 'affine':
      return BigInt(totient(26)) * 26n;
    case 'substitution':
      return factorial(26);
    default:
      throw new DomainError('InvalidParameter', 'unknown cipher type');
  }
}

/** The powers of `a` in Z_n: a, 2a, 3a, ... until 0 (add), or a, a², a³, ... until 1 (mul). Includes the identity at the end. */
export function orbit(a: number, n: number, op: GroupOp): number[] {
  assertModulus(n);
  const start = mod(a, n);
  if (op === 'mul' && gcd(start, n) !== 1) {
    throw new DomainError('NotAUnit', `${start} is not a unit mod ${n} (gcd = ${gcd(start, n)})`);
  }
  const identity = op === 'add' ? 0 : 1;
  const seq: number[] = [];
  let current = start;
  for (;;) {
    seq.push(current);
    if (current === identity) return seq;
    current = op === 'add' ? mod(current + start, n) : mod(current * start, n);
  }
}

/** Order of a in (Z_n, +) or in the group of units (Z_n*, ×). Throws NotAUnit for mul with a non-unit. */
export function elementOrder(a: number, n: number, op: GroupOp): number {
  return orbit(a, n, op).length;
}

/** Elements whose order equals the size of the group: additive generators of Z_n are exactly the units. */
export function generators(n: number, op: GroupOp): number[] {
  assertModulus(n);
  if (op === 'add') {
    const gens: number[] = [];
    for (let a = 1; a < n; a += 1) if (elementOrder(a, n, 'add') === n) gens.push(a);
    return gens;
  }
  const units = unitsModN(n);
  return units.filter((u) => elementOrder(u, n, 'mul') === units.length);
}

/** Row i, column j = elements[i] op elements[j] mod n. For the Math Lab group table. */
export function cayleyTable(elements: readonly number[], n: number, op: GroupOp): number[][] {
  assertModulus(n);
  return elements.map((x) => elements.map((y) => (op === 'add' ? mod(x + y, n) : mod(x * y, n))));
}
