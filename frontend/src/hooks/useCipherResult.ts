import { DomainError, decrypt, encrypt, validateKey } from '@cipher-lab/engine';
import type { CipherType, KeySpec, ValidKey } from '@cipher-lab/engine';
import { useEffect, useMemo, useRef } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useCipherStore, type IoMode } from '../state/cipherStore';

export function keySpecOf(cipher: CipherType, shift: number, a: number, b: number, map: string): KeySpec {
  if (cipher === 'caesar') return { cipher, shift };
  if (cipher === 'affine') return { cipher, a, b };
  return { cipher, map };
}

export interface CipherResult {
  readonly mode: IoMode;
  readonly text: string;
  /** The validated key, or null while the typed key is invalid. */
  readonly key: ValidKey | null;
  readonly error: DomainError | null;
  /** Current output, or the last valid output while the key is invalid, so the screen never blanks. */
  readonly output: string;
}

/** Turns the typed text and key into output on every render. No submit step: the maths is instant. */
export function useCipherResult(): CipherResult {
  const { cipher, mode, text, shift, a, b, map } = useCipherStore(
    useShallow((s) => ({ cipher: s.cipher, mode: s.mode, text: s.text, shift: s.shift, a: s.a, b: s.b, map: s.map })),
  );

  const outcome = useMemo(() => {
    try {
      const key = validateKey(keySpecOf(cipher, shift, a, b, map));
      return { key, error: null, output: mode === 'encrypt' ? encrypt(text, key) : decrypt(text, key) };
    } catch (error) {
      if (error instanceof DomainError) return { key: null, error, output: null };
      throw error;
    }
  }, [cipher, mode, text, shift, a, b, map]);

  const lastGood = useRef('');
  useEffect(() => {
    if (outcome.output !== null) lastGood.current = outcome.output;
  }, [outcome.output]);

  return { mode, text, key: outcome.key, error: outcome.error, output: outcome.output ?? lastGood.current };
}
