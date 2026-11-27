import { ALPHABET, mapLetter } from '@cipher-lab/engine';
import type { ValidKey } from '@cipher-lab/engine';
import { animate, useMotionValue, useMotionValueEvent } from 'motion/react';
import { useEffect, useRef, type KeyboardEvent, type PointerEvent } from 'react';
import { useMotionPrefs } from '../../motion/motion';
import { angleOf, pointerAngle, polar, ringRotation, shiftAfterDrag, unwrap } from './wheelGeometry';

interface CipherWheelProps {
  readonly keySpec: ValidKey;
  /** The letter being shown (last typed), or null. */
  readonly highlight: string | null;
  readonly direction: 'encrypt' | 'decrypt';
  readonly onShift: (shift: number) => void;
}

const R_OUT = 168;
const R_IN = 122;
const letters = ALPHABET.split('');

/** Two alphabet rings. For Caesar the outer ring turns by the key; for other ciphers it shows E(x) under each x. */
export function CipherWheel({ keySpec, highlight, direction, onShift }: CipherWheelProps) {
  const { wheelTransition } = useMotionPrefs();
  const svg = useRef<SVGSVGElement>(null);
  const angle = useRef(0);
  const drag = useRef<{ startAngle: number; startShift: number } | null>(null);

  const caesar = keySpec.cipher === 'caesar';
  const shift = keySpec.cipher === 'caesar' ? keySpec.shift : 0;
  const target = ringRotation(shift);
  angle.current = unwrap(angle.current, target);
  const spin = useMotionValue(angle.current);
  const ring = useRef<SVGGElement>(null);
  useMotionValueEvent(spin, 'change', (v) => {
    ring.current?.setAttribute('transform', `rotate(${v})`);
  });
  const transition = useRef(wheelTransition);
  transition.current = wheelTransition;
  useEffect(() => {
    const controls = animate(spin, angle.current, transition.current);
    return () => {
      controls.stop();
    };
  }, [spin, target]);

  const hx = highlight === null ? null : highlight.toUpperCase().charCodeAt(0) - 65;
  // Which plaintext position is lit: the typed letter when encrypting, its decryption when decrypting.
  const lit = hx === null ? null : direction === 'encrypt' ? hx : mapLetter(hx, keySpec, 'decrypt');

  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!caesar) return;
    const big = e.shiftKey ? 5 : 1;
    const moves: Record<string, number> = { ArrowRight: -big, ArrowDown: -big, ArrowLeft: big, ArrowUp: big };
    const move = moves[e.key];
    if (move !== undefined) {
      e.preventDefault();
      onShift((((shift + move) % 26) + 26) % 26);
    } else if (e.key === 'Home') {
      e.preventDefault();
      onShift(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      onShift(25);
    }
  };

  const centre = () => {
    const box = svg.current?.getBoundingClientRect();
    return box ? { x: box.left + box.width / 2, y: box.top + box.height / 2 } : { x: 0, y: 0 };
  };
  const down = (e: PointerEvent<SVGSVGElement>) => {
    if (!caesar) return;
    const c = centre();
    drag.current = { startAngle: pointerAngle(e.clientX, e.clientY, c.x, c.y), startShift: shift };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const move = (e: PointerEvent<SVGSVGElement>) => {
    const d = drag.current;
    if (!d) return;
    const c = centre();
    const delta = pointerAngle(e.clientX, e.clientY, c.x, c.y) - d.startAngle;
    const next = shiftAfterDrag(d.startShift, ((delta + 540) % 360) - 180);
    if (next !== shift) onShift(next);
  };
  const up = () => {
    drag.current = null;
  };

  return (
    <div
      role={caesar ? 'slider' : 'img'}
      tabIndex={caesar ? 0 : undefined}
      aria-label={caesar ? 'Caesar shift' : 'Cipher alphabet'}
      aria-valuemin={caesar ? 0 : undefined}
      aria-valuemax={caesar ? 25 : undefined}
      aria-valuenow={caesar ? shift : undefined}
      aria-valuetext={caesar ? `shift ${shift}: A becomes ${ALPHABET.charAt(shift)}` : undefined}
      onKeyDown={onKey}
      className="mx-auto w-full max-w-md rounded-full focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan"
    >
      <svg
        ref={svg}
        viewBox="-200 -200 400 400"
        aria-hidden="true"
        className={caesar ? 'w-full cursor-grab touch-none select-none active:cursor-grabbing' : 'w-full select-none'}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
      >
        <circle r={R_OUT + 24} fill="var(--color-surface)" stroke="var(--color-line)" />
        <circle r={R_IN - 24} fill="var(--color-ink)" stroke="var(--color-line)" />
        {/* Outer ring: the ciphertext alphabet. Turns with the key for Caesar. */}
        <g ref={ring} transform={`rotate(${angle.current})`}>
          {letters.map((ch, j) => {
            const shown = caesar ? ch : ALPHABET.charAt(mapLetter(j, keySpec, 'encrypt'));
            const p = polar(R_OUT, j);
            const on = caesar ? lit !== null && (lit + shift) % 26 === j : lit === j;
            return (
              <text
                key={ch}
                x={p.x}
                y={p.y}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={on ? 20 : 15}
                fontWeight={on ? 700 : 400}
                fill={on ? 'var(--color-emerald)' : 'var(--color-fg)'}
              >
                {shown}
              </text>
            );
          })}
        </g>
        {/* Inner ring: the plaintext alphabet. Fixed. */}
        {letters.map((ch, x) => {
          const p = polar(R_IN, x);
          const on = lit === x;
          return (
            <text
              key={ch}
              x={p.x}
              y={p.y}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={on ? 20 : 15}
              fontWeight={on ? 700 : 400}
              fill={on ? 'var(--color-cyan)' : 'var(--color-muted)'}
            >
              {ch}
            </text>
          );
        })}
        {/* Index marker at plaintext A. */}
        <line
          x1={0}
          y1={-R_OUT - 24}
          x2={0}
          y2={-R_IN + 24}
          stroke="var(--color-amber)"
          strokeWidth={1.5}
          strokeDasharray="3 3"
        />
        {lit !== null ? (
          <line
            x1={polar(R_IN - 18, lit).x}
            y1={polar(R_IN - 18, lit).y}
            x2={polar(R_OUT - 18, lit).x}
            y2={polar(R_OUT - 18, lit).y}
            stroke="var(--color-cyan)"
            strokeWidth={1}
            opacity={0.6}
          />
        ) : null}
        <text textAnchor="middle" y={-6} fontSize={13} fill="var(--color-muted)">
          {caesar ? `k = ${shift}` : keySpec.cipher}
        </text>
        <text textAnchor="middle" y={14} fontSize={11} fill="var(--color-muted)">
          inner: x · outer: E(x)
        </text>
        <title>{`angle ${angleOf(shift).toFixed(1)} degrees`}</title>
      </svg>
    </div>
  );
}
