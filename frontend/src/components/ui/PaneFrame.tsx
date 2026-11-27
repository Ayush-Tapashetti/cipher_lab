import { motion } from 'motion/react';
import type { ReactNode } from 'react';
import { useMotionPrefs } from '../../motion/motion';
import type { PaneDef } from '../../panes';

interface PaneFrameProps {
  readonly pane: PaneDef;
  readonly children: ReactNode;
  /** Heading level: 2 in focus mode (one pane per page), 3 when several panes are tiled. */
  readonly level?: 2 | 3;
}

/** A titled, bordered region holding one pane. Fades in when it first appears. */
export function PaneFrame({ pane, children, level = 2 }: PaneFrameProps) {
  const { seconds } = useMotionPrefs();
  const Heading = level === 2 ? 'h2' : 'h3';
  const Icon = pane.icon;
  return (
    <motion.section
      aria-labelledby={`pane-${pane.id}-title`}
      className="flex h-full min-h-0 flex-col rounded-pane border border-line bg-surface"
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: seconds(0.22), ease: [0.2, 0.8, 0.2, 1] }}
    >
      <header className="flex items-center gap-3 border-b border-line px-4 py-3">
        <Icon aria-hidden="true" className="size-4 text-cyan" />
        <Heading id={`pane-${pane.id}-title`} className="text-base text-fg">
          {pane.label}
        </Heading>
        <span className="ml-auto text-xs text-muted">{pane.features}</span>
      </header>
      <div className="relative min-h-0 flex-1 overflow-auto overscroll-contain">{children}</div>
    </motion.section>
  );
}
