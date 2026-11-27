import { useReducedMotion } from 'motion/react';

/** Durations in seconds. Mirrors the --dur-* tokens in styles/tokens.css. */
export const DURATION = { instant: 0.08, fast: 0.15, base: 0.22, wheel: 0.3, slide: 0.6 } as const;

export const EASE_OUT = [0.2, 0.8, 0.2, 1] as const;

interface MotionPrefs {
  readonly reduced: boolean;
  /** A duration that collapses to 0 when the user prefers reduced motion. */
  readonly seconds: (value: number) => number;
  /** Spring used by the cipher wheel; an instant jump when motion is reduced. */
  readonly wheelTransition:
    { readonly type: 'spring'; readonly stiffness: number; readonly damping: number } | { readonly duration: 0 };
}

/** Every animated component reads its timings from here so prefers-reduced-motion is honoured everywhere. */
export function useMotionPrefs(): MotionPrefs {
  const reduced = useReducedMotion() ?? false;
  return {
    reduced,
    seconds: (value) => (reduced ? 0 : value),
    wheelTransition: reduced ? { duration: 0 } : { type: 'spring', stiffness: 220, damping: 26 },
  };
}
