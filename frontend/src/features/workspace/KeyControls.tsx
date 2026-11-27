import { unitsModN } from '@cipher-lab/engine';
import type { CipherType } from '@cipher-lab/engine';
import { TriangleAlert } from 'lucide-react';
import { useId } from 'react';
import { useCipherResult } from '../../hooks/useCipherResult';
import { cx } from '../../lib/cx';
import { parseIntField, showInt } from '../../lib/text';
import { useCipherStore } from '../../state/cipherStore';
import { SubstitutionBoard } from './SubstitutionBoard';

const CIPHERS: ReadonlyArray<{ id: CipherType; label: string; formula: string }> = [
  { id: 'caesar', label: 'Caesar', formula: 'E(x) = (x + k) mod 26' },
  { id: 'affine', label: 'Affine', formula: 'E(x) = (a·x + b) mod 26' },
  { id: 'substitution', label: 'Substitution', formula: 'E(x) = key[x]' },
];

const field =
  'w-24 rounded-pane border border-line bg-ink px-3 py-1.5 text-fg aria-[invalid=true]:border-amber focus-visible:border-cyan';

function NumberField({
  id,
  label,
  value,
  onChange,
  invalid,
}: {
  readonly id: string;
  readonly label: string;
  readonly value: number;
  readonly onChange: (n: number) => void;
  readonly invalid: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <label htmlFor={id} className="text-muted">
        {label}
      </label>
      <input
        id={id}
        type="number"
        step={1}
        inputMode="numeric"
        value={showInt(value)}
        aria-invalid={invalid}
        onChange={(e) => {
          onChange(parseIntField(e.target.value));
        }}
        className={field}
      />
    </div>
  );
}

/** Cipher choice and key inputs. Invalid keys are explained in plain words, with the failed condition. */
export function KeyControls() {
  const uid = useId();
  const cipher = useCipherStore((s) => s.cipher);
  const shift = useCipherStore((s) => s.shift);
  const a = useCipherStore((s) => s.a);
  const b = useCipherStore((s) => s.b);
  const map = useCipherStore((s) => s.map);
  const set = useCipherStore();
  const { error } = useCipherResult();
  const bad = error !== null;

  return (
    <div className="flex flex-col gap-3">
      <fieldset className="flex flex-wrap gap-2">
        <legend className="sr-only">Cipher</legend>
        {CIPHERS.map((c) => (
          <label
            key={c.id}
            title={c.formula}
            className={cx(
              'cursor-pointer rounded-pane border px-3 py-1.5 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-cyan',
              cipher === c.id ? 'border-cyan bg-raised text-cyan' : 'border-line text-muted hover:text-fg',
            )}
          >
            <input
              type="radio"
              name={`${uid}-cipher`}
              className="sr-only"
              checked={cipher === c.id}
              onChange={() => {
                set.setCipher(c.id);
              }}
            />
            {c.label}
          </label>
        ))}
      </fieldset>

      <p className="text-xs text-muted">{CIPHERS.find((c) => c.id === cipher)?.formula}</p>

      {cipher === 'caesar' ? (
        <div className="flex flex-wrap items-center gap-4">
          <NumberField id={`${uid}-shift`} label="shift k" value={shift} onChange={set.setShift} invalid={bad} />
          <input
            type="range"
            min={0}
            max={25}
            step={1}
            value={Number.isFinite(shift) ? ((shift % 26) + 26) % 26 : 0}
            onChange={(e) => {
              set.setShift(Number(e.target.value));
            }}
            aria-label="Shift, 0 to 25"
            className="w-40 accent-cyan"
          />
        </div>
      ) : null}

      {cipher === 'affine' ? (
        <>
          <div className="flex flex-wrap items-center gap-4">
            <NumberField id={`${uid}-a`} label="a" value={a} onChange={set.setA} invalid={bad} />
            <NumberField id={`${uid}-b`} label="b" value={b} onChange={set.setB} invalid={false} />
          </div>
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-muted">valid a (units mod 26):</span>
            {unitsModN(26).map((u) => (
              <button
                key={u}
                type="button"
                aria-pressed={a === u}
                onClick={() => {
                  set.setA(u);
                }}
                className="min-w-8 rounded-pane border border-line px-1.5 py-0.5 text-muted hover:text-fg aria-pressed:border-cyan aria-pressed:text-cyan"
              >
                {u}
              </button>
            ))}
          </div>
        </>
      ) : null}

      {cipher === 'substitution' ? (
        <div className="flex flex-col gap-1">
          <label htmlFor={`${uid}-map`} className="text-muted">
            key (26 distinct letters: A maps to the first, B to the second…)
          </label>
          <input
            id={`${uid}-map`}
            type="text"
            value={map}
            spellCheck={false}
            autoCapitalize="characters"
            aria-invalid={bad}
            onChange={(e) => {
              set.setMap(e.target.value.toUpperCase());
            }}
            className={cx(field, 'w-full max-w-xl tracking-widest')}
          />
          <SubstitutionBoard />
        </div>
      ) : null}

      <p aria-live="polite" className="min-h-6 text-sm text-amber">
        {error ? (
          <span className="inline-flex items-start gap-1.5">
            <TriangleAlert aria-hidden="true" className="mt-1 size-4 shrink-0" />
            <span>
              {error.detail || error.code} <span className="text-muted">({error.code})</span>
            </span>
          </span>
        ) : null}
      </p>
    </div>
  );
}
