import { describe, expect, it } from 'vitest';
import { STEP_DEG, pointerAngle, polar, ringRotation, shiftAfterDrag, unwrap } from './wheelGeometry';

describe('wheel geometry', () => {
  it('one letter is 360/26 degrees and the outer ring turns anticlockwise by k steps', () => {
    expect(STEP_DEG).toBeCloseTo(13.846, 3);
    expect(ringRotation(3)).toBeCloseTo(-41.538, 3);
    expect(ringRotation(0)).toBeCloseTo(0, 9);
  });

  it('puts position 0 at 12 o clock and position 13 at 6 o clock', () => {
    const top = polar(100, 0);
    expect(top.x).toBeCloseTo(0, 9);
    expect(top.y).toBeCloseTo(-100, 9);
    const bottom = polar(100, 13);
    expect(bottom.x).toBeCloseTo(0, 9);
    expect(bottom.y).toBeCloseTo(100, 9);
  });

  it('unwrap takes the short way round: shift 25 to 0 is one step, not twenty-five', () => {
    const at25 = ringRotation(25);
    const next = unwrap(at25, ringRotation(0));
    expect(Math.abs(next - at25)).toBeCloseTo(STEP_DEG, 6);
  });

  it('unwrap keeps the same point on the circle', () => {
    for (const [prev, target] of [
      [-340, 10],
      [725, 5],
      [0, 359],
    ] as const) {
      const out = unwrap(prev, target);
      expect((((out - target) % 360) + 360) % 360).toBeCloseTo(0, 9);
      expect(Math.abs(out - prev)).toBeLessThanOrEqual(180);
    }
  });

  it('pointer angle is measured clockwise from the top', () => {
    expect(pointerAngle(0, -10, 0, 0)).toBeCloseTo(0, 9);
    expect(pointerAngle(10, 0, 0, 0)).toBeCloseTo(90, 9);
    expect(pointerAngle(0, 10, 0, 0)).toBeCloseTo(180, 9);
  });

  it('dragging clockwise lowers the shift and always stays in 0..25', () => {
    expect(shiftAfterDrag(5, STEP_DEG * 2)).toBe(3);
    expect(shiftAfterDrag(1, STEP_DEG * 3)).toBe(24);
    expect(shiftAfterDrag(25, -STEP_DEG * 2)).toBe(1);
    expect(shiftAfterDrag(7, 0)).toBe(7);
  });
});
