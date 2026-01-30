import type { ReactNode } from 'react';

interface EmptyStateProps {
  /** Icon to display (optional) */
  icon?: ReactNode;
  /** Main title */
  title: string;
  /** Description text */
  description?: string;
  /** Call-to-action button */
  action?: {
    label: string;
    onClick: () => void;
  };
}

/**
 * EmptyState - Placeholder for when there's no data to display
 *
 * Usage:
 * ```tsx
 * {applications.length === 0 ? (
 *   <EmptyState
 *     icon={<ClipboardIcon />}
 *     title="No applications yet"
 *     description="Start tracking your job applications"
 *     action={{
 *       label: "Add Application",
 *       onClick: () => setShowForm(true),
 *     }}
 *   />
 * ) : (
 *   <ApplicationList applications={applications} />
 * )}
 * ```
 */
export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      {/* Icon */}
      {icon && (
        <div className="mb-4 text-gray-400">
          {icon}
        </div>
      )}

      {/* Default icon if none provided */}
      {!icon && (
        <div className="mb-4">
          <svg
            className="w-12 h-12 text-gray-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
            />
          </svg>
        </div>
      )}

      {/* Title */}
      <h3 className="text-lg font-medium text-gray-900 mb-1">{title}</h3>

      {/* Description */}
      {description && (
        <p className="text-sm text-gray-500 mb-4 max-w-sm">{description}</p>
      )}

      {/* Action button */}
      {action && (
        <button
          onClick={action.onClick}
          className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
