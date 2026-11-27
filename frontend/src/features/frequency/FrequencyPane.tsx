import {
  ENGLISH_FREQ,
  ENGLISH_IC,
  indexOfCoincidence,
  letterCounts,
  relativeFrequencies,
  totalLetters,
} from '@cipher-lab/engine';
import { useMemo } from 'react';
import { ChartColumn } from 'lucide-react';
import { EmptyState } from '../../components/ui/states';
import { useCipherStore } from '../../state/cipherStore';
import { AnalysisInput } from './AnalysisInput';
import { FrequencyChart } from './FrequencyChart';

/** FEAT-003: letter frequencies of the ciphertext beside English, with the index of coincidence. */
export function FrequencyPane() {
  const analysis = useCipherStore((s) => s.analysis);
  const stats = useMemo(() => {
    const counts = letterCounts(analysis);
    const total = totalLetters(counts);
    return { counts, total, rel: relativeFrequencies(counts), ic: indexOfCoincidence(counts) };
  }, [analysis]);

  return (
    <div className="flex flex-col gap-5 p-4 md:p-6">
      <AnalysisInput />
      {stats.total === 0 ? (
        <EmptyState icon={ChartColumn} title="No letters yet">
          <p>Paste ciphertext above, or load the sample, to see its letter frequencies.</p>
        </EmptyState>
      ) : (
        <>
          <FrequencyChart
            title="Letter frequencies"
            observed={stats.rel}
            reference={ENGLISH_FREQ}
            observedLabel="ciphertext"
          />
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-muted">Index of coincidence</dt>
              <dd className="text-lg text-cyan">{stats.ic === null ? 'needs 2+ letters' : stats.ic.toFixed(4)}</dd>
            </div>
            <div>
              <dt className="text-muted">English / random</dt>
              <dd className="text-lg">{ENGLISH_IC.toFixed(3)} / 0.038</dd>
            </div>
          </dl>
          <p className="text-xs text-muted">
            A shift or affine map only relabels letters, so the IC stays near English (0.066). A flat histogram near
            0.038 would mean a stronger cipher.
          </p>
        </>
      )}
    </div>
  );
}
