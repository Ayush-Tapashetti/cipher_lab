import { OctagonAlert, type LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

/** Shown while a lazily loaded screen arrives. All cipher compute is local, so this is rarely visible. */
export function LoadingState({ label = 'loading' }: { readonly label?: string }) {
  return (
    <div role="status" className="flex h-full min-h-48 items-center justify-center p-10 text-muted">
      <span>
        &gt; {label}
        <span className="caret" aria-hidden="true" />
      </span>
    </div>
  );
}

interface EmptyStateProps {
  readonly icon?: LucideIcon;
  readonly title: string;
  readonly children?: ReactNode;
  readonly action?: ReactNode;
}

/** Calm placeholder for a pane or screen with nothing to show yet. */
export function EmptyState({ icon: Icon, title, children, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-start gap-3 p-6 md:p-10">
      {Icon ? <Icon aria-hidden="true" className="size-8 text-cyan" strokeWidth={1.5} /> : null}
      <h2 className="text-xl text-fg">{title}</h2>
      {children ? <div className="max-w-prose text-muted">{children}</div> : null}
      {action}
    </div>
  );
}

interface ErrorStateProps {
  readonly title?: string;
  readonly message: string;
  readonly onRetry?: () => void;
}

/** Something broke. Says what, and offers a retry. The role makes screen readers announce it. */
export function ErrorState({ title = 'Something went wrong', message, onRetry }: ErrorStateProps) {
  return (
    <div role="alert" className="flex flex-col items-start gap-3 p-6 md:p-10">
      <OctagonAlert aria-hidden="true" className="size-8 text-danger" strokeWidth={1.5} />
      <h2 className="text-xl text-danger">{title}</h2>
      <p className="max-w-prose text-muted">{message}</p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="rounded-pane border border-line bg-raised px-4 py-2 text-fg hover:border-cyan hover:text-cyan"
        >
          Try again
        </button>
      ) : null}
    </div>
  );
}
