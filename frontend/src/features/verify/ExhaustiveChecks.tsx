import { runExhaustiveChecks } from '@cipher-lab/engine';
import type { CheckReport } from '@cipher-lab/engine';
import { useState } from 'react';

/** DIFF-002: run every round-trip check in the browser and show the counts as evidence. */
export function ExhaustiveChecks() {
  const [report, setReport] = useState<CheckReport | null>(null);
  return (
    <section aria-labelledby="exh" className="flex flex-col gap-3">
      <h2 id="exh" className="text-xl text-fg">
        Exhaustive checks
      </h2>
      <p className="max-w-prose text-sm text-muted">
        Decrypts every encryption under every Caesar and affine key and checks the key validators. Nothing is sampled.
      </p>
      <button
        type="button"
        onClick={() => {
          setReport(runExhaustiveChecks());
        }}
        className="self-start rounded-pane border border-line px-3 py-1.5 text-muted hover:border-cyan hover:text-cyan"
      >
        Run all checks
      </button>
      <div aria-live="polite">
        {report ? (
          <>
            <p className={report.allPassed ? 'text-emerald' : 'text-danger'}>
              {report.passed} / {report.total} passed
            </p>
            <ul className="mt-2 space-y-1 text-sm">
              {report.checks.map((c) => (
                <li key={c.id}>
                  <span className={c.passed === c.total ? 'text-emerald' : 'text-danger'}>
                    {c.passed}/{c.total}
                  </span>{' '}
                  <span className="text-muted">{c.description}</span>
                </li>
              ))}
            </ul>
          </>
        ) : null}
      </div>
    </section>
  );
}
