import type { ComponentType } from 'react';
import type { PaneId } from './panes';
import { BreakPane } from './features/break/BreakPane';
import { FrequencyPane } from './features/frequency/FrequencyPane';
import { TracePane } from './features/trace/TracePane';
import { IoPane } from './features/workspace/IoPane';
import { WheelPane } from './features/workspace/WheelPane';

/** Pane id -> its content component. */
export const PANE_COMPONENTS: Record<PaneId, ComponentType> = {
  io: IoPane,
  wheel: WheelPane,
  frequency: FrequencyPane,
  trace: TracePane,
  break: BreakPane,
};
