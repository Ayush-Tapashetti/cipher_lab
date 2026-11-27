import { Suspense } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AppToaster } from '../components/adapters/AppToaster';
import { CommandPalette } from '../components/adapters/CommandPalette';
import { ErrorBoundary } from '../components/ui/ErrorBoundary';
import { LoadingState } from '../components/ui/states';
import { Header } from './Header';
import { Rail } from './Rail';
import { StatusBar } from './StatusBar';
import { useShortcuts } from './useShortcuts';

/**
 * workspace-split shell: header on top, a pane rail on the workspace route, the page in the middle, a status bar below.
 * Everything every page needs (skip link, palette, toasts, error boundary, disclaimers) lives here so no page can omit it.
 */
export function RootLayout() {
  useShortcuts();
  const { pathname } = useLocation();
  const onWorkspace = pathname === '/';

  return (
    <div className="grid h-dvh grid-cols-[minmax(0,1fr)] grid-rows-[auto_minmax(0,1fr)_auto] bg-ink text-fg">
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <Header />
      <div className="flex min-h-0 flex-col md:flex-row">
        {onWorkspace ? <Rail /> : null}
        <main
          id="main"
          tabIndex={-1}
          className="relative min-h-0 min-w-0 flex-1 overflow-auto overscroll-contain outline-none"
        >
          <ErrorBoundary key={pathname}>
            <Suspense fallback={<LoadingState />}>
              <Outlet />
            </Suspense>
          </ErrorBoundary>
        </main>
      </div>
      <StatusBar />
      <CommandPalette />
      <AppToaster />
    </div>
  );
}
