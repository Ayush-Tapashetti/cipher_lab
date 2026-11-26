import { encrypt, validateKey } from './ciphers';
import type { KeySpec, ValidCaesar } from './types';

/** Original sample text (written for this project) used by the break demo. About 450 letters. */
export const SAMPLE_PLAINTEXT =
  'Modular arithmetic is the arithmetic of remainders. When two numbers leave the same remainder after division by ' +
  'twenty six, we treat them as the same point on a circle of letters. A Caesar cipher simply turns that circle by a ' +
  'fixed amount, so every letter moves the same number of places along the alphabet. Because there are only twenty ' +
  'six possible turns, an attacker can try them all, but frequency analysis is faster and teaches us more: in English ' +
  'the letter E appears far more often than any other, and the shape of that pattern survives encryption intact.';

export const SAMPLE_CAESAR_SHIFT = 11;
export const SAMPLE_CAESAR_SPEC: KeySpec = { cipher: 'caesar', shift: SAMPLE_CAESAR_SHIFT };
export const SAMPLE_AFFINE_SPEC: KeySpec = { cipher: 'affine', a: 5, b: 8 };
/** A valid permutation (keyboard order) for the substitution board demo. */
export const SAMPLE_SUBSTITUTION_SPEC: KeySpec = { cipher: 'substitution', map: 'QWERTYUIOPASDFGHJKLZXCVBNM' };

/** The sample plaintext encrypted with the sample Caesar key: the ciphertext the user is asked to break. */
export const SAMPLE_CIPHERTEXT: string = encrypt(SAMPLE_PLAINTEXT, validateKey(SAMPLE_CAESAR_SPEC) as ValidCaesar);

/** Original English passages for the success-versus-length experiment (each over 300 letters). */
export const SAMPLE_CORPUS: readonly string[] = [
  SAMPLE_PLAINTEXT,
  'A graph is a set of vertices together with a set of edges that join pairs of them. Many questions about networks ' +
    'become questions about paths: is there a route from one vertex to another, how long is the shortest one, and can ' +
    'every edge be walked exactly once? Euler answered the last of these for the bridges of Konigsberg by counting how ' +
    'many edges meet at each vertex, and in doing so he started a whole branch of mathematics.',
  'Counting looks easy until the numbers grow. If a code has four letters and each letter can be chosen in twenty six ' +
    'ways, there are twenty six to the power of four possible codes. When order matters and nothing may repeat we use ' +
    'permutations, and when order does not matter we use combinations. The same ideas tell us how many keys a cipher ' +
    'has, and therefore how hopeless it is to guess one at random.',
  'A proof by induction has two parts. First we show that the statement holds for the smallest case. Then we show ' +
    'that whenever it holds for some number, it must also hold for the next one. Together these two facts work like a ' +
    'line of falling dominoes: the first one falls, and every domino that falls knocks over its neighbour, so all of ' +
    'them must eventually fall.',
  'The set of whole numbers modulo twenty six forms a group under addition, because adding two residues gives another ' +
    'residue, there is a neutral element, and every residue has an opposite. Under multiplication only the residues that ' +
    'share no factor with twenty six have inverses. That small fact is exactly why an affine cipher can only use some ' +
    'multipliers, and why twelve of them survive.',
];
