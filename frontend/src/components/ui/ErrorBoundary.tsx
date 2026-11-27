import { Component, type ErrorInfo, type ReactNode } from 'react';
import { ErrorState } from './states';

interface Props {
  readonly children: ReactNode;
}
interface State {
  readonly error: Error | null;
}

/** Top-level safety net: a crash in one screen shows a message with a retry instead of a blank page. */
export class ErrorBoundary extends Component<Props, State> {
  override state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('Unhandled UI error', error, info.componentStack);
  }

  override render(): ReactNode {
    if (this.state.error) {
      return (
        <ErrorState
          message={this.state.error.message || 'An unexpected error occurred.'}
          onRetry={() => {
            this.setState({ error: null });
          }}
        />
      );
    }
    return this.props.children;
  }
}
