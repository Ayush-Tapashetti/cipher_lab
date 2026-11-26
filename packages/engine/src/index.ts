export { DomainError } from './errors';
export type { DomainErrorCode } from './errors';
export type * from './types';

export { mod, gcd, extendedGcd, euclidSteps, modInverse, totient, solveLinearCongruence } from './modular';
export {
  ALPHABET,
  validateKey,
  invertSubstitution,
  enumerateKeys,
  mapLetter,
  encrypt,
  decrypt,
  traceCipher,
} from './ciphers';
export { letterCounts, totalLetters, relativeFrequencies, indexOfCoincidence } from './frequency';
export { ENGLISH_FREQ, ENGLISH_IC } from './english';
export {
  MIN_LETTERS_FOR_CONFIDENCE,
  LOW_RATIO,
  HIGH_RATIO,
  chiSquared,
  scoreKeys,
  rankCaesarCandidates,
  rankAffineCandidates,
  breakConfidence,
  transitionCandidate,
  selectInProfile,
} from './breaker';
export { unitsModN, keySpaceSize, orbit, elementOrder, generators, cayleyTable } from './algebra';
export { solveAffineFromPairs } from './attack';
export {
  ENGLISH_REDUNDANCY_BITS_PER_LETTER,
  log2BigInt,
  keySpaceBits,
  unicityDistance,
  seededRng,
  breakSuccessRate,
  runExhaustiveChecks,
} from './stats';
export {
  SAMPLE_PLAINTEXT,
  SAMPLE_CIPHERTEXT,
  SAMPLE_CAESAR_SHIFT,
  SAMPLE_CAESAR_SPEC,
  SAMPLE_AFFINE_SPEC,
  SAMPLE_SUBSTITUTION_SPEC,
  SAMPLE_CORPUS,
} from './samples';
