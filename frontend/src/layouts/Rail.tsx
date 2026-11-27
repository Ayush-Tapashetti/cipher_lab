import { PANES } from '../panes';
import { cx } from '../lib/cx';
import { useUi } from '../state/store';

/** Slim rail of pane switchers. Buttons (not links): choosing a pane is an action inside the workspace. */
export function Rail() {
  const activePane = useUi((s) => s.activePane);
  const setActivePane = useUi((s) => s.setActivePane);

  return (
    <nav
      aria-label="Panes"
      className="flex shrink-0 gap-1 overflow-x-auto border-b border-line bg-surface p-2 md:w-20 md:flex-col md:overflow-x-visible md:border-r md:border-b-0"
    >
      {PANES.map((pane) => {
        const active = pane.id === activePane;
        return (
          <button
            key={pane.id}
            type="button"
            aria-pressed={active}
            aria-label={`${pane.key} ${pane.label}`}
            title={`${pane.label} (${pane.key})`}
            onClick={() => {
              setActivePane(pane.id);
            }}
            className={cx(
              'flex min-h-12 min-w-16 flex-1 flex-col items-center justify-center gap-0.5 rounded-pane border px-2 py-2 text-xs md:flex-none',
              active
                ? 'border-cyan bg-raised text-cyan'
                : 'border-transparent text-muted hover:border-line hover:text-fg',
            )}
          >
            <pane.icon aria-hidden="true" className="size-5" />
            <span aria-hidden="true">{pane.key}</span>
          </button>
        );
      })}
    </nav>
  );
}
