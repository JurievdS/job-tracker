import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { StatusBadge } from '@/components/common';
import type { Application } from '@/types/application';

interface KanbanCardProps {
  application: Application;
  onClick: () => void;
}

/**
 * KanbanCard - A draggable card representing a single job application
 *
 * Uses @dnd-kit's useDraggable hook for drag functionality.
 * Displays company name, position title, status badge, and date applied.
 */
export function KanbanCard({ application, onClick }: KanbanCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: application.id,
    data: { application },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className="mb-2"
    >
      <div
        onClick={onClick}
        className={`
          bg-white rounded-lg shadow-sm border border-gray-200 p-3
          cursor-grab active:cursor-grabbing
          hover:shadow-md hover:border-gray-300 transition-all
          ${isDragging ? 'opacity-50 shadow-lg ring-2 ring-blue-400' : ''}
        `}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onClick();
          }
        }}
      >
        <div className="space-y-2">
          <p className="font-medium text-gray-900 text-sm truncate">
            {application.company_name}
          </p>
          <p className="text-gray-600 text-xs truncate">
            {application.position_title}
          </p>
          <div className="flex items-center justify-between gap-2">
            <StatusBadge status={application.status} />
            {application.date_applied && (
              <span className="text-xs text-gray-400 whitespace-nowrap">
                {new Date(application.date_applied).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
