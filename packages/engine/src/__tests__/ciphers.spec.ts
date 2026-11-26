import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import {
  ALPHABET,
  DomainError,
  decrypt,
  encrypt,
  enumerateKeys,
  invertSubstitution,
  traceCipher,
  validateKey,
} from '../index';
import type { KeySpec } from '../index';

const codeOf = (fn: () => unknown): string | null => {
  try {
    fn();
    return null;
  } catch (e) {
    return e instanceof DomainError ? e.code : 'NOT_A_DOMAIN_ERROR';
  }
};

const anyText = fc.string({ unit: 'binary', maxLength: 120 });
const permutation = fc.shuffledSubarray([...ALPHABET], { minLength: 26, maxLength: 26 }).map((l) => l.join(''));

describe('Caesar', () => {
  it('E(x) = (x + 3) mod 26 turns HELLO into KHOOR and back', () => {
    const key = validateKey({ cipher: 'caesar', shift: 3 });
    expect(encrypt('HELLO', key)).toBe('KHOOR');
    expect(decrypt('KHOOR', key)).toBe('HELLO');
  });
  it('wraps around the end of the alphabet and reduces any integer shift mod 26', () => {
    expect(encrypt('XYZ', validateKey({ cipher: 'caesar', shift: 3 }))).toBe('ABC');
    expect(validateKey({ cipher: 'caesar', shift: 29 })).toMatchObject({ shift: 3 });
    expect(validateKey({ cipher: 'caesar', shift: -1 })).toMatchObject({ shift: 25 });
  });
  it('rejects a non-integer shift', () => {
    expect(codeOf(() => validateKey({ cipher: 'caesar', shift: 1.5 }))).toBe('InvalidShift');
    expect(codeOf(() => validateKey({ cipher: 'caesar', shift: Number.NaN }))).toBe('InvalidShift');
  });
  it('keeps case, spaces, digits and punctuation', () => {
    const key = validateKey({ cipher: 'caesar', shift: 3 });
    expect(encrypt('Hello, World! 42', key)).toBe('Khoor, Zruog! 42');
  });
  it('shift 0 is the identity and shifts compose additively (cyclic group Z26)', () => {
    const id = validateKey({ cipher: 'caesar', shift: 0 });
    fc.assert(fc.property(anyText, (t) => encrypt(t, id) === t));
    fc.assert(
      fc.property(anyText, fc.integer({ min: 0, max: 25 }), fc.integer({ min: 0, max: 25 }), (t, j, k) => {
        const kj = validateKey({ cipher: 'caesar', shift: j });
        const kk = validateKey({ cipher: 'caesar', shift: k });
        const sum = validateKey({ cipher: 'caesar', shift: j + k });
        return encrypt(encrypt(t, kj), kk) === encrypt(t, sum);
      }),
    );
  });
});

describe('Affine', () => {
  it('a=5, b=8 turns AFFINE CIPHER into IHHWVC SWFRCP', () => {
    const key = validateKey({ cipher: 'affine', a: 5, b: 8 });
    expect(encrypt('AFFINE CIPHER', key)).toBe('IHHWVC SWFRCP');
    expect(decrypt('IHHWVC SWFRCP', key)).toBe('AFFINE CIPHER');
  });
  it('rejects every multiplier with gcd(a, 26) != 1 and names the gcd', () => {
    for (const a of [0, 2, 4, 6, 8, 10, 12, 13, 14, 16, 18, 20, 22, 24]) {
      expect(codeOf(() => validateKey({ cipher: 'affine', a, b: 3 }))).toBe('NotCoprimeWith26');
    }
    try {
      validateKey({ cipher: 'affine', a: 13, b: 0 });
    } catch (e) {
      expect(e instanceof DomainError && e.detail).toContain('gcd(13, 26) = 13');
    }
  });
  it('accepts exactly 12 multipliers and 312 keys', () => {
    expect(enumerateKeys('affine')).toHaveLength(312);
    expect(new Set(enumerateKeys('affine').map((k) => (k.cipher === 'affine' ? k.a : -1))).size).toBe(12);
  });
  it('rejects non-integer parts with InvalidKey', () => {
    expect(codeOf(() => validateKey({ cipher: 'affine', a: 1.2, b: 3 }))).toBe('InvalidKey');
  });
  it('a=1 is a Caesar cipher: E(x) = x + b', () => {
    const affine = validateKey({ cipher: 'affine', a: 1, b: 7 });
    const caesar = validateKey({ cipher: 'caesar', shift: 7 });
    fc.assert(fc.property(anyText, (t) => encrypt(t, affine) === encrypt(t, caesar)));
  });
});

describe('Substitution', () => {
  const qwerty = 'QWERTYUIOPASDFGHJKLZXCVBNM';
  it('maps A to the first letter of the key and B to the second', () => {
    const key = validateKey({ cipher: 'substitution', map: qwerty });
    expect(encrypt('AB', key)).toBe('QW');
    expect(decrypt('QW', key)).toBe('AB');
  });
  it('rejects a key with a repeated or missing letter and names them', () => {
    const dup = 'AABCDEFGHIJKLMNOPQRSTUVWXY'; // repeats A, misses Z
    expect(codeOf(() => validateKey({ cipher: 'substitution', map: dup }))).toBe('NotAPermutation');
    try {
      validateKey({ cipher: 'substitution', map: dup });
    } catch (e) {
      const d = e instanceof DomainError ? e.detail : '';
      expect(d).toContain('repeated: A');
      expect(d).toContain('missing: Z');
    }
  });
  it('rejects wrong length, non-letters and empty input', () => {
    for (const map of ['', 'ABC', 'ABCDEFGHIJKLMNOPQRSTUVWXY1', `${qwerty}Q`]) {
      expect(codeOf(() => validateKey({ cipher: 'substitution', map }))).toBe('NotAPermutation');
    }
  });
  it('accepts lower-case keys and normalises them', () => {
    expect(validateKey({ cipher: 'substitution', map: qwerty.toLowerCase() })).toMatchObject({ map: qwerty });
  });
  it('property: the inverse of the inverse is the original; decrypt(encrypt(m)) = m', () => {
    fc.assert(
      fc.property(permutation, anyText, (map, text) => {
        const key = validateKey({ cipher: 'substitution', map });
        return invertSubstitution(invertSubstitution(map)) === map && decrypt(encrypt(text, key), key) === text;
      }),
    );
  });
});

describe('round trip and structure (all ciphers)', () => {
  it('every one of the 26 Caesar keys and 312 affine keys round-trips arbitrary text', () => {
    const keys = [...enumerateKeys('caesar'), ...enumerateKeys('affine')];
    expect(keys).toHaveLength(338);
    fc.assert(
      fc.property(anyText, (t) => keys.every((k) => decrypt(encrypt(t, k), k) === t)),
      { numRuns: 60 },
    );
  });
  it('encrypt keeps length, case and every non-letter in place', () => {
    const specs: KeySpec[] = [
      { cipher: 'caesar', shift: 11 },
      { cipher: 'affine', a: 7, b: 2 },
      { cipher: 'substitution', map: 'QWERTYUIOPASDFGHJKLZXCVBNM' },
    ];
    fc.assert(
      fc.property(anyText, (t) =>
        specs.every((s) => {
          const out = encrypt(t, validateKey(s));
          if (out.length !== t.length) return false;
          for (let i = 0; i < t.length; i += 1) {
            const c = t.charAt(i);
            const o = out.charAt(i);
            if (/[A-Za-z]/.test(c)) {
              if (!/[A-Za-z]/.test(o) || (c === c.toUpperCase()) !== (o === o.toUpperCase())) return false;
            } else if (c !== o) return false;
          }
          return true;
        }),
      ),
    );
  });
  it('encrypt is a bijection on letters: 26 distinct outputs for A..Z', () => {
    for (const k of [...enumerateKeys('caesar'), ...enumerateKeys('affine')]) {
      expect(new Set([...encrypt(ALPHABET, k)]).size).toBe(26);
    }
  });
  it('rejects a key that did not come from validateKey', () => {
    const forged = { cipher: 'caesar', shift: 3 } as unknown as Parameters<typeof encrypt>[1];
    expect(codeOf(() => encrypt('HI', forged))).toBe('InvalidKey');
  });
});

describe('traceCipher', () => {
  it('shows (x + k) mod 26 for each letter', () => {
    const rows = traceCipher('Hi!', validateKey({ cipher: 'caesar', shift: 3 }), 'encrypt');
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({ position: 0, char: 'H', x: 7, unreduced: 10, reduced: 10, out: 'K' });
    expect(rows[0]?.formula).toBe('(7 + 3) mod 26');
    expect(rows[1]).toMatchObject({ char: 'i', x: 8, out: 'l' });
  });
  it('decryption shows the unreduced negative value before reducing', () => {
    const rows = traceCipher('A', validateKey({ cipher: 'caesar', shift: 3 }), 'decrypt');
    expect(rows[0]).toMatchObject({ x: 0, unreduced: -3, reduced: 23, out: 'X' });
  });
  it('property: the trace reproduces the cipher output for every key type and direction', () => {
    const keys = [
      ...enumerateKeys('caesar'),
      ...enumerateKeys('affine').filter((_, i) => i % 7 === 0),
      validateKey({ cipher: 'substitution', map: 'QWERTYUIOPASDFGHJKLZXCVBNM' }),
    ];
    fc.assert(
      fc.property(anyText, (t) =>
        keys.every((k) =>
          (['encrypt', 'decrypt'] as const).every((dir) => {
            const rows = traceCipher(t, k, dir);
            const out = dir === 'encrypt' ? encrypt(t, k) : decrypt(t, k);
            const lettersOnly = [...out].filter((c) => /[A-Za-z]/.test(c)).join('');
            return (
              rows.map((r) => r.out).join('') === lettersOnly && rows.every((r) => out.charAt(r.position) === r.out)
            );
          }),
        ),
      ),
      { numRuns: 40 },
    );
  });
});
