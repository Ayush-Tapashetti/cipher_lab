import { decrypt, enumerateKeys, mapLetter } from './ciphers';
import { ENGLISH_FREQ } from './english';
import { DomainError } from './errors';
import { letterCounts, totalLetters } from './frequency';
import type { BreakCandidateData, CandidateEvent, CandidateState, Confidence, ValidBreakableKey } from './types';

/** Below this many letters a result is always reported as low confidence. */
export const MIN_LETTERS_FOR_CONFIDENCE = 20;
/** second-best / best chi-squared below this ratio means the winner is not clearly ahead: low confidence. */
export const LOW_RATIO = 1.5;
/** ... at or above this ratio the winner is far ahead: high confidence. Between the two: medium. */
export const HIGH_RATIO = 3;
const PREVIEW_CHARS = 120;

/** Σ (O − E·N)² / (E·N) over the 26 letters. Lower means a better fit to `expected`. Throws EmptyText when N = 0. */
export function chiSquared(counts: readonly number[], expected: readonly number[]): number {
  const n = totalLetters(counts);
  if (n === 0) throw new DomainError('EmptyText', 'no letters to analyse');
  let sum = 0;
  for (let i = 0; i < 26; i += 1) {
    const e = (expected[i] ?? 0) * n;
    const o = counts[i] ?? 0;
    if (e === 0) {
      if (o !== 0) sum += Number.POSITIVE_INFINITY;
      continue;
    }
    sum += ((o - e) * (o - e)) / e;
  }
  return sum;
}

/**
 * If the ciphertext was made with `key`, then plaintext letter p became ciphertext letter E(p). So the plaintext
 * count of p equals the ciphertext count of E(p). This lets us score a key without decrypting any text.
 */
function plaintextCountsUnder(cipherCounts: readonly number[], key: ValidBreakableKey): number[] {
  const out = new Array<number>(26).fill(0);
  for (let p = 0; p < 26; p += 1) out[p] = cipherCounts[mapLetter(p, key, 'encrypt')] ?? 0;
  return out;
}

interface Scored {
  readonly key: ValidBreakableKey;
  readonly chiSquared: number;
}

/** Scores every key and sorts ascending by chi-squared; ties keep the enumeration order so output is deterministic. */
export function scoreKeys(ciphertext: string, keys: readonly ValidBreakableKey[]): Scored[] {
  const counts = letterCounts(ciphertext);
  if (totalLetters(counts) === 0) throw new DomainError('EmptyText', 'no letters to analyse');
  return keys
    .map((key, order) => ({ key, order, chiSquared: chiSquared(plaintextCountsUnder(counts, key), ENGLISH_FREQ) }))
    .sort((x, y) => x.chiSquared - y.chiSquared || x.order - y.order)
    .map(({ key, chiSquared: score }) => ({ key, chiSquared: score }));
}

function rank(ciphertext: string, keys: readonly ValidBreakableKey[]): BreakCandidateData[] {
  const head = ciphertext.slice(0, PREVIEW_CHARS);
  return scoreKeys(ciphertext, keys).map((s, i) => ({
    rank: i + 1,
    key: s.key,
    chiSquared: s.chiSquared,
    plaintextPreview: decrypt(head, s.key),
  }));
}

/** All 26 shifts ranked by chi-squared against English. Rank 1 is the best candidate. */
export function rankCaesarCandidates(ciphertext: string): BreakCandidateData[] {
  return rank(ciphertext, enumerateKeys('caesar'));
}

/** All 312 valid affine keys ranked the same way. */
export function rankAffineCandidates(ciphertext: string): BreakCandidateData[] {
  return rank(ciphertext, enumerateKeys('affine'));
}

/** How much to trust the top candidate, from the amount of text and how far ahead the winner is. */
export function breakConfidence(total: number, bestScore: number, secondScore: number): Confidence {
  if (total < MIN_LETTERS_FOR_CONFIDENCE) return 'low';
  if (bestScore === 0) return secondScore > 0 ? 'high' : 'low';
  const ratio = secondScore / bestScore;
  if (ratio < LOW_RATIO) return 'low';
  if (ratio < HIGH_RATIO) return 'medium';
  return 'high';
}

/* ------------------------------------------------- candidate state machine */

const TABLE: Record<CandidateState, Partial<Record<CandidateEvent, CandidateState>>> = {
  ranked: { select: 'selected', reject: 'rejected' },
  selected: { deselect: 'ranked', select_other: 'ranked' },
  rejected: { restore: 'ranked' },
};

/** (state, event) -> new state, or IllegalTransition. The only way a candidate's state changes. */
export function transitionCandidate(state: CandidateState, event: CandidateEvent): CandidateState {
  const row = Object.hasOwn(TABLE, state) ? TABLE[state] : undefined;
  const next = row !== undefined && Object.hasOwn(row, event) ? row[event] : undefined;
  if (next === undefined) {
    throw new DomainError('IllegalTransition', `cannot apply "${event}" to a "${state}" candidate`);
  }
  return next;
}

/**
 * Selects the candidate at `index` and sends any previously selected one back to "ranked", so at most one candidate
 * of a profile is selected. Selecting an already selected candidate changes nothing.
 */
export function selectInProfile(states: readonly CandidateState[], index: number): CandidateState[] {
  if (!Number.isInteger(index) || index < 0 || index >= states.length) {
    throw new DomainError('IllegalTransition', `no candidate at index ${String(index)}`);
  }
  if (states[index] === 'selected') return [...states];
  return states.map((state, i) => {
    if (i === index) return transitionCandidate(state, 'select');
    return state === 'selected' ? transitionCandidate(state, 'select_other') : state;
  });
}
