import {
  DomainError,
  SAMPLE_CIPHERTEXT,
  SAMPLE_PLAINTEXT,
  rankAffineCandidates,
  rankCaesarCandidates,
  selectInProfile,
  transitionCandidate,
} from '@cipher-lab/engine';
import type {
  BreakCandidateData,
  BreakableCipher,
  CandidateState,
  CipherType,
  ValidBreakableKey,
} from '@cipher-lab/engine';
import { create } from 'zustand';

export type IoMode = 'encrypt' | 'decrypt';
export const MAX_TEXT = 50_000;
export const IDENTITY_MAP = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

/** The outcome of one "Break" press: every candidate key, ranked, with the state of each. */
export interface BreakRun {
  readonly cipher: BreakableCipher;
  readonly ciphertext: string;
  readonly candidates: readonly BreakCandidateData[];
  readonly statuses: readonly CandidateState[];
  /** Increases on every run; the chart replays its alignment animation when it changes. */
  readonly runId: number;
}

interface CipherStore {
  readonly cipher: CipherType;
  readonly mode: IoMode;
  readonly text: string;
  /** Key fields hold raw user input (possibly NaN or invalid); validateKey decides whether they are usable. */
  readonly shift: number;
  readonly a: number;
  readonly b: number;
  readonly map: string;
  /** Ciphertext being analysed by the Frequency and Break panes. */
  readonly analysis: string;
  readonly breakCipher: BreakableCipher;
  readonly breakRun: BreakRun | null;
  setCipher: (cipher: CipherType) => void;
  setMode: (mode: IoMode) => void;
  setText: (text: string) => void;
  setShift: (shift: number) => void;
  setA: (a: number) => void;
  setB: (b: number) => void;
  setMap: (map: string) => void;
  setAnalysis: (analysis: string) => void;
  loadSamplePlaintext: () => void;
  loadSampleCiphertext: () => void;
  setBreakCipher: (cipher: BreakableCipher) => void;
  runBreak: () => void;
  selectCandidate: (index: number) => void;
  toggleReject: (index: number) => void;
  applyKey: (key: ValidBreakableKey) => void;
}

const clip = (text: string): string => text.slice(0, MAX_TEXT);

export const useCipherStore = create<CipherStore>((set, get) => ({
  cipher: 'caesar',
  mode: 'encrypt',
  text: 'Attack at dawn',
  shift: 3,
  a: 5,
  b: 8,
  map: 'QWERTYUIOPASDFGHJKLZXCVBNM',
  analysis: '',
  breakCipher: 'caesar',
  breakRun: null,

  setCipher: (cipher) => set({ cipher }),
  setMode: (mode) => set({ mode }),
  setText: (text) => set({ text: clip(text) }),
  setShift: (shift) => set({ shift }),
  setA: (a) => set({ a }),
  setB: (b) => set({ b }),
  setMap: (map) => set({ map: map.slice(0, 40) }),
  setAnalysis: (analysis) => set({ analysis: clip(analysis) }),
  loadSamplePlaintext: () => set({ text: SAMPLE_PLAINTEXT, mode: 'encrypt' }),
  loadSampleCiphertext: () => set({ analysis: SAMPLE_CIPHERTEXT, breakRun: null }),
  setBreakCipher: (breakCipher) => set({ breakCipher, breakRun: null }),

  runBreak: () => {
    const { analysis, breakCipher, breakRun } = get();
    try {
      const candidates = breakCipher === 'caesar' ? rankCaesarCandidates(analysis) : rankAffineCandidates(analysis);
      const ranked: CandidateState[] = candidates.map(() => 'ranked');
      set({
        breakRun: {
          cipher: breakCipher,
          ciphertext: analysis,
          candidates,
          statuses: selectInProfile(ranked, 0),
          runId: (breakRun?.runId ?? 0) + 1,
        },
      });
    } catch (error) {
      if (error instanceof DomainError && error.code === 'EmptyText') {
        set({ breakRun: null });
        return;
      }
      throw error;
    }
  },

  selectCandidate: (index) => {
    const run = get().breakRun;
    if (!run) return;
    try {
      set({ breakRun: { ...run, statuses: selectInProfile(run.statuses, index) } });
    } catch (error) {
      if (!(error instanceof DomainError)) throw error; // a rejected candidate cannot be selected: ignore
    }
  },

  toggleReject: (index) => {
    const run = get().breakRun;
    const current = run?.statuses[index];
    if (!run || current === undefined) return;
    const next = [...run.statuses];
    if (current === 'rejected') {
      next[index] = transitionCandidate('rejected', 'restore');
    } else {
      const ranked = current === 'selected' ? transitionCandidate('selected', 'deselect') : current;
      next[index] = transitionCandidate(ranked, 'reject');
    }
    set({ breakRun: { ...run, statuses: next } });
  },

  applyKey: (key) => {
    if (key.cipher === 'caesar') set({ cipher: 'caesar', shift: key.shift });
    else set({ cipher: 'affine', a: key.a, b: key.b });
  },
}));
