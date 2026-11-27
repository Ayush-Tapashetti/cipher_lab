import { isRouteErrorResponse, useRouteError } from 'react-router-dom';
import { ErrorState } from '../components/ui/states';

/** Shown by the router when a route throws while loading or rendering. */
export default function RouteError() {
  const error = useRouteError();
  const message = isRouteErrorResponse(error)
    ? `${error.status} ${error.statusText}`
    : error instanceof Error
      ? error.message
      : 'An unexpected error occurred.';
  return (
    <div className="min-h-dvh bg-ink text-fg">
      <ErrorState
        message={message}
        onRetry={() => {
          window.location.reload();
        }}
      />
    </div>
  );
}
