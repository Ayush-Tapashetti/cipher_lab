import type { ReactNode } from 'react';
import { Group, Panel, Separator } from 'react-resizable-panels';

/**
 * Thin wrapper around react-resizable-panels (MIT). Sizes are percentage strings ("50%"); a bare number would mean
 * pixels. Dividers are keyboard resizable (arrow keys) because the library renders them as ARIA separators.
 */
export function TileGroup({
  orientation,
  children,
  label,
}: {
  readonly orientation: 'horizontal' | 'vertical';
  readonly children: ReactNode;
  readonly label: string;
}) {
  return (
    <Group orientation={orientation} aria-label={label} className="h-full w-full">
      {children}
    </Group>
  );
}

export function TilePanel({
  id,
  defaultSize,
  minSize = '15%',
  children,
}: {
  readonly id: string;
  readonly defaultSize: string;
  readonly minSize?: string;
  readonly children: ReactNode;
}) {
  return (
    <Panel id={id} defaultSize={defaultSize} minSize={minSize}>
      <div className="h-full min-h-0 min-w-0 p-1">{children}</div>
    </Panel>
  );
}

export function TileHandle() {
  return <Separator />;
}
