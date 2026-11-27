import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PANES } from '../panes';
import { useCipherStore } from '../state/cipherStore';
import { useUi } from '../state/store';

function isEditable(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);
}

/**
 * Global keys: Ctrl/Cmd+K opens the palette; 1 to 5 focus a pane; B runs Break; T toggles tile mode.
 * Plain keys are ignored while typing in a field, so they never get in the way of the text box.
 */
export function useShortcuts(): void {
  const navigate = useNavigate();
  const setActivePane = useUi((s) => s.setActivePane);
  const toggleLayout = useUi((s) => s.toggleLayout);
  const setPaletteOpen = useUi((s) => s.setPaletteOpen);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setPaletteOpen(!useUi.getState().paletteOpen);
        return;
      }
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      if (isEditable(event.target) || useUi.getState().paletteOpen) return;

      const pane = PANES.find((p) => p.key === event.key);
      if (pane) {
        event.preventDefault();
        setActivePane(pane.id);
        void navigate('/');
      } else if (event.key.toLowerCase() === 'b') {
        event.preventDefault();
        useCipherStore.getState().runBreak();
        setActivePane('break');
        void navigate('/');
      } else if (event.key.toLowerCase() === 't') {
        event.preventDefault();
        toggleLayout();
        void navigate('/');
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [navigate, setActivePane, toggleLayout, setPaletteOpen]);
}
