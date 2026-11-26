import { describe, expect, it } from 'vitest';
import {
  DomainError,
  ENGLISH_FREQ,
  MIN_LETTERS_FOR_CONFIDENCE,
  SAMPLE_CAESAR_SHIFT,
  SAMPLE_CIPHERTEXT,
  SAMPLE_CORPUS,
  SAMPLE_PLAINTEXT,
  breakConfidence,
  chiSquared,
  decrypt,
  encrypt,
  enumerateKeys,
  letterCounts,
  rankAffineCandidates,
  rankCaesarCandidates,
  selectInProfile,
  transitionCandidate,
  validateKey,
} from '../index';
import type { CandidateEvent, CandidateState } from '../index';

const codeOf = (fn: () => unknown): string | null => {
  try {
    fn();
    return null;
  } catch (e) {
    return e instanceof DomainError ? e.code : 'NOT_A_DOMAIN_ERROR';
  }
};

describe('chiSquared', () => {
  it('is 0 when observed equals expected exactly', () => {
    const counts = ENGLISH_FREQ.map((p) => p * 1000);
    expect(chiSquared(counts, ENGLISH_FREQ)).toBeCloseTo(0, 9);
  });
  it('matches a hand calculation on a tiny example', () => {
    const expected = [0.5, 0.5, ...new Array<number>(24).fill(0)];
    // N = 4, E = 2, 2: counts 3 and 1 give (3-2)²/2 + (1-2)²/2 = 1
    expect(chiSquared([3, 1, ...new Array<number>(24).fill(0)], expected)).toBeCloseTo(1, 12);
  });
  it('throws EmptyText when there are no letters', () => {
    expect(codeOf(() => chiSquared(letterCounts('123'), ENGLISH_FREQ))).toBe('EmptyText');
  });
});

describe('breaking the bundled sample', () => {
  it('ranks the true Caesar key first and recovers the plaintext', () => {
    const ranked = rankCaesarCandidates(SAMPLE_CIPHERTEXT);
    expect(ranked).toHaveLength(26);
    const top = ranked[0];
    expect(top?.rank).toBe(1);
    expect(top?.key).toMatchObject({ cipher: 'caesar', shift: SAMPLE_CAESAR_SHIFT });
    expect(top && decrypt(SAMPLE_CIPHERTEXT, top.key)).toBe(SAMPLE_PLAINTEXT);
    expect(top?.plaintextPreview).toBe(SAMPLE_PLAINTEXT.slice(0, 120));
  });
  it('is sorted by ascending chi-squared with ranks 1..26', () => {
    const ranked = rankCaesarCandidates(SAMPLE_CIPHERTEXT);
    expect(ranked.map((c) => c.rank)).toEqual(Array.from({ length: 26 }, (_, i) => i + 1));
    for (let i = 1; i < ranked.length; i += 1) {
      expect(ranked[i]?.chiSquared ?? 0).toBeGreaterThanOrEqual(ranked[i - 1]?.chiSquared ?? 0);
    }
  });
  it('the true key beats the runner-up by a wide margin', () => {
    const [best, second] = rankCaesarCandidates(SAMPLE_CIPHERTEXT);
    expect((second?.chiSquared ?? 0) / (best?.chiSquared ?? 1)).toBeGreaterThan(3);
  });
  it('recovers every one of the 26 Caesar keys on every corpus passage', () => {
    for (const passage of SAMPLE_CORPUS) {
      for (const key of enumerateKeys('caesar')) {
        const top = rankCaesarCandidates(encrypt(passage, key))[0];
        expect(top?.key).toEqual(key);
      }
    }
  });
  it('ranks all 312 affine keys and finds a true affine key on the sample', () => {
    const key = validateKey({ cipher: 'affine', a: 5, b: 8 });
    const ranked = rankAffineCandidates(encrypt(SAMPLE_PLAINTEXT, key));
    expect(ranked).toHaveLength(312);
    expect(ranked[0]?.key).toEqual(key);
    expect(ranked[0]?.plaintextPreview).toBe(SAMPLE_PLAINTEXT.slice(0, 120));
  });
  it('is deterministic', () => {
    expect(rankCaesarCandidates(SAMPLE_CIPHERTEXT)).toEqual(rankCaesarCandidates(SAMPLE_CIPHERTEXT));
  });
  it('throws EmptyText for input without letters', () => {
    expect(codeOf(() => rankCaesarCandidates('1234 !!'))).toBe('EmptyText');
    expect(codeOf(() => rankAffineCandidates(''))).toBe('EmptyText');
  });
});

describe('breakConfidence', () => {
  it('is low under 20 letters whatever the scores', () => {
    expect(MIN_LETTERS_FOR_CONFIDENCE).toBe(20);
    expect(breakConfidence(19, 1, 100)).toBe('low');
  });
  it('depends on how far ahead the winner is', () => {
    expect(breakConfidence(200, 10, 12)).toBe('low');
    expect(breakConfidence(200, 10, 20)).toBe('medium');
    expect(breakConfidence(200, 10, 50)).toBe('high');
  });
  it('handles a perfect fit', () => {
    expect(breakConfidence(200, 0, 5)).toBe('high');
    expect(breakConfidence(200, 0, 0)).toBe('low');
  });
  it('is high for the bundled sample', () => {
    const [best, second] = rankCaesarCandidates(SAMPLE_CIPHERTEXT);
    const total = letterCounts(SAMPLE_CIPHERTEXT).reduce((a, b) => a + b, 0);
    expect(breakConfidence(total, best?.chiSquared ?? 0, second?.chiSquared ?? 0)).toBe('high');
  });
});

describe('candidate state machine', () => {
  const states: CandidateState[] = ['ranked', 'selected', 'rejected'];
  const events: CandidateEvent[] = ['select', 'deselect', 'reject', 'restore', 'select_other'];
  const legal: Record<string, CandidateState> = {
    'ranked:select': 'selected',
    'ranked:reject': 'rejected',
    'selected:deselect': 'ranked',
    'selected:select_other': 'ranked',
    'rejected:restore': 'ranked',
  };
  it('allows exactly the five documented transitions and rejects the other ten', () => {
    let allowed = 0;
    for (const s of states) {
      for (const e of events) {
        const expected = legal[`${s}:${e}`];
        if (expected !== undefined) {
          expect(transitionCandidate(s, e)).toBe(expected);
          allowed += 1;
        } else {
          expect(codeOf(() => transitionCandidate(s, e))).toBe('IllegalTransition');
        }
      }
    }
    expect(allowed).toBe(5);
  });
  it('rejected cannot be selected directly and selected cannot be rejected directly', () => {
    expect(codeOf(() => transitionCandidate('rejected', 'select'))).toBe('IllegalTransition');
    expect(codeOf(() => transitionCandidate('selected', 'reject'))).toBe('IllegalTransition');
  });
  it('unknown states and events are illegal, not crashes', () => {
    expect(codeOf(() => transitionCandidate('weird' as CandidateState, 'select'))).toBe('IllegalTransition');
    expect(codeOf(() => transitionCandidate('ranked', 'toString' as CandidateEvent))).toBe('IllegalTransition');
  });
  it('selectInProfile keeps at most one candidate selected', () => {
    let s: CandidateState[] = ['ranked', 'ranked', 'rejected', 'ranked'];
    s = selectInProfile(s, 0);
    expect(s).toEqual(['selected', 'ranked', 'rejected', 'ranked']);
    s = selectInProfile(s, 3);
    expect(s).toEqual(['ranked', 'ranked', 'rejected', 'selected']);
    expect(selectInProfile(s, 3)).toEqual(s); // idempotent
    expect(codeOf(() => selectInProfile(s, 2))).toBe('IllegalTransition'); // rejected
    expect(codeOf(() => selectInProfile(s, 9))).toBe('IllegalTransition');
    expect(s.filter((x) => x === 'selected')).toHaveLength(1);
  });
});
