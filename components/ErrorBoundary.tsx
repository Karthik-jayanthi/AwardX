import type { ReactNode } from 'react';
import { ErrorBoundary as ReactErrorBoundary, type FallbackProps } from 'react-error-boundary';

type ErrorBoundaryProps = {
  children: ReactNode;
  resetKey?: string;
};

const ErrorFallback = ({ error, resetErrorBoundary }: FallbackProps) => {
  const message = error instanceof Error
    ? error.message
    : 'An unexpected error occurred while rendering this section.';
  return (
    <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-900">
      <h2 className="text-lg font-bold">Something went wrong in this view</h2>
      <p className="mt-2 text-sm text-rose-700">{message}</p>
      <button
        onClick={resetErrorBoundary}
        className="mt-4 rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700"
      >
        Try Again
      </button>
    </div>
  );
};

export const ErrorBoundary = ({ children, resetKey }: ErrorBoundaryProps) => {
  return (
    <ReactErrorBoundary
      FallbackComponent={ErrorFallback}
      onError={(error) => {
        console.error('Dashboard view crashed:', error);
      }}
      resetKeys={resetKey ? [resetKey] : []}
    >
      {children}
    </ReactErrorBoundary>
  );
};
