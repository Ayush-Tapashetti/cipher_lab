import type { ReactNode } from 'react';

/** A keyboard key hint, e.g. <Kbd>Ctrl</Kbd> <Kbd>K</Kbd>. */
export function Kbd({ children }: { readonly children: ReactNode }) {
  return (
    <kbd className="rounded-[3px] border border-line bg-raised px-1.5 py-px text-[0.75rem] leading-5 text-muted">
      {children}
    </kbd>
  );
}
