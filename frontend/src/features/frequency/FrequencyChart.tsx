import { ALPHABET } from '@cipher-lab/engine';
import { motion } from 'motion/react';
import { DURATION, EASE_OUT, useMotionPrefs } from '../../motion/motion';
import { percent } from '../../lib/text';

interface FrequencyChartProps {
  /** Relative frequency (0..1) of each letter A..Z in the text. */
  readonly observed: readonly number[];
  readonly reference: readonly number[];
  readonly observedLabel: string;
  readonly title: string;
}

const W = 520;
const H = 220;
const PAD = { l: 40, r: 8, t: 10, b: 28 };

/** Histogram of observed letter frequencies with English as an outline. Axes labelled, text table underneath. */
export function FrequencyChart({ observed, reference, observedLabel, title }: FrequencyChartProps) {
  const { seconds } = useMotionPrefs();
  // A tween, not a spring: a spring overshoots and briefly gives a bar a negative height.
  const barTransition = { duration: seconds(DURATION.slide), ease: EASE_OUT };
  const max = Math.max(0.14, ...observed, ...reference);
  const top = Math.ceil(max * 50) / 50;
  const bw = (W - PAD.l - PAD.r) / 26;
  const y = (v: number) => PAD.t + (H - PAD.t - PAD.b) * (1 - v / top);
  const ticks = [0, top / 2, top];

  return (
    <figure className="flex flex-col gap-3">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={`${title}: ${observedLabel} against English letter frequencies`}
        className="w-full max-w-2xl"
      >
        {ticks.map((t) => (
          <g key={t}>
            <line x1={PAD.l} x2={W - PAD.r} y1={y(t)} y2={y(t)} stroke="var(--color-line)" />
            <text
              x={PAD.l - 6}
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
        {ALPHABET.split('').map((ch, i) => {
          const x = PAD.l + i * bw;
          const v = observed[i] ?? 0;
          const r = reference[i] ?? 0;
          return (
            <g key={ch}>
              <motion.rect
                x={x + 2}
                width={bw - 4}
                initial={false}
                animate={{ y: y(v), height: H - PAD.b - y(v) }}
                transition={barTransition}
                fill="var(--color-cyan)"
                opacity={0.85}
              />
              <rect
                x={x + 2}
                y={y(r)}
                width={bw - 4}
                height={H - PAD.b - y(r)}
                fill="none"
                stroke="var(--color-amber)"
                strokeWidth={1.2}
              />
              <text x={x + bw / 2} y={H - 12} textAnchor="middle" fontSize={10} fill="var(--color-muted)">
                {ch}
              </text>
            </g>
          );
        })}
        <text x={W / 2} y={H - 1} textAnchor="middle" fontSize={9} fill="var(--color-muted)">
          letter
        </text>
        <text
          transform={`rotate(-90 10 ${H / 2})`}
          x={10}
          y={H / 2}
          textAnchor="middle"
          fontSize={9}
          fill="var(--color-muted)"
        >
          share of letters
        </text>
      </svg>
      <figcaption className="flex flex-wrap gap-4 text-xs text-muted">
        <span>
          <span className="text-cyan">■</span> {observedLabel}
        </span>
        <span>
          <span className="text-amber">□</span> English
        </span>
      </figcaption>
      <details className="text-xs text-muted">
        <summary className="cursor-pointer hover:text-fg">Show as a table</summary>
        <table className="mt-2 w-full text-left">
          <caption className="sr-only">{title}</caption>
          <thead>
            <tr>
              <th scope="col">Letter</th>
              <th scope="col">{observedLabel}</th>
              <th scope="col">English</th>
            </tr>
          </thead>
          <tbody>
            {ALPHABET.split('').map((ch, i) => (
              <tr key={ch}>
                <th scope="row">{ch}</th>
                <td>{percent(observed[i] ?? 0, 2)}</td>
                <td>{percent(reference[i] ?? 0, 2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  );
}
