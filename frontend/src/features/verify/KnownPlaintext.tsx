import { DomainError, solveAffineFromPairs } from '@cipher-lab/engine';
import type { AffineSolution } from '@cipher-lab/engine';
import { useId, useMemo, useState } from 'react';

const box =
  'w-12 rounded-pane border border-line bg-ink px-2 py-1 text-center uppercase text-fg focus-visible:border-cyan';

/** DIFF-005: two known letter pairs give a(x1 - x2) = y1 - y2 (mod 26); solve for the affine key. */
export function KnownPlaintext() {
  const uid = useId();
  const [v, setV] = useState({ p1: 'E', c1: 'X', p2: 'T', c2: 'M' });
  const result = useMemo((): { keys: AffineSolution[] } | { error: string } => {
    try {
      return { keys: solveAffineFromPairs({ plain: v.p1, cipher: v.c1 }, { plain: v.p2, cipher: v.c2 }) };
    } catch (e) {
      if (e instanceof DomainError) return { error: `${e.detail || e.code} (${e.code})` };
      throw e;
    }
  }, [v]);
  const field = (k: keyof typeof v, label: string) => (
    <div className="flex items-center gap-1">
      <label htmlFor={`${uid}-${k}`} className="text-xs text-muted">
        {label}
      </label>
      <input
        id={`${uid}-${k}`}
        value={v[k]}
        maxLength={1}
        className={box}
        onChange={(e) => {
          setV({ ...v, [k]: e.target.value });
        }}
      />
    </div>
  );
  return (
    <section aria-labelledby="kp" className="flex flex-col gap-3">
      <h2 id="kp" className="text-xl text-fg">
        Known-plaintext attack
      </h2>
      <p className="max-w-prose text-sm text-muted">
        If you know two plaintext letters and what they became, a(x₁ − x₂) ≡ (y₁ − y₂) (mod 26) gives a, and then b = y₁
        − a·x₁.
      </p>
      <div className="flex flex-wrap gap-4">
        {field('p1', 'plain 1')}
        {field('c1', 'cipher 1')}
        {field('p2', 'plain 2')}
        {field('c2', 'cipher 2')}
      </div>
      <p aria-live="polite" className="text-sm">
        {'keys' in result ? (
          <span className="text-emerald">
            Key{result.keys.length > 1 ? 's' : ''}: {result.keys.map((k) => `a = ${k.a}, b = ${k.b}`).join(' or ')}
          </span>
        ) : (
          <span className="text-amber">{result.error}</span>
        )}
      </p>
    </section>
  );
}
