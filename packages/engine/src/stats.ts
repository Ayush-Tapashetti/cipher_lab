import { scoreKeys } from './breaker';
import { decrypt, encrypt, enumerateKeys, invertSubstitution, validateKey } from './ciphers';
import { DomainError } from './errors';
import { gcd, mod, modInverse } from './modular';
import { keySpaceSize, unitsModN } from './algebra';
import type { BreakableCipher, CheckReport, CheckResult, CipherType, KeySpec, Rng, ValidBreakableKey } from './types';

/**
 * Approximate redundancy of English in bits per letter: log2(26) ≈ 4.70 minus an entropy rate of about 1.5 bits
 * per letter (Shannon's estimates). It is an estimate, which is why the UI labels unicity distances "about".
 */
export const ENGLISH_REDUNDANCY_BITS_PER_LETTER = 3.2;

/** log2 of a positive bigint, accurate to double precision even for values far beyond 2^53. */
export function log2BigInt(n: bigint): number {
  if (n <= 0n) throw new DomainError('InvalidParameter', 'log2 needs a positive value');
  const bits = n.toString(2).length;
  if (bits <= 53) return Math.log2(Number(n));
  const shift = bits - 53;
  return Math.log2(Number(n >> BigInt(shift))) + shift;
}

/** log2 of the key-space size: about 4.70, 8.29 and 88.38 bits for Caesar, affine and substitution. */
export function keySpaceBits(cipher: CipherType): number {
  return log2BigInt(keySpaceSize(cipher));
}

/** U = H(K) / D: roughly how many ciphertext letters pin down a single key. */
export function unicityDistance(keySpaceBitsValue: number, redundancyBitsPerLetter: number): number {
  if (!Number.isFinite(redundancyBitsPerLetter) || redundancyBitsPerLetter <= 0) {
    throw new DomainError(
      'InvalidRedundancy',
      `redundancy must be a positive number, got ${String(redundancyBitsPerLetter)}`,
    );
  }
  if (!Number.isFinite(keySpaceBitsValue) || keySpaceBitsValue < 0) {
    throw new DomainError('InvalidParameter', `key space bits must be non-negative, got ${String(keySpaceBitsValue)}`);
  }
  return keySpaceBitsValue / redundancyBitsPerLetter;
}

/** Small deterministic PRNG (mulberry32). The same seed always gives the same sequence. */
export function seededRng(seed: number): Rng {
  if (!Number.isSafeInteger(seed))
    throw new DomainError('NotAnInteger', `seed must be an integer, got ${String(seed)}`);
  let state = seed >>> 0;
  const next = (): number => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return { next, nextInt: (max: number): number => Math.floor(next() * max) };
}

function sameKey(x: ValidBreakableKey, y: ValidBreakableKey): boolean {
  if (x.cipher === 'caesar' && y.cipher === 'caesar') return x.shift === y.shift;
  if (x.cipher === 'affine' && y.cipher === 'affine') return x.a === y.a && x.b === y.b;
  return false;
}

/**
 * Fraction of seeded random samples of `length` letters, encrypted with a random key, for which the true key is
 * ranked first. Reproducible: the same rng state gives the same answer.
 */
export function breakSuccessRate(
  corpus: readonly string[],
  cipher: BreakableCipher,
  length: number,
  trials: number,
  rng: Rng,
): number {
  if (!Number.isSafeInteger(length) || length < 1) {
    throw new DomainError('InvalidParameter', `length must be a positive integer, got ${String(length)}`);
  }
  if (!Number.isSafeInteger(trials) || trials < 1) {
    throw new DomainError('InvalidParameter', `trials must be a positive integer, got ${String(trials)}`);
  }
  const passages = corpus.map((p) => p.replace(/[^A-Za-z]/g, '').toUpperCase()).filter((p) => p.length >= length);
  if (passages.length === 0) {
    throw new DomainError('CorpusTooShort', `no passage in the corpus has ${length} letters`);
  }
  const keys = enumerateKeys(cipher);
  let hits = 0;
  for (let t = 0; t < trials; t += 1) {
    const passage = passages[rng.nextInt(passages.length)] ?? '';
    const start = rng.nextInt(passage.length - length + 1);
    const plain = passage.slice(start, start + length);
    const key = keys[rng.nextInt(keys.length)];
    if (key === undefined) continue;
    const best = scoreKeys(encrypt(plain, key), keys)[0];
    if (best !== undefined && sameKey(best.key, key)) hits += 1;
  }
  return hits / trials;
}

/* ------------------------------------------------ exhaustive self-check */

const CHECK_TEXT = 'The Quick Brown Fox Jumps Over The Lazy Dog, 0123456789! abcxyz ABCXYZ';

function check(id: string, description: string, cases: readonly boolean[]): CheckResult {
  return { id, description, passed: cases.filter(Boolean).length, total: cases.length };
}

function rejects(spec: KeySpec): boolean {
  try {
    validateKey(spec);
    return false;
  } catch (error) {
    return error instanceof DomainError;
  }
}

/** Proves D(E(m)) = m over every Caesar and affine key and checks the validators. The numbers are the evidence. */
export function runExhaustiveChecks(): CheckReport {
  const caesar = enumerateKeys('caesar');
  const affine = enumerateKeys('affine');
  const units = unitsModN(26);
  const nonUnits = Array.from({ length: 26 }, (_, a) => a).filter((a) => gcd(a, 26) !== 1);
  const reversed = 'ZYXWVUTSRQPONMLKJIHGFEDCBA';
  const rot13 = 'NOPQRSTUVWXYZABCDEFGHIJKLM';

  const subs = [reversed, rot13, 'QWERTYUIOPASDFGHJKLZXCVBNM'].map((map) =>
    validateKey({ cipher: 'substitution', map }),
  );
  const badMaps = ['ABC', 'AABCDEFGHIJKLMNOPQRSTUVWXY', 'ABCDEFGHIJKLMNOPQRSTUVWXY1', ''];

  const checks: CheckResult[] = [
    check(
      'caesar-round-trip',
      'decrypt(encrypt(m)) = m for all 26 Caesar shifts',
      caesar.map((k) => decrypt(encrypt(CHECK_TEXT, k), k) === CHECK_TEXT),
    ),
    check(
      'affine-round-trip',
      'decrypt(encrypt(m)) = m for all 312 valid affine keys',
      affine.map((k) => decrypt(encrypt(CHECK_TEXT, k), k) === CHECK_TEXT),
    ),
    check('affine-key-count', 'exactly 312 valid affine keys (12 units × 26)', [
      affine.length === 312 && units.length === 12,
    ]),
    check(
      'unit-inverses',
      'each of the 12 units a has an inverse with a · a⁻¹ ≡ 1 (mod 26)',
      units.map((a) => mod(a * modInverse(a, 26), 26) === 1),
    ),
    check(
      'non-units-rejected',
      'every a with gcd(a, 26) > 1 is rejected as an affine multiplier (14 values)',
      nonUnits.map((a) => rejects({ cipher: 'affine', a, b: 0 })),
    ),
    check(
      'substitution-round-trip',
      'decrypt(encrypt(m)) = m for sample substitution keys (reverse, ROT13, QWERTY)',
      subs.map((k) => decrypt(encrypt(CHECK_TEXT, k), k) === CHECK_TEXT),
    ),
    check(
      'substitution-inverse',
      'the inverse of the inverse permutation is the original',
      ['QWERTYUIOPASDFGHJKLZXCVBNM', reversed, rot13].map((m) => invertSubstitution(invertSubstitution(m)) === m),
    ),
    check(
      'substitution-invalid',
      'wrong length, repeated letter, non-letter and empty keys are rejected',
      badMaps.map((map) => rejects({ cipher: 'substitution', map })),
    ),
  ];

  const passed = checks.reduce((s, c) => s + c.passed, 0);
  const total = checks.reduce((s, c) => s + c.total, 0);
  return { checks, passed, total, allPassed: passed === total };
}
