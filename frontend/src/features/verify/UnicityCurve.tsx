import { SAMPLE_CORPUS, breakSuccessRate, seededRng } from '@cipher-lab/engine';
import type { BreakableCipher } from '@cipher-lab/engine';
import { useState } from 'react';
import { percent } from '../../lib/text';

const LENGTHS = [5, 10, 15, 20, 30, 40, 60, 100] as const;
const TRIALS = 150;
const SEED = 2026;
const W = 480;
const H = 200;

type Curve = Record<BreakableCipher, number[]>;

/** DIFF-006: how often the frequency attack ranks the true key first, as the ciphertext gets longer. Seeded, so repeatable. */
export function UnicityCurve() {
  const [curve, setCurve] = useState<Curve | null>(null);
  const run = () => {
    const rng = seededRng(SEED);
    const one = (c: BreakableCipher) => LENGTHS.map((n) => breakSuccessRate(SAMPLE_CORPUS, c, n, TRIALS, rng));
    setCurve({ caesar: one('caesar'), affine: one('affine') });
  };
  const x = (i: number) => 40 + (i * (W - 56)) / (LENGTHS.length - 1);
  const y = (v: number) => 10 + (H - 40) * (1 - v);
  const line = (vals: number[]) => vals.map((v, i) => `${i === 0 ? 'M' : 'L'}${x(i)},${y(v)}`).join(' ');

  return (
    <section aria-labelledby="uni" className="flex flex-col gap-3">
      <h2 id="uni" className="text-xl text-fg">
        Break success vs ciphertext length
      </h2>
      <p className="max-w-prose text-sm text-muted">
        {TRIALS} random passages per point, seed {SEED}. A hit means the true key was ranked first.
      </p>
      <button
        type="button"
        onClick={run}
        className="self-start rounded-pane border border-line px-3 py-1.5 text-muted hover:border-cyan hover:text-cyan"
      >
        Run experiment
      </button>
      {curve ? (
        <figure>
          <svg
            viewBox={`0 0 ${W} ${H}`}
            role="img"
            aria-label="Success rate rising with ciphertext length for Caesar and affine"
            className="w-full max-w-xl"
          >
            {[0, 0.5, 1].map((t) => (
              <g key={t}>
                <line x1={40} x2={W - 16} y1={y(t)} y2={y(t)} stroke="var(--color-line)" />
                <text
                  x={34}
                  y={y(t)}
                  textAnchor="end"
                  dominantBaseline="central"
                  fontSize={10}
                  fill="var(--color-muted)"
                >
                  {percent(t, 0)}
                </text>
              </g>
            ))}
            {LENGTHS.map((n, i) => (
              <text key={n} x={x(i)} y={H - 18} textAnchor="middle" fontSize={10} fill="var(--color-muted)">
                {n}
              </text>
            ))}
            <text x={W / 2} y={H - 4} textAnchor="middle" fontSize={10} fill="var(--color-muted)">
              ciphertext letters
            </text>
            <path d={line(curve.caesar)} fill="none" stroke="var(--color-cyan)" strokeWidth={2} />
            <path
              d={line(curve.affine)}
              fill="none"
              stroke="var(--color-amber)"
              strokeWidth={2}
              strokeDasharray="5 3"
            />
          </svg>
          <figcaption className="text-xs text-muted">
            <span className="text-cyan">━</span> Caesar <span className="ml-3 text-amber">╌</span> Affine
          </figcaption>
          <table className="mt-3 text-left text-xs">
            <caption className="sr-only">Success rate by ciphertext length</caption>
            <thead>
              <tr>
                <th scope="col" className="pr-4">
                  Letters
                </th>
                <th scope="col" className="pr-4">
                  Caesar
                </th>
                <th scope="col">Affine</th>
              </tr>
            </thead>
            <tbody>
              {LENGTHS.map((n, i) => (
                <tr key={n}>
                  <th scope="row" className="pr-4 font-normal">
                    {n}
                  </th>
                  <td className="pr-4">{percent(curve.caesar[i] ?? 0, 0)}</td>
                  <td>{percent(curve.affine[i] ?? 0, 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </figure>
      ) : null}
    </section>
  );
}
