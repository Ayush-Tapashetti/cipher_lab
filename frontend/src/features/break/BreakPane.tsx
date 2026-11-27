import {
  ENGLISH_FREQ,
  breakConfidence,
  decrypt,
  letterCounts,
  mapLetter,
  relativeFrequencies,
  totalLetters,
} from '@cipher-lab/engine';
import { KeyRound } from 'lucide-react';
import { useMemo } from 'react';
import { cx } from '../../lib/cx';
import { useCipherStore } from '../../state/cipherStore';
import { AnalysisInput } from '../frequency/AnalysisInput';
import { FrequencyChart } from '../frequency/FrequencyChart';
import { CandidateTable } from './CandidateTable';

const btn =
  'inline-flex items-center gap-2 rounded-pane border border-line px-3 py-1.5 text-muted hover:border-cyan hover:text-cyan disabled:opacity-40';

/** FEAT-004 / DIFF-003: score every key against English, rank them, and show the winner's histogram lining up. */
export function BreakPane() {
  const analysis = useCipherStore((s) => s.analysis);
  const cipher = useCipherStore((s) => s.breakCipher);
  const run = useCipherStore((s) => s.breakRun);
  const set = useCipherStore();
  const stale = run !== null && run.ciphertext !== analysis;
  const selIndex = run ? run.statuses.indexOf('selected') : -1;
  const sel = run && selIndex >= 0 ? run.candidates[selIndex] : undefined;
  const best = run?.candidates[0];
  const second = run?.candidates[1];

  const aligned = useMemo(() => {
    if (!run || !sel) return null;
    const counts = letterCounts(run.ciphertext);
    const total = totalLetters(counts);
    const plainCounts = Array.from({ length: 26 }, (_, p) => counts[mapLetter(p, sel.key, 'encrypt')] ?? 0);
    return { rel: relativeFrequencies(plainCounts), total };
  }, [run, sel]);

  const confidence =
    aligned && best && second ? breakConfidence(aligned.total, best.chiSquared, second.chiSquared) : null;

  return (
    <div className="flex flex-col gap-5 p-4 md:p-6">
      <AnalysisInput />
      <div className="flex flex-wrap items-center gap-2">
        <div role="group" aria-label="Cipher to break" className="flex gap-2">
          {(['caesar', 'affine'] as const).map((c) => (
            <button
              key={c}
              type="button"
              aria-pressed={cipher === c}
              onClick={() => {
                set.setBreakCipher(c);
              }}
              className={cx(btn, 'aria-pressed:border-cyan aria-pressed:text-cyan')}
            >
              {c === 'caesar' ? 'Caesar (26 keys)' : 'Affine (312 keys)'}
            </button>
          ))}
        </div>
        <button type="button" className={btn} disabled={analysis.trim() === ''} onClick={set.runBreak}>
          <KeyRound aria-hidden="true" className="size-4" /> Break
        </button>
      </div>

      {run === null ? (
        <p className="text-sm text-muted">
          Load the sample ciphertext and press Break. Every key is scored with χ² = Σ (observed − expected)² / expected
          against English.
        </p>
      ) : (
        <>
          {stale ? (
            <p role="status" className="text-sm text-amber">
              The text changed since this run. Press Break again.
            </p>
          ) : null}
          {aligned ? (
            <FrequencyChart
              title="Ciphertext decrypted with the selected key"
              observed={aligned.rel}
              reference={ENGLISH_FREQ}
              observedLabel="decrypted with selected key"
            />
          ) : (
            <p className="text-sm text-muted">Select a key to see its histogram against English.</p>
          )}
          <CandidateTable />
          {sel && confidence ? (
            <section
              aria-labelledby="recovered"
              className="flex flex-col gap-2 rounded-pane border border-line bg-ink p-3"
            >
              <h3 id="recovered" className="text-muted">
                Recovered plaintext · confidence{' '}
                <span
                  className={
                    confidence === 'high' ? 'text-emerald' : confidence === 'medium' ? 'text-amber' : 'text-danger'
                  }
                >
                  {confidence}
                </span>
              </h3>
              <p className="max-h-40 overflow-auto whitespace-pre-wrap break-words text-emerald">
                {decrypt(run.ciphertext, sel.key)}
              </p>
              <button
                type="button"
                className={cx(btn, 'self-start')}
                onClick={() => {
                  set.applyKey(sel.key);
                  set.setText(run.ciphertext);
                  set.setMode('decrypt');
                }}
              >
                Use this key in Input / Output
              </button>
            </section>
          ) : null}
        </>
      )}
    </div>
  );
}
