import { Copy, FileText, Send } from 'lucide-react';
import { useEffect, useId, useRef } from 'react';
import { copyToClipboard, notify } from '../../components/adapters/notify';
import { useCipherResult } from '../../hooks/useCipherResult';
import { countLetters } from '../../lib/text';
import { MAX_TEXT, useCipherStore } from '../../state/cipherStore';
import { KeyControls } from './KeyControls';

const button =
  'inline-flex items-center gap-2 rounded-pane border border-line px-3 py-1.5 text-muted hover:border-cyan hover:text-cyan disabled:cursor-not-allowed disabled:opacity-40';

/** FEAT-001 / FEAT-002: type text, pick a cipher and a key, and the other side updates on every keystroke. */
export function IoPane() {
  const uid = useId();
  const area = useRef<HTMLTextAreaElement>(null);
  const text = useCipherStore((s) => s.text);
  const mode = useCipherStore((s) => s.mode);
  const set = useCipherStore();
  const { output, error } = useCipherResult();
  const encrypting = mode === 'encrypt';

  useEffect(() => {
    area.current?.focus(); // the cursor is already in the box when the workspace opens
  }, []);

  return (
    <div className="flex flex-col gap-5 p-4 md:p-6">
      <KeyControls />

      <div className="flex flex-wrap gap-2" role="group" aria-label="Direction">
        {(['encrypt', 'decrypt'] as const).map((m) => (
          <button
            key={m}
            type="button"
            aria-pressed={mode === m}
            onClick={() => {
              set.setMode(m);
            }}
            className={`${button} aria-pressed:border-cyan aria-pressed:text-cyan`}
          >
            {m === 'encrypt' ? 'Encrypt' : 'Decrypt'}
          </button>
        ))}
        <button type="button" className={button} onClick={set.loadSamplePlaintext}>
          <FileText aria-hidden="true" className="size-4" /> Load sample text
        </button>
        <button
          type="button"
          className={button}
          onClick={() => {
            set.setText('');
          }}
          disabled={text === ''}
        >
          Clear
        </button>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor={`${uid}-in`} className="text-muted">
          {encrypting ? 'Plaintext' : 'Ciphertext'}
        </label>
        <textarea
          id={`${uid}-in`}
          ref={area}
          value={text}
          rows={5}
          maxLength={MAX_TEXT}
          spellCheck={false}
          placeholder="Type or paste here. Press Esc to leave the box and use the pane keys."
          onChange={(e) => {
            set.setText(e.target.value);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') e.currentTarget.blur();
          }}
          className="min-h-32 w-full resize-y rounded-pane border border-line bg-ink p-3 text-lg text-fg focus-visible:border-cyan"
        />
        <p className="text-xs text-muted">{countLetters(text)} letters · other characters pass through unchanged</p>
      </div>

      <div className="flex flex-col gap-2">
        <h3 id={`${uid}-out`} className="text-muted">
          {encrypting ? 'Ciphertext' : 'Plaintext'}
          {error ? <span className="ml-2 text-xs text-amber">(last valid result)</span> : null}
        </h3>
        <output
          aria-labelledby={`${uid}-out`}
          className="block min-h-32 whitespace-pre-wrap break-words rounded-pane border border-line bg-surface p-3 text-lg text-emerald"
        >
          {output}
        </output>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className={button}
            disabled={output === ''}
            onClick={() => void copyToClipboard(output, encrypting ? 'Ciphertext' : 'Plaintext')}
          >
            <Copy aria-hidden="true" className="size-4" /> Copy
          </button>
          <button
            type="button"
            className={button}
            disabled={output === '' || !encrypting}
            title={
              encrypting
                ? 'Send this ciphertext to the Frequency and Break panes'
                : 'Switch to Encrypt to send ciphertext for analysis'
            }
            onClick={() => {
              set.setAnalysis(output);
              notify('Sent to Frequency and Break');
            }}
          >
            <Send aria-hidden="true" className="size-4" /> Send to analysis
          </button>
        </div>
      </div>
    </div>
  );
}
