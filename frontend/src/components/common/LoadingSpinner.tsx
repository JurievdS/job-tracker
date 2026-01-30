/**
 * LoadingSpinner - Simple loading indicator
 */
export function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-500" />
      <span className="text-sm text-gray-500">Loading...</span>
    </div>
  );
}
