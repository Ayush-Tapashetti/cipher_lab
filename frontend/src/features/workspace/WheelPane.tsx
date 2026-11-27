import { ALPHABET, traceCipher } from '@cipher-lab/engine';
import { useCipherResult } from '../../hooks/useCipherResult';
import { lastLetter } from '../../lib/text';
import { useCipherStore } from '../../state/cipherStore';
import { CipherWheel } from './CipherWheel';

/** FEAT-001 signature interaction: type text and watch the wheel turn to the letter you just typed. */
export function WheelPane() {
  const { key, mode, text, error } = useCipherResult();
  const setShift = useCipherStore((s) => s.setShift);
  const letter = lastLetter(text);
  const row = key && letter ? traceCipher(letter, key, mode)[0] : undefined;

  if (!key) {
    return (
      <div className="p-6 text-sm text-amber" role="status">
        The wheel needs a valid key. {error?.detail ?? 'Fix the key in Input / Output.'}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6">
      <CipherWheel keySpec={key} highlight={letter} direction={mode} onShift={setShift} />
      <p aria-live="polite" className="min-h-12 text-center text-sm">
        {row ? (
          <>
            <span className="text-cyan">{row.char.toUpperCase()}</span> = {row.x} → {row.formula}
            {key.cipher === 'substitution' ? '' : ` = ${row.reduced}`} →{' '}
            <span className="text-emerald">{ALPHABET.charAt(row.reduced)}</span>
          </>
        ) : (
          <span className="text-muted">Type a letter in Input / Output to see it travel across the wheel.</span>
        )}
      </p>
      {key.cipher === 'caesar' ? (
        <p className="text-center text-xs text-muted">Drag the ring, or focus it and use ← → (Shift for ±5).</p>
      ) : null}
    </div>
  );
}
