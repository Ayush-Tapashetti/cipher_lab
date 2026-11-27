import { Command } from 'cmdk';
import { Compass, KeyRound, LayoutGrid, Maximize2 } from 'lucide-react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { PANES } from '../../panes';
import { useCipherStore } from '../../state/cipherStore';
import { useUi } from '../../state/store';
import { Kbd } from '../ui/Kbd';

function Item({
  value,
  onSelect,
  children,
  hint,
}: {
  readonly value: string;
  readonly onSelect: () => void;
  readonly children: ReactNode;
  readonly hint?: ReactNode;
}) {
  return (
    <Command.Item value={value} onSelect={onSelect}>
      {children}
      {hint ? <span className="ml-auto">{hint}</span> : null}
    </Command.Item>
  );
}

/**
 * Ctrl/Cmd+K command palette (cmdk, MIT). It is the keyboard-first way to move around: pages, panes and layout.
 */
export function CommandPalette() {
  const navigate = useNavigate();
  const open = useUi((s) => s.paletteOpen);
  const setOpen = useUi((s) => s.setPaletteOpen);
  const layout = useUi((s) => s.layout);
  const setActivePane = useUi((s) => s.setActivePane);
  const toggleLayout = useUi((s) => s.toggleLayout);

  const cipher = useCipherStore();

  const run = (action: () => void) => () => {
    setOpen(false);
    action();
  };

  return (
    <Command.Dialog open={open} onOpenChange={setOpen} label="Command palette" loop>
      <Command.Input placeholder="Type a command or a page name…" aria-label="Search commands" />
      <Command.List>
        <Command.Empty>No matching command.</Command.Empty>
        <Command.Group heading="Go to">
          <Item value="workspace" onSelect={run(() => void navigate('/'))}>
            <Compass aria-hidden="true" className="size-4" /> Workspace
          </Item>
          <Item value="math lab" onSelect={run(() => void navigate('/math-lab'))}>
            <Compass aria-hidden="true" className="size-4" /> Math Lab
          </Item>
          <Item value="verify checks" onSelect={run(() => void navigate('/verify'))}>
            <Compass aria-hidden="true" className="size-4" /> Verify
          </Item>
        </Command.Group>
        <Command.Group heading="Panes">
          {PANES.map((pane) => (
            <Item
              key={pane.id}
              value={`pane ${pane.label}`}
              hint={<Kbd>{pane.key}</Kbd>}
              onSelect={run(() => {
                setActivePane(pane.id);
                void navigate('/');
              })}
            >
              <pane.icon aria-hidden="true" className="size-4" /> {pane.label}
            </Item>
          ))}
        </Command.Group>
        <Command.Group heading="Cipher">
          {(['caesar', 'affine', 'substitution'] as const).map((c) => (
            <Item
              key={c}
              value={`use ${c} cipher`}
              onSelect={run(() => {
                cipher.setCipher(c);
              })}
            >
              <KeyRound aria-hidden="true" className="size-4" /> Use {c} cipher
            </Item>
          ))}
          <Item
            value="load sample plaintext"
            onSelect={run(() => {
              cipher.loadSamplePlaintext();
              setActivePane('io');
              void navigate('/');
            })}
          >
            Load sample plaintext
          </Item>
          <Item
            value="load sample ciphertext and break"
            hint={<Kbd>B</Kbd>}
            onSelect={run(() => {
              cipher.loadSampleCiphertext();
              cipher.runBreak();
              setActivePane('break');
              void navigate('/');
            })}
          >
            Load sample ciphertext and break it
          </Item>
        </Command.Group>
        <Command.Group heading="Layout">
          <Item
            value="toggle tile focus layout"
            hint={<Kbd>T</Kbd>}
            onSelect={run(() => {
              toggleLayout();
              void navigate('/');
            })}
          >
            {layout === 'focus' ? (
              <LayoutGrid aria-hidden="true" className="size-4" />
            ) : (
              <Maximize2 aria-hidden="true" className="size-4" />
            )}
            {layout === 'focus' ? 'Switch to tile mode' : 'Switch to focus mode'}
          </Item>
        </Command.Group>
      </Command.List>
    </Command.Dialog>
  );
}
