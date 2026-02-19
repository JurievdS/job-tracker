import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { useRouteError, useNavigate } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import { Button } from './Button';
import { ROUTES } from '@/routes/routes';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * ErrorBoundary — catches render errors in child components.
 *
 * Wrap around any subtree to prevent crashes from propagating.
 * When an error occurs, shows a fallback UI instead of a blank screen.
 *
 * Usage:
 * ```tsx
 * <ErrorBoundary>
 *   <Outlet />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary]', error, errorInfo);
  }

  resetErrorBoundary = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <ErrorFallbackUI
          error={this.state.error}
          onRetry={this.resetErrorBoundary}
        />
      );
    }

    return this.props.children;
  }
}

function ErrorFallbackUI({
  error,
  onRetry,
}: {
  error: Error | null;
  onRetry: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="mb-4 text-warning">
        <AlertTriangle className="w-12 h-12" />
      </div>
      <h2 className="text-xl font-bold text-text mb-2">
        Something went wrong
      </h2>
      <p className="text-sm text-text-muted mb-6 max-w-md">
        An unexpected error occurred. You can try again, or go back to the dashboard.
      </p>
      {import.meta.env.DEV && error && (
        <pre className="text-xs text-danger-text bg-danger-light rounded-[var(--radius-md)] p-3 mb-6 max-w-lg overflow-auto text-left">
          {error.message}
        </pre>
      )}
      <div className="flex gap-3">
        <Button variant="secondary" onClick={onRetry}>
          Try Again
        </Button>
        <Button onClick={() => window.location.assign(ROUTES.DASHBOARD)}>
          Go to Dashboard
        </Button>
      </div>
    </div>
  );
}

/**
 * RouteErrorFallback — for use as react-router's `errorElement`.
 *
 * Catches route-level errors (loader failures, missing lazy chunks, etc.)
 * and displays a full-page error screen.
 *
 * Usage:
 * ```tsx
 * { element: <MainLayout />, errorElement: <RouteErrorFallback />, children: [...] }
 * ```
 */
export function RouteErrorFallback() {
  const error = useRouteError();
  const navigate = useNavigate();

  const message =
    error instanceof Error
      ? error.message
      : typeof error === 'string'
        ? error
        : 'An unexpected error occurred';

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="text-center">
        <div className="mb-4 flex justify-center text-warning">
          <AlertTriangle className="w-16 h-16" />
        </div>
        <h1 className="text-2xl font-bold text-text mb-2">
          Something went wrong
        </h1>
        <p className="text-text-muted mb-6 max-w-md mx-auto">
          An unexpected error occurred while loading this page.
        </p>
        {import.meta.env.DEV && (
          <pre className="text-xs text-danger-text bg-danger-light rounded-[var(--radius-md)] p-3 mb-6 max-w-lg mx-auto overflow-auto text-left">
            {message}
          </pre>
        )}
        <div className="flex gap-3 justify-center">
          <Button
            variant="secondary"
            onClick={() => window.location.reload()}
          >
            Reload Page
          </Button>
          <Button onClick={() => navigate(ROUTES.DASHBOARD)}>
            Go to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
