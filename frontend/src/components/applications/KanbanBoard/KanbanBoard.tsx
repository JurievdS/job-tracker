import { DndContext, DragOverlay, closestCenter } from '@dnd-kit/core';
import { LoadingSpinner, EmptyState, StatusBadge } from '@/components/common';
import {
  APPLICATION_STATUSES,
  type Application,
  type ApplicationStatus,
} from '@/types/application';
import { useKanbanDragDrop } from '@/hooks/useKanbanDragDrop';
import { KanbanColumn } from './KanbanColumn';

interface KanbanBoardProps {
  applications: Application[];
  setApplications: React.Dispatch<React.SetStateAction<Application[]>>;
  isLoading: boolean;
  error: string | null;
  onError: (message: string) => void;
  onCardClick: (application: Application) => void;
  onAddApplication: () => void;
}

/**
 * KanbanBoard - Main Kanban board container
 *
 * Displays job applications organized by status in draggable columns.
 * Features:
 * - Drag-and-drop between columns to change status
 * - Optimistic UI updates with rollback on error
 * - Visual feedback during drag (overlay)
 * - Loading and empty states
 */
export function KanbanBoard({
  applications,
  setApplications,
  isLoading,
  error,
  onError,
  onCardClick,
  onAddApplication,
}: KanbanBoardProps) {
  const {
    activeApplication,
    isUpdating,
    handleDragStart,
    handleDragEnd,
    handleDragCancel,
  } = useKanbanDragDrop({ applications, setApplications, onError });

  // Group applications by status
  const applicationsByStatus = APPLICATION_STATUSES.reduce(
    (acc, { value }) => {
      acc[value] = applications.filter((app) => app.status === value);
      return acc;
    },
    {} as Record<ApplicationStatus, Application[]>
  );

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  if (applications.length === 0) {
    return (
      <EmptyState
        title="No applications yet"
        description="Start tracking your job search by adding your first application."
        action={{
          label: 'Add Application',
          onClick: onAddApplication,
        }}
      />
    );
  }

  return (
    <div className="relative">
      {/* Updating indicator */}
      {isUpdating && (
        <div className="absolute top-2 right-2 z-10">
          <div className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm flex items-center gap-2">
            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Saving...
          </div>
        </div>
      )}

      {/* Error display */}
      {error && (
        <div className="mb-4 bg-red-50 text-red-700 p-4 rounded-md">
          {error}
        </div>
      )}

      {/* Kanban board */}
      <DndContext
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div className="flex gap-4 overflow-x-auto pb-4">
          {APPLICATION_STATUSES.map(({ value, label }) => (
            <KanbanColumn
              key={value}
              status={value}
              label={label}
              applications={applicationsByStatus[value] || []}
              onCardClick={onCardClick}
            />
          ))}
        </div>

        {/* Drag overlay - visual feedback while dragging */}
        <DragOverlay>
          {activeApplication ? (
            <div className="rotate-3 scale-105 w-60">
              <div className="bg-white rounded-lg shadow-xl border-2 border-blue-400 p-3">
                <div className="space-y-2">
                  <p className="font-medium text-gray-900 text-sm truncate">
                    {activeApplication.company_name}
                  </p>
                  <p className="text-gray-600 text-xs truncate">
                    {activeApplication.position_title}
                  </p>
                  <StatusBadge status={activeApplication.status} />
                </div>
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
