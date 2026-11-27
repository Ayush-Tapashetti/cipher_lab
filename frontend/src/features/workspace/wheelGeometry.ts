import { mod } from '@cipher-lab/engine';

export const STEP_DEG = 360 / 26;

/** Angle (degrees, clockwise from the top) of ring position `index`. */
export const angleOf = (index: number): number => index * STEP_DEG;

/** Point on a circle of radius r at ring position `index`, with 0 at 12 o'clock and the centre at (0,0). */
export function polar(r: number, index: number): { x: number; y: number } {
  const a = ((angleOf(index) - 90) * Math.PI) / 180;
  return { x: r * Math.cos(a), y: r * Math.sin(a) };
}

/** Rotation of the outer ring for Caesar shift k: the outer letter k places round comes under plaintext A. */
export const ringRotation = (shift: number): number => -shift * STEP_DEG;

/**
 * Picks the equivalent angle nearest to `previous`, so going from shift 25 to 0 turns one step, not 25.
 * (Angles are the same point on the circle when they differ by a multiple of 360.)
 */
export function unwrap(previous: number, target: number): number {
  const turns = Math.round((previous - target) / 360);
  return target + turns * 360;
}

/** Pointer position to angle in degrees clockwise from the top, about the SVG centre. */
export function pointerAngle(px: number, py: number, cx: number, cy: number): number {
  return (Math.atan2(py - cy, px - cx) * 180) / Math.PI + 90;
}

/** New shift after dragging the ring by `deltaDeg` clockwise from a start shift (clockwise lowers k). */
export const shiftAfterDrag = (startShift: number, deltaDeg: number): number =>
  mod(startShift - Math.round(deltaDeg / STEP_DEG), 26);
