import { DomainError } from './errors';
import type { EuclidStep } from './types';

const isInt = (n: number): boolean => Number.isSafeInteger(n);

function assertInt(n: number, what: string): void {
  if (!isInt(n)) throw new DomainError('NotAnInteger', `${what} must be an integer, got ${String(n)}`);
}

/** Mathematical modulo: the result is always in [0, n-1], even for negative a. */
export function mod(a: number, n: number): number {
  assertInt(a, 'value');
  if (!isInt(n) || n < 1) {
    throw new DomainError('InvalidModulus', `modulus must be a positive integer, got ${String(n)}`);
  }
  return ((a % n) + n) % n;
}

/** Euclid's algorithm. Non-negative result; gcd(0, 0) = 0. */
export function gcd(a: number, b: number): number {
  assertInt(a, 'a');
  assertInt(b, 'b');
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y !== 0) {
    const r = x % y;
    x = y;
    y = r;
  }
  return x;
}

/** Extended Euclid: returns g = gcd(a, b) and Bezout coefficients with a*x + b*y = g (for a, b >= 0). */
export function extendedGcd(a: number, b: number): { g: number; x: number; y: number } {
  assertInt(a, 'a');
  assertInt(b, 'b');
  let [oldR, r] = [a, b];
  let [oldS, s] = [1, 0];
  let [oldT, t] = [0, 1];
  while (r !== 0) {
    const q = Math.trunc(oldR / r);
    [oldR, r] = [r, oldR - q * r];
    [oldS, s] = [s, oldS - q * s];
    [oldT, t] = [t, oldT - q * t];
  }
  return oldR < 0 ? { g: -oldR, x: -oldS, y: -oldT } : { g: oldR, x: oldS, y: oldT };
}

/** The rows of Euclid's algorithm for gcd(a, b), shown in the Math Lab. */
export function euclidSteps(a: number, b: number): EuclidStep[] {
  assertInt(a, 'a');
  assertInt(b, 'b');
  let dividend = Math.max(Math.abs(a), Math.abs(b));
  let divisor = Math.min(Math.abs(a), Math.abs(b));
  const steps: EuclidStep[] = [];
  while (divisor !== 0) {
    const quotient = Math.floor(dividend / divisor);
    const remainder = dividend % divisor;
    steps.push({ dividend, divisor, quotient, remainder });
    dividend = divisor;
    divisor = remainder;
  }
  return steps;
}

/** x with a*x ≡ 1 (mod n). Throws NoModularInverse when gcd(a, n) != 1. */
export function modInverse(a: number, n: number): number {
  const reduced = mod(a, n);
  const { g, x } = extendedGcd(reduced, n);
  if (g !== 1) {
    throw new DomainError('NoModularInverse', `gcd(${reduced}, ${n}) = ${g}, not 1`);
  }
  return mod(x, n);
}

/** Euler's totient: how many k in [1, n] have gcd(k, n) = 1. */
export function totient(n: number): number {
  if (!isInt(n) || n < 1) {
    throw new DomainError('InvalidModulus', `n must be a positive integer, got ${String(n)}`);
  }
  let count = 0;
  for (let k = 1; k <= n; k += 1) if (gcd(k, n) === 1) count += 1;
  return count;
}

/** All solutions x in [0, n-1] of a*x ≡ b (mod n). Empty when gcd(a, n) does not divide b. */
export function solveLinearCongruence(a: number, b: number, n: number): number[] {
  const am = mod(a, n);
  const bm = mod(b, n);
  const g = gcd(am, n);
  if (bm % g !== 0) return [];
  const solutions: number[] = [];
  for (let x = 0; x < n; x += 1) if (mod(am * x, n) === bm) solutions.push(x);
  return solutions;
}
