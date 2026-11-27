import { LayoutGrid, Maximize2, Search } from 'lucide-react';
import { AppLink } from '../components/ui/AppLink';
import { Kbd } from '../components/ui/Kbd';
import { useUi } from '../state/store';

const NAV = [
  { to: '/', label: 'Workspace', end: true },
  { to: '/math-lab', label: 'Math Lab', end: false },
  { to: '/verify', label: 'Verify', end: false },
] as const;

const linkClass = 'rounded-pane px-3 py-1.5 text-muted hover:text-fg';
const activeClass = 'bg-raised !text-cyan';

export function Header() {
  const layout = useUi((s) => s.layout);
  const toggleLayout = useUi((s) => s.toggleLayout);
  const setPaletteOpen = useUi((s) => s.setPaletteOpen);
  const tiled = layout === 'tile';

  return (
    <header className="flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-line bg-surface px-4 py-2 md:h-14 md:flex-nowrap">
      <AppLink to="/" className="text-lg font-semibold text-fg" aria-label="Cipher Lab, home">
        cipher-lab
        <span className="caret" aria-hidden="true" />
      </AppLink>

      <nav aria-label="Primary" className="flex items-center gap-1">
        {NAV.map((item) => (
          <AppLink key={item.to} to={item.to} end={item.end} className={linkClass} activeClassName={activeClass}>
            {item.label}
          </AppLink>
        ))}
      </nav>

      <div className="ml-auto flex items-center gap-2">
        <button
          type="button"
          onClick={toggleLayout}
          aria-pressed={tiled}
          title="Toggle tile mode (T)"
          className="inline-flex items-center gap-2 rounded-pane border border-line px-3 py-1.5 text-muted hover:border-cyan hover:text-cyan aria-pressed:border-cyan aria-pressed:text-cyan"
        >
          {tiled ? (
            <LayoutGrid aria-hidden="true" className="size-4" />
          ) : (
            <Maximize2 aria-hidden="true" className="size-4" />
          )}
          <span className="hidden sm:inline">{tiled ? 'Tile' : 'Focus'}</span>
          <Kbd>T</Kbd>
        </button>
        <button
          type="button"
          onClick={() => {
            setPaletteOpen(true);
          }}
          className="inline-flex items-center gap-2 rounded-pane border border-line px-3 py-1.5 text-muted hover:border-cyan hover:text-cyan"
        >
          <Search aria-hidden="true" className="size-4" />
          <span className="hidden sm:inline">Commands</span>
          <Kbd>Ctrl</Kbd>
          <Kbd>K</Kbd>
        </button>
      </div>
    </header>
  );
}
