import { FileText } from 'lucide-react';
import { useId } from 'react';
import { countLetters } from '../../lib/text';
import { MAX_TEXT, useCipherStore } from '../../state/cipherStore';

const btn =
  'inline-flex items-center gap-2 rounded-pane border border-line px-3 py-1.5 text-xs text-muted hover:border-cyan hover:text-cyan disabled:opacity-40';

/** Shared ciphertext box for the Frequency and Break panes. */
export function AnalysisInput() {
  const id = useId();
  const analysis = useCipherStore((s) => s.analysis);
  const set = useCipherStore();
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-muted">
        Ciphertext to analyse
      </label>
      <textarea
        id={id}
        value={analysis}
        rows={4}
        maxLength={MAX_TEXT}
        spellCheck={false}
        onChange={(e) => {
          set.setAnalysis(e.target.value);
        }}
        placeholder="Paste ciphertext, or load the sample."
        className="w-full resize-y rounded-pane border border-line bg-ink p-3 text-fg focus-visible:border-cyan"
      />
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" className={btn} onClick={set.loadSampleCiphertext}>
          <FileText aria-hidden="true" className="size-4" /> Load sample ciphertext
        </button>
        <button
          type="button"
          className={btn}
          onClick={() => {
            set.setAnalysis('');
          }}
          disabled={analysis === ''}
        >
          Clear
        </button>
        <span className="text-xs text-muted">{countLetters(analysis)} letters</span>
      </div>
    </div>
  );
}
