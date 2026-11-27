import { create } from 'zustand';
import type { PaneId } from '../panes';

export type LayoutMode = 'focus' | 'tile';

/** UI state shared by distant parts of the shell (rail, header, palette, workspace). 6C adds text and key state. */
interface UiState {
  readonly layout: LayoutMode;
  readonly activePane: PaneId;
  readonly paletteOpen: boolean;
  setLayout: (layout: LayoutMode) => void;
  toggleLayout: () => void;
  setActivePane: (pane: PaneId) => void;
  setPaletteOpen: (open: boolean) => void;
}

export const useUi = create<UiState>((set) => ({
  layout: 'focus',
  activePane: 'io',
  paletteOpen: false,
  setLayout: (layout) => set({ layout }),
  toggleLayout: () => set((s) => ({ layout: s.layout === 'focus' ? 'tile' : 'focus' })),
  setActivePane: (activePane) => set({ activePane }),
  setPaletteOpen: (paletteOpen) => set({ paletteOpen }),
}));
