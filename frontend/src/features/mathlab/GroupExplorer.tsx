import { cayleyTable, elementOrder, generators, orbit, unitsModN } from '@cipher-lab/engine';
import type { GroupOp } from '@cipher-lab/engine';
import { useState } from 'react';
import { cx } from '../../lib/cx';

/** DIFF-004: Z26 under + and its units under ×, with orbits, orders, generators and the Cayley table. */
export function GroupExplorer() {
  const [op, setOp] = useState<GroupOp>('add');
  const elements = op === 'add' ? Array.from({ length: 26 }, (_, i) => i) : unitsModN(26);
  const [a, setA] = useState(7);
  const chosen = elements.includes(a) ? a : (elements[1] ?? 1);
  const orb = orbit(chosen, 26, op);
  const gens = generators(26, op);
  const table = cayleyTable(elements, 26, op);
  const sym = op === 'add' ? '+' : '×';

  return (
    <section aria-labelledby="group" className="flex flex-col gap-3">
      <h2 id="group" className="text-xl text-fg">
        Group explorer
      </h2>
      <div role="group" aria-label="Group operation" className="flex gap-2">
        {(['add', 'mul'] as const).map((o) => (
          <button
            key={o}
            type="button"
            aria-pressed={op === o}
            onClick={() => {
              setOp(o);
            }}
            className="rounded-pane border border-line px-3 py-1.5 text-sm text-muted hover:border-cyan aria-pressed:border-cyan aria-pressed:text-cyan"
          >
            {o === 'add' ? '(Z26, +)  Caesar shifts' : '(Z26*, ×)  affine multipliers'}
          </button>
        ))}
      </div>
      <p className="text-sm text-muted">
        {op === 'add'
          ? 'Z26 under addition is cyclic of order 26: every unit generates it.'
          : `The ${elements.length} units form a group under multiplication. It is cyclic here, with generators ${gens.join(', ')}.`}
      </p>
      <div className="flex flex-wrap gap-1" role="group" aria-label="Choose an element">
        {elements.map((e) => (
          <button
            key={e}
            type="button"
            aria-pressed={chosen === e}
            onClick={() => {
              setA(e);
            }}
            className="min-w-8 rounded-pane border border-line px-1.5 py-0.5 text-xs text-muted hover:text-fg aria-pressed:border-cyan aria-pressed:text-cyan"
          >
            {e}
          </button>
        ))}
      </div>
      <p aria-live="polite" className="text-sm">
        Order of {chosen} is <span className="text-cyan">{elementOrder(chosen, 26, op)}</span>. Orbit: {orb.join(' → ')}
      </p>
      {/* A scrollable region must be keyboard-focusable (axe: scrollable-region-focusable). */}
      <div
        // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
        tabIndex={0}
        role="region"
        aria-label="Cayley table, scrollable"
        className="max-h-96 overflow-auto rounded-pane border border-line focus-visible:border-cyan"
      >
        <table className="border-collapse text-center text-xs">
          <caption className="sr-only">Cayley table of the group</caption>
          <thead>
            <tr>
              <th scope="col" className="sticky top-0 bg-surface px-1.5 py-1 text-muted">
                {sym}
              </th>
              {elements.map((e) => (
                <th key={e} scope="col" className="sticky top-0 bg-surface px-1.5 py-1 text-muted">
                  {e}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {table.map((row, i) => (
              <tr key={elements[i]}>
                <th scope="row" className="sticky left-0 bg-surface px-1.5 py-1 text-muted">
                  {elements[i]}
                </th>
                {row.map((v, j) => (
                  <td
                    key={elements[j]}
                    className={cx('px-1.5 py-1', v === (op === 'add' ? 0 : 1) ? 'bg-raised text-emerald' : 'text-fg')}
                  >
                    {v}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted">
        Highlighted cells are the identity ({op === 'add' ? '0' : '1'}). Each row and each column contains every element
        exactly once.
      </p>
    </section>
  );
}
