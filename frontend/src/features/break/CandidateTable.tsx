import type { ValidBreakableKey } from '@cipher-lab/engine';
import { useState } from 'react';
import { cx } from '../../lib/cx';
import { useCipherStore } from '../../state/cipherStore';

const keyText = (k: ValidBreakableKey): string => (k.cipher === 'caesar' ? `k = ${k.shift}` : `a = ${k.a}, b = ${k.b}`);

const small =
  'rounded-pane border border-line px-2 py-0.5 text-xs text-muted hover:border-cyan hover:text-cyan aria-pressed:border-cyan aria-pressed:text-cyan';

/** Ranked keys with their chi-squared score. Select one to preview it, or reject keys you have ruled out. */
export function CandidateTable() {
  const run = useCipherStore((s) => s.breakRun);
  const select = useCipherStore((s) => s.selectCandidate);
  const reject = useCipherStore((s) => s.toggleReject);
  const [all, setAll] = useState(false);
  if (!run) return null;
  const rows = run.candidates.map((c, i) => ({ c, i })).slice(0, all ? undefined : 8);

  return (
    <div className="flex flex-col gap-2">
      <table className="w-full text-left text-sm">
        <caption className="sr-only">Candidate keys ranked by chi-squared, lowest first</caption>
        <thead className="text-xs text-muted">
          <tr>
            <th scope="col" className="py-1 pr-2">
              #
            </th>
            <th scope="col" className="pr-2">
              Key
            </th>
            <th scope="col" className="pr-2">
              χ²
            </th>
            <th scope="col" className="pr-2">
              Preview
            </th>
            <th scope="col">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ c, i }) => {
            const st = run.statuses[i];
            return (
              <tr
                key={c.rank}
                className={cx(
                  'border-t border-line',
                  st === 'selected' && 'bg-raised',
                  st === 'rejected' && 'opacity-50',
                )}
              >
                <td className="py-1.5 pr-2 text-muted">{c.rank}</td>
                <td className="pr-2">{keyText(c.key)}</td>
                <td className="pr-2">{c.chiSquared.toFixed(1)}</td>
                <td className="max-w-40 truncate pr-2 text-muted" title={c.plaintextPreview}>
                  {c.plaintextPreview}
                </td>
                <td className="whitespace-nowrap">
                  <button
                    type="button"
                    className={small}
                    aria-pressed={st === 'selected'}
                    disabled={st === 'rejected'}
                    onClick={() => {
                      select(i);
                    }}
                  >
                    {st === 'selected' ? 'Selected' : 'Select'}
                  </button>{' '}
                  <button
                    type="button"
                    className={small}
                    aria-pressed={st === 'rejected'}
                    onClick={() => {
                      reject(i);
                    }}
                  >
                    {st === 'rejected' ? 'Restore' : 'Reject'}
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {run.candidates.length > 8 ? (
        <button
          type="button"
          className={small}
          onClick={() => {
            setAll(!all);
          }}
        >
          {all ? 'Show top 8' : `Show all ${run.candidates.length}`}
        </button>
      ) : null}
    </div>
  );
}
