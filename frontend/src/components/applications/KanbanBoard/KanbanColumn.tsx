import { useDroppable } from '@dnd-kit/core';
import { Badge, STATUS_VARIANTS } from '@/components/common';
import type { Application, ApplicationStatus } from '@/types/application';
import { KanbanCard } from './KanbanCard';

interface KanbanColumnProps {
  status: ApplicationStatus;
  label: string;
  applications: Application[];
  onCardClick: (application: Application) => void;
}

/**
 * KanbanColumn - A droppable column for a specific application status
 *
 * Uses @dnd-kit's useDroppable hook to accept dragged cards.
 * Highlights when a card is dragged over it.
 */
export function KanbanColumn({
  status,
  label,
  applications,
  onCardClick,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: status,
    data: { status },
  });

  return (
    <div
      ref={setNodeRef}
      aria-label={`${label} column, ${applications.length} application${applications.length !== 1 ? 's' : ''}`}
      className={`
        flex flex-col bg-surface-alt rounded-[var(--radius-lg)] p-3 min-h-[200px] w-64 flex-shrink-0 max-md:w-full max-md:min-h-0
        transition-all duration-200
        ${isOver ? 'ring-2 ring-primary bg-primary-light' : ''}
      `}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-border">
        <h3 className="font-medium text-text-secondary text-sm">
          {label}
        </h3>
        <Badge variant={STATUS_VARIANTS[status] || 'default'}>
          {applications.length}
        </Badge>
      </div>

      {/* Cards Container */}
      <div className="flex-1 overflow-y-auto">
        {applications.map((app) => (
          <KanbanCard
            key={app.id}
            application={app}
            onClick={() => onCardClick(app)}
          />
        ))}

        {applications.length === 0 && (
          <div className="flex items-center justify-center h-24 text-text-placeholder text-sm">
            No applications
          </div>
        )}
      </div>
    </div>
  );
}
