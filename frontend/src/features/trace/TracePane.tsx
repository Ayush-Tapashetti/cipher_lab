import { decrypt, encrypt, traceCipher } from '@cipher-lab/engine';
import { useMemo } from 'react';
import { useCipherResult } from '../../hooks/useCipherResult';

const LIMIT = 100;

/** FEAT-005 / DIFF-001: every letter as arithmetic, checked against the real output. */
export function TracePane() {
  const { key, mode, text, error } = useCipherResult();
  const data = useMemo(() => {
    if (!key) return null;
    const rows = traceCipher(text, key, mode);
    const joined = rows.map((r) => r.out).join('');
    const expected = (mode === 'encrypt' ? encrypt(text, key) : decrypt(text, key)).replace(/[^A-Za-z]/g, '');
    return { rows, match: joined === expected };
  }, [key, mode, text]);

  if (!data)
    return (
      <p role="status" className="p-6 text-sm text-amber">
        A trace needs a valid key. {error?.detail}
      </p>
    );
  if (data.rows.length === 0)
    return <p className="p-6 text-sm text-muted">Type some letters in Input / Output to see the arithmetic.</p>;

  return (
    <div className="flex flex-col gap-3 p-4 md:p-6">
      <p aria-live="polite" className={data.match ? 'text-sm text-emerald' : 'text-sm text-danger'}>
        {data.match
          ? `Trace check: all ${data.rows.length} outputs equal the cipher's output.`
          : 'Trace check FAILED: the trace disagrees with the cipher output.'}
      </p>
      <table className="w-full text-left text-sm">
        <caption className="sr-only">Step-by-step arithmetic for each letter</caption>
        <thead className="text-xs text-muted">
          <tr>
            <th scope="col">Letter</th>
            <th scope="col">x</th>
            <th scope="col">Formula</th>
            <th scope="col">Value</th>
            <th scope="col">mod 26</th>
            <th scope="col">Out</th>
          </tr>
        </thead>
        <tbody>
          {data.rows.slice(0, LIMIT).map((r) => (
            <tr key={r.position} className="border-t border-line">
              <th scope="row" className="py-1 font-normal text-cyan">
                {r.char}
              </th>
              <td>{r.x}</td>
              <td className="text-muted">{r.formula}</td>
              <td>{r.unreduced}</td>
              <td>{r.reduced}</td>
              <td className="text-emerald">{r.out}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {data.rows.length > LIMIT ? (
        <p className="text-xs text-muted">
          Showing the first {LIMIT} of {data.rows.length} letters.
        </p>
      ) : null}
    </div>
  );
}
