import { SAMPLE_CAESAR_SHIFT, SAMPLE_CIPHERTEXT } from '@cipher-lab/engine';
import { beforeEach, describe, expect, it } from 'vitest';
import { IDENTITY_MAP, MAX_TEXT, useCipherStore } from './cipherStore';

const get = () => useCipherStore.getState();

beforeEach(() => {
  useCipherStore.setState({ analysis: '', breakRun: null, breakCipher: 'caesar', text: '' });
});

describe('cipher store', () => {
  it('clips pasted text at the limit', () => {
    get().setText('A'.repeat(MAX_TEXT + 500));
    expect(get().text).toHaveLength(MAX_TEXT);
    get().setAnalysis('B'.repeat(MAX_TEXT + 1));
    expect(get().analysis).toHaveLength(MAX_TEXT);
  });

  it('break on the sample ranks the true Caesar key first and selects it', () => {
    get().loadSampleCiphertext();
    expect(get().analysis).toBe(SAMPLE_CIPHERTEXT);
    get().runBreak();
    const run = get().breakRun;
    expect(run?.candidates).toHaveLength(26);
    const top = run?.candidates[0]?.key;
    expect(top?.cipher === 'caesar' && top.shift).toBe(SAMPLE_CAESAR_SHIFT);
    expect(run?.statuses[0]).toBe('selected');
    expect(run?.statuses.filter((s) => s === 'selected')).toHaveLength(1);
  });

  it('affine break ranks all 312 keys', () => {
    get().loadSampleCiphertext();
    get().setBreakCipher('affine');
    get().runBreak();
    expect(get().breakRun?.candidates).toHaveLength(312);
  });

  it('selecting another candidate moves the selection; rejected ones cannot be selected', () => {
    get().loadSampleCiphertext();
    get().runBreak();
    get().selectCandidate(3);
    expect(get().breakRun?.statuses[3]).toBe('selected');
    expect(get().breakRun?.statuses[0]).toBe('ranked');
    get().toggleReject(5);
    get().selectCandidate(5);
    expect(get().breakRun?.statuses[5]).toBe('rejected');
    get().toggleReject(5);
    expect(get().breakRun?.statuses[5]).toBe('ranked');
  });

  it('rejecting the selected candidate deselects it first', () => {
    get().loadSampleCiphertext();
    get().runBreak();
    get().toggleReject(0);
    expect(get().breakRun?.statuses[0]).toBe('rejected');
    expect(get().breakRun?.statuses.filter((s) => s === 'selected')).toHaveLength(0);
  });

  it('break on empty text clears the run instead of throwing', () => {
    get().setAnalysis('');
    expect(() => {
      get().runBreak();
    }).not.toThrow();
    expect(get().breakRun).toBeNull();
  });

  it('each run gets a new id so the chart can replay', () => {
    get().loadSampleCiphertext();
    get().runBreak();
    const first = get().breakRun?.runId ?? 0;
    get().runBreak();
    expect(get().breakRun?.runId).toBe(first + 1);
  });

  it('applyKey writes the recovered key into the matching fields', () => {
    get().loadSampleCiphertext();
    get().runBreak();
    const key = get().breakRun?.candidates[0]?.key;
    if (!key) throw new Error('no candidate');
    get().applyKey(key);
    expect(get().cipher).toBe('caesar');
    expect(get().shift).toBe(SAMPLE_CAESAR_SHIFT);
  });

  it('identity map is the 26 letters in order', () => {
    expect(IDENTITY_MAP).toBe('ABCDEFGHIJKLMNOPQRSTUVWXYZ');
  });
});
