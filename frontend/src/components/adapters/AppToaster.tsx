import { Toaster } from 'sonner';

/** Sonner (MIT) toaster themed with the design tokens. Used only for copy and export confirmations. */
export function AppToaster() {
  return (
    <Toaster
      theme="dark"
      position="bottom-right"
      toastOptions={{
        style: {
          background: 'var(--color-raised)',
          border: '1px solid var(--color-line)',
          color: 'var(--color-fg)',
          fontFamily: 'var(--font-mono)',
        },
      }}
    />
  );
}
