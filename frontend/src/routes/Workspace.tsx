import { TileGroup, TileHandle, TilePanel } from '../components/adapters/ResizablePanes';
import { Kbd } from '../components/ui/Kbd';
import { PaneFrame } from '../components/ui/PaneFrame';
import { PANES, paneById, type PaneId } from '../panes';
import { PANE_COMPONENTS } from '../paneComponents';
import { useUi } from '../state/store';

function PaneBody({ id }: { readonly id: PaneId }) {
  const Body = PANE_COMPONENTS[id];
  return <Body />;
}

function Tile({ id }: { readonly id: PaneId }) {
  return (
    <PaneFrame pane={paneById(id)} level={3}>
      <PaneBody id={id} />
    </PaneFrame>
  );
}

export default function Workspace() {
  const layout = useUi((s) => s.layout);
  const activePane = useUi((s) => s.activePane);

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 p-3 md:p-6">
      <title>Workspace · Cipher Lab</title>
      <h1 className="sr-only">Workspace</h1>

      {layout === 'focus' ? (
        <div className="min-h-0 flex-1">
          <PaneFrame pane={paneById(activePane)} key={activePane}>
            <PaneBody id={activePane} />
          </PaneFrame>
        </div>
      ) : (
        <div className="min-h-[28rem] flex-1">
          <TileGroup orientation="horizontal" label="Tiled panes">
            <TilePanel id="col-left" defaultSize="50%">
              <TileGroup orientation="vertical" label="Left column">
                <TilePanel id="io" defaultSize="55%">
                  <Tile id="io" />
                </TilePanel>
                <TileHandle />
                <TilePanel id="trace" defaultSize="45%">
                  <Tile id="trace" />
                </TilePanel>
              </TileGroup>
            </TilePanel>
            <TileHandle />
            <TilePanel id="col-right" defaultSize="50%">
              <TileGroup orientation="vertical" label="Right column">
                <TilePanel id="wheel" defaultSize="50%">
                  <Tile id="wheel" />
                </TilePanel>
                <TileHandle />
                <TilePanel id="frequency" defaultSize="50%">
                  <Tile id="frequency" />
                </TilePanel>
              </TileGroup>
            </TilePanel>
          </TileGroup>
        </div>
      )}

      <p className="text-xs text-muted">
        Panes: {PANES.map((p) => `${p.key} ${p.label}`).join(' · ')} · <Kbd>T</Kbd> tile/focus · <Kbd>Ctrl</Kbd>{' '}
        <Kbd>K</Kbd> commands
      </p>
    </div>
  );
}
