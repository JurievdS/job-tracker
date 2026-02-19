/**
 * LoadingSpinner - Simple loading indicator
 */
export function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center gap-2" role="status" aria-label="Loading">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-border border-t-primary" />
      <span className="text-sm text-text-muted">Loading...</span>
    </div>
  );
}
