import { ChartColumn, Disc3, KeyRound, Sigma, Type, type LucideIcon } from 'lucide-react';

export type PaneId = 'io' | 'wheel' | 'frequency' | 'trace' | 'break';

export interface PaneDef {
  readonly id: PaneId;
  /** Keyboard shortcut that focuses the pane (when not typing in a field). */
  readonly key: string;
  readonly label: string;
  readonly blurb: string;
  readonly features: string;
  readonly icon: LucideIcon;
}

/** The five panes of the workspace (docs/pipeline/04b-experience.md). 6C fills them with real content. */
export const PANES: readonly PaneDef[] = [
  {
    id: 'io',
    key: '1',
    label: 'Input / Output',
    blurb: 'Type plaintext, pick a cipher and a key. The ciphertext updates on every keystroke.',
    features: 'FEAT-001 · FEAT-002',
    icon: Type,
  },
  {
    id: 'wheel',
    key: '2',
    label: 'Cipher wheel',
    blurb: 'Two alphabet rings. The outer ring turns with the key and shows (x + k) mod 26 for each letter.',
    features: 'FEAT-001',
    icon: Disc3,
  },
  {
    id: 'frequency',
    key: '3',
    label: 'Frequency',
    blurb: 'Letter counts as a histogram beside English, plus the index of coincidence.',
    features: 'FEAT-003',
    icon: ChartColumn,
  },
  {
    id: 'trace',
    key: '4',
    label: 'Trace',
    blurb: 'Every letter as arithmetic: x, the formula, the unreduced value, the value mod 26.',
    features: 'FEAT-005 · DIFF-001',
    icon: Sigma,
  },
  {
    id: 'break',
    key: '5',
    label: 'Break',
    blurb: 'Chi-squared scores for every key, ranked. The histogram slides into alignment with English.',
    features: 'FEAT-004 · DIFF-003',
    icon: KeyRound,
  },
];

export function paneById(id: PaneId): PaneDef {
  const found = PANES.find((p) => p.id === id);
  return found ?? PANES[0]!;
}
