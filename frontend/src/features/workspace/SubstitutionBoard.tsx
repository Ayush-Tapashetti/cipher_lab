import { ALPHABET } from '@cipher-lab/engine';
import { useState } from 'react';
import { cx } from '../../lib/cx';
import { IDENTITY_MAP, useCipherStore } from '../../state/cipherStore';

const isPermutation = (m: string): boolean => m.length === 26 && new Set(m).size === 26 && /^[A-Z]{26}$/.test(m);

function shuffled(): string {
  const a = IDENTITY_MAP.split('');
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j] as string, a[i] as string];
  }
  return a.join('');
}

/** Click two cells to swap their letters, so the key stays a valid permutation at every step. */
export function SubstitutionBoard() {
  const map = useCipherStore((s) => s.map);
  const setMap = useCipherStore((s) => s.setMap);
  const [picked, setPicked] = useState<number | null>(null);
  const ok = isPermutation(map);

  const click = (i: number) => {
    if (picked === null) {
      setPicked(i);
      return;
    }
    if (picked !== i) {
      const a = map.split('');
      [a[picked], a[i]] = [a[i] as string, a[picked] as string];
      setMap(a.join(''));
    }
    setPicked(null);
  };

  const btn = 'rounded-pane border border-line px-3 py-1 text-xs text-muted hover:border-cyan hover:text-cyan';
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className={btn}
          onClick={() => {
            setMap(IDENTITY_MAP);
            setPicked(null);
          }}
        >
          Reset (identity)
        </button>
        <button
          type="button"
          className={btn}
          onClick={() => {
            setMap(shuffled());
            setPicked(null);
          }}
        >
          Random
        </button>
        <button
          type="button"
          className={btn}
          onClick={() => {
            setMap([...IDENTITY_MAP].reverse().join(''));
            setPicked(null);
          }}
        >
          Reverse
        </button>
      </div>
      {ok ? (
        <ul className="flex flex-wrap gap-1" aria-label="Substitution key. Pick two cells to swap them.">
          {ALPHABET.split('').map((p, i) => (
            <li key={p}>
              <button
                type="button"
                aria-pressed={picked === i}
                aria-label={`${p} maps to ${map.charAt(i)}${picked === null ? '' : ', swap with selected'}`}
                onClick={() => {
                  click(i);
                }}
                className={cx(
                  'flex w-8 flex-col items-center rounded-pane border py-1 text-xs',
                  picked === i ? 'border-amber bg-raised' : 'border-line hover:border-cyan',
                )}
              >
                <span className="text-muted">{p}</span>
                <span className="text-emerald">{map.charAt(i)}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-muted">The board returns when the key above has 26 distinct letters.</p>
      )}
    </div>
  );
}
