import { euclidSteps, mod, modInverse, unitsModN } from '@cipher-lab/engine';
import { useState } from 'react';

/** FEAT-005 / DIFF-001: the 12 units mod 26, their inverses, and the Euclidean algorithm behind one of them. */
export function UnitsTable() {
  const [u, setU] = useState(5);
  const steps = euclidSteps(26, u);
  return (
    <section aria-labelledby="units" className="flex flex-col gap-3">
      <h2 id="units" className="text-xl text-fg">
        Units mod 26 and inverses
      </h2>
      <p className="max-w-prose text-sm text-muted">
        a has an inverse mod 26 exactly when gcd(a, 26) = 1. These are the only multipliers an affine cipher can use.
      </p>
      <table className="w-full max-w-md text-left text-sm">
        <caption className="sr-only">Units mod 26 and their multiplicative inverses</caption>
        <thead className="text-xs text-muted">
          <tr>
            <th scope="col">a</th>
            <th scope="col">a⁻¹</th>
            <th scope="col">a · a⁻¹ mod 26</th>
            <th scope="col">
              <span className="sr-only">Show steps</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {unitsModN(26).map((a) => {
            const inv = modInverse(a, 26);
            return (
              <tr key={a} className="border-t border-line">
                <th scope="row" className="py-1 font-normal text-cyan">
                  {a}
                </th>
                <td>{inv}</td>
                <td>{mod(a * inv, 26)}</td>
                <td>
                  <button
                    type="button"
                    aria-pressed={u === a}
                    onClick={() => {
                      setU(a);
                    }}
                    className="rounded-pane border border-line px-2 py-0.5 text-xs text-muted hover:border-cyan aria-pressed:border-cyan aria-pressed:text-cyan"
                  >
                    Euclid steps
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div aria-live="polite" className="rounded-pane border border-line bg-surface p-3 text-sm">
        <p className="mb-2 text-muted">Euclidean algorithm for gcd(26, {u}):</p>
        <ol className="space-y-1">
          {steps.map((s) => (
            <li key={`${s.dividend}-${s.divisor}`}>
              {s.dividend} = {s.quotient} · {s.divisor} + {s.remainder}
            </li>
          ))}
        </ol>
        <p className="mt-2 text-emerald">
          gcd = 1, so {u} · {modInverse(u, 26)} ≡ 1 (mod 26).
        </p>
      </div>
    </section>
  );
}
