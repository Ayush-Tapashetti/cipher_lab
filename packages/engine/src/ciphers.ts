import { DomainError } from './errors';
import { gcd, mod, modInverse } from './modular';
import type {
  Direction,
  KeySpec,
  TraceRow,
  ValidAffine,
  ValidBreakableKey,
  ValidCaesar,
  ValidKey,
  ValidSubstitution,
} from './types';

export const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
export const N = 26;
const UPPER_A = 65;
const LOWER_A = 97;

/* ---------------------------------------------------------------- keys */

function describePermutationProblem(raw: string): string {
  const problems: string[] = [];
  if (raw.length !== N) problems.push(`length is ${raw.length}, expected 26`);
  const bad = [...new Set([...raw].filter((c) => !ALPHABET.includes(c.toUpperCase())))];
  if (bad.length > 0) problems.push(`not letters A-Z: ${bad.map((c) => JSON.stringify(c)).join(', ')}`);
  const upper = raw.toUpperCase();
  const seen = new Set<string>();
  const dup = new Set<string>();
  for (const c of upper) {
    if (!ALPHABET.includes(c)) continue;
    if (seen.has(c)) dup.add(c);
    seen.add(c);
  }
  if (dup.size > 0) problems.push(`repeated: ${[...dup].join(', ')}`);
  const missing = [...ALPHABET].filter((c) => !seen.has(c));
  if (missing.length > 0) problems.push(`missing: ${missing.join(', ')}`);
  return problems.join('; ');
}

/** The inverse permutation. Throws NotAPermutation (naming the problem) if `map` is not a bijection on A-Z. */
export function invertSubstitution(map: string): string {
  const upper = map.toUpperCase();
  if (upper.length !== N || new Set(upper).size !== N || [...upper].some((c) => !ALPHABET.includes(c))) {
    throw new DomainError('NotAPermutation', describePermutationProblem(map));
  }
  const inverse: string[] = new Array<string>(N).fill('');
  for (let i = 0; i < N; i += 1) {
    const image = upper.charCodeAt(i) - UPPER_A;
    inverse[image] = ALPHABET.charAt(i);
  }
  return inverse.join('');
}

/** Turns a user-typed key into a key the cipher functions accept, or throws a named error saying why not. */
export function validateKey(spec: KeySpec): ValidKey {
  switch (spec.cipher) {
    case 'caesar': {
      if (!Number.isSafeInteger(spec.shift)) {
        throw new DomainError('InvalidShift', `shift must be an integer, got ${String(spec.shift)}`);
      }
      const key: ValidCaesar = { cipher: 'caesar', shift: mod(spec.shift, N), valid: true };
      return key;
    }
    case 'affine': {
      if (!Number.isSafeInteger(spec.a) || !Number.isSafeInteger(spec.b)) {
        throw new DomainError('InvalidKey', `a and b must be integers, got a=${String(spec.a)}, b=${String(spec.b)}`);
      }
      const a = mod(spec.a, N);
      const b = mod(spec.b, N);
      const g = gcd(a, N);
      if (g !== 1) {
        throw new DomainError('NotCoprimeWith26', `gcd(${a}, 26) = ${g}, not 1, so a has no inverse mod 26`);
      }
      const key: ValidAffine = { cipher: 'affine', a, b, aInverse: modInverse(a, N), valid: true };
      return key;
    }
    case 'substitution': {
      const inverse = invertSubstitution(spec.map);
      const key: ValidSubstitution = { cipher: 'substitution', map: spec.map.toUpperCase(), inverse, valid: true };
      return key;
    }
    default: {
      throw new DomainError('InvalidKey', 'unknown cipher type');
    }
  }
}

/** Every valid key of a breakable cipher, in a fixed order: 26 Caesar shifts, or the 312 affine keys by (a, b). */
export function enumerateKeys(cipher: 'caesar' | 'affine'): ValidBreakableKey[] {
  const keys: ValidBreakableKey[] = [];
  if (cipher === 'caesar') {
    for (let shift = 0; shift < N; shift += 1) keys.push({ cipher: 'caesar', shift, valid: true });
    return keys;
  }
  for (let a = 1; a < N; a += 1) {
    if (gcd(a, N) !== 1) continue;
    const aInverse = modInverse(a, N);
    for (let b = 0; b < N; b += 1) keys.push({ cipher: 'affine', a, b, aInverse, valid: true });
  }
  return keys;
}

function assertValid(key: ValidKey): void {
  const ok =
    typeof key === 'object' &&
    key.valid === true &&
    (key.cipher === 'caesar' || key.cipher === 'affine' || key.cipher === 'substitution');
  if (!ok) throw new DomainError('InvalidKey', 'key was not produced by validateKey');
}

/* ------------------------------------------------- the letter functions */

/** Encrypts or decrypts one letter number x in Z26. This is the whole mathematical content of the three ciphers. */
export function mapLetter(x: number, key: ValidKey, direction: Direction): number {
  switch (key.cipher) {
    case 'caesar':
      return direction === 'encrypt' ? mod(x + key.shift, N) : mod(x - key.shift, N);
    case 'affine':
      return direction === 'encrypt' ? mod(key.a * x + key.b, N) : mod(key.aInverse * (x - key.b), N);
    case 'substitution': {
      const table = direction === 'encrypt' ? key.map : key.inverse;
      return table.charCodeAt(x) - UPPER_A;
    }
    default:
      throw new DomainError('InvalidKey', 'unknown cipher type');
  }
}

function transform(text: string, key: ValidKey, direction: Direction): string {
  assertValid(key);
  let out = '';
  for (let i = 0; i < text.length; i += 1) {
    const code = text.charCodeAt(i);
    if (code >= UPPER_A && code < UPPER_A + N) {
      out += String.fromCharCode(UPPER_A + mapLetter(code - UPPER_A, key, direction));
    } else if (code >= LOWER_A && code < LOWER_A + N) {
      out += String.fromCharCode(LOWER_A + mapLetter(code - LOWER_A, key, direction));
    } else {
      out += text.charAt(i);
    }
  }
  return out;
}

/** Non-letters pass through unchanged; letter case is preserved. */
export function encrypt(text: string, key: ValidKey): string {
  return transform(text, key, 'encrypt');
}

/** decrypt(encrypt(m, k), k) === m for every valid key and every string. */
export function decrypt(text: string, key: ValidKey): string {
  return transform(text, key, 'decrypt');
}

/* ------------------------------------------------------------- tracing */

const MINUS = '−';
const DOT = '·';

function traceOne(
  x: number,
  key: ValidKey,
  direction: Direction,
): { formula: string; unreduced: number; reduced: number } {
  switch (key.cipher) {
    case 'caesar': {
      if (direction === 'encrypt') {
        return { formula: `(${x} + ${key.shift}) mod 26`, unreduced: x + key.shift, reduced: mod(x + key.shift, N) };
      }
      return {
        formula: `(${x} ${MINUS} ${key.shift}) mod 26`,
        unreduced: x - key.shift,
        reduced: mod(x - key.shift, N),
      };
    }
    case 'affine': {
      if (direction === 'encrypt') {
        const unreduced = key.a * x + key.b;
        return { formula: `(${key.a} ${DOT} ${x} + ${key.b}) mod 26`, unreduced, reduced: mod(unreduced, N) };
      }
      const unreduced = key.aInverse * (x - key.b);
      return {
        formula: `(${key.aInverse} ${DOT} (${x} ${MINUS} ${key.b})) mod 26`,
        unreduced,
        reduced: mod(unreduced, N),
      };
    }
    case 'substitution': {
      const y = mapLetter(x, key, direction);
      const table = direction === 'encrypt' ? 'map' : 'inverse';
      return { formula: `${table}[${x}] = ${ALPHABET.charAt(y)}`, unreduced: y, reduced: y };
    }
    default:
      throw new DomainError('InvalidKey', 'unknown cipher type');
  }
}

/**
 * One row per letter of `text` showing the arithmetic. Joining the `out` fields reproduces exactly the letters
 * of encrypt/decrypt(text, key).
 */
export function traceCipher(text: string, key: ValidKey, direction: Direction): TraceRow[] {
  assertValid(key);
  const rows: TraceRow[] = [];
  for (let i = 0; i < text.length; i += 1) {
    const code = text.charCodeAt(i);
    const upper = code >= UPPER_A && code < UPPER_A + N;
    const lower = code >= LOWER_A && code < LOWER_A + N;
    if (!upper && !lower) continue;
    const base = upper ? UPPER_A : LOWER_A;
    const x = code - base;
    const { formula, unreduced, reduced } = traceOne(x, key, direction);
    rows.push({
      position: i,
      char: text.charAt(i),
      x,
      formula,
      unreduced,
      reduced,
      out: String.fromCharCode(base + reduced),
    });
  }
  return rows;
}
