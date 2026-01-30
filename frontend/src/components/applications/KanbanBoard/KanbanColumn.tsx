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
      className={`
        flex flex-col bg-gray-50 rounded-lg p-3 min-h-[500px] w-64 flex-shrink-0
        transition-all duration-200
        ${isOver ? 'ring-2 ring-blue-400 bg-blue-50' : ''}
      `}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-200">
        <h3 className="font-medium text-gray-700 text-sm">
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
          <div className="flex items-center justify-center h-24 text-gray-400 text-sm">
            No applications
          </div>
        )}
      </div>
    </div>
  );
}
