import { validateKey } from './ciphers';
import { DomainError } from './errors';
import { mod } from './modular';
import type { AffineSolution, Pair } from './types';

function letterNumber(letter: string, which: string): number {
  const code = letter.length === 1 ? letter.toUpperCase().charCodeAt(0) - 65 : -1;
  if (code < 0 || code > 25) {
    throw new DomainError('InvalidParameter', `${which} must be a single letter A-Z, got ${JSON.stringify(letter)}`);
  }
  return code;
}

/**
 * Known-plaintext attack on the affine cipher E(x) = a·x + b (mod 26).
 * Two pairs (x1 → y1), (x2 → y2) give  a·(x1 − x2) ≡ (y1 − y2)  (mod 26),  then  b = y1 − a·x1.
 * If gcd(x1 − x2, 26) > 1 the congruence can have several solutions; all valid keys are returned, ordered by a.
 */
export function solveAffineFromPairs(p1: Pair, p2: Pair): AffineSolution[] {
  const x1 = letterNumber(p1.plain, 'plain letter 1');
  const y1 = letterNumber(p1.cipher, 'cipher letter 1');
  const x2 = letterNumber(p2.plain, 'plain letter 2');
  const y2 = letterNumber(p2.cipher, 'cipher letter 2');
  if (x1 === x2) {
    throw new DomainError('IdenticalPlaintexts', 'the two plaintext letters must differ');
  }
  const solutions: AffineSolution[] = [];
  for (let a = 1; a < 26; a += 1) {
    try {
      validateKey({ cipher: 'affine', a, b: 0 });
    } catch {
      continue; // a is not a unit mod 26, so it cannot be an affine multiplier
    }
    if (mod(a * (x1 - x2), 26) !== mod(y1 - y2, 26)) continue;
    const b = mod(y1 - a * x1, 26);
    if (mod(a * x1 + b, 26) === y1 && mod(a * x2 + b, 26) === y2) solutions.push({ a, b });
  }
  if (solutions.length === 0) {
    throw new DomainError(
      'NoSolution',
      'no valid affine key maps both plaintext letters to the given ciphertext letters',
    );
  }
  return solutions;
}
