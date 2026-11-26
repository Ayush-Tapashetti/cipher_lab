export type CipherType = 'caesar' | 'affine' | 'substitution';
export type BreakableCipher = 'caesar' | 'affine';
export type Direction = 'encrypt' | 'decrypt';

/** Unvalidated key as typed by a user. */
export type KeySpec =
  | { readonly cipher: 'caesar'; readonly shift: number }
  | { readonly cipher: 'affine'; readonly a: number; readonly b: number }
  | { readonly cipher: 'substitution'; readonly map: string };

/** Validated keys carry everything needed to run both directions. Create them with validateKey. */
export interface ValidCaesar {
  readonly cipher: 'caesar';
  readonly shift: number;
  readonly valid: true;
}
export interface ValidAffine {
  readonly cipher: 'affine';
  readonly a: number;
  readonly b: number;
  readonly aInverse: number;
  readonly valid: true;
}
export interface ValidSubstitution {
  readonly cipher: 'substitution';
  readonly map: string;
  readonly inverse: string;
  readonly valid: true;
}
export type ValidKey = ValidCaesar | ValidAffine | ValidSubstitution;
export type ValidBreakableKey = ValidCaesar | ValidAffine;

/** One letter of a step-by-step trace. `x` is the letter's number in Z26 (A=0 ... Z=25). */
export interface TraceRow {
  readonly position: number;
  readonly char: string;
  readonly x: number;
  readonly formula: string;
  readonly unreduced: number;
  readonly reduced: number;
  readonly out: string;
}

export interface BreakCandidateData {
  readonly rank: number;
  readonly key: ValidBreakableKey;
  readonly chiSquared: number;
  readonly plaintextPreview: string;
}

export type Confidence = 'low' | 'medium' | 'high';
export type CandidateState = 'ranked' | 'selected' | 'rejected';
export type CandidateEvent = 'select' | 'deselect' | 'reject' | 'restore' | 'select_other';

export type GroupOp = 'add' | 'mul';

/** A known plaintext/ciphertext letter pair, each a single letter A-Z (case-insensitive). */
export interface Pair {
  readonly plain: string;
  readonly cipher: string;
}

export interface AffineSolution {
  readonly a: number;
  readonly b: number;
}

export interface Rng {
  /** Uniform float in [0, 1). */
  next(): number;
  /** Uniform integer in [0, max). */
  nextInt(max: number): number;
}

export interface CheckResult {
  readonly id: string;
  readonly description: string;
  readonly passed: number;
  readonly total: number;
}
export interface CheckReport {
  readonly checks: readonly CheckResult[];
  readonly passed: number;
  readonly total: number;
  readonly allPassed: boolean;
}

export interface EuclidStep {
  readonly dividend: number;
  readonly divisor: number;
  readonly quotient: number;
  readonly remainder: number;
}
