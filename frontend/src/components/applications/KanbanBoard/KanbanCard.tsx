import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { ChevronRight } from 'lucide-react';
import { StatusBadge, TagBadge } from '@/components/common';
import { formatDate } from '@/utils/date';
import type { Application } from '@/types/application';
import { REMOTE_TYPES } from '@/types/application';
import { EligibilityBadge } from '../EligibilityBadge';

interface KanbanCardProps {
  application: Application;
  onClick: () => void;
}

/**
 * KanbanCard - A draggable card representing a single job application
 *
 * Uses @dnd-kit's useDraggable hook for drag functionality.
 * Displays company name, position title, extra context, status badge, and date applied.
 */
export function KanbanCard({ application, onClick }: KanbanCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: application.id,
    data: { application },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
  };

  // Extra context: combine location + remote type, fall back to source
  const remoteLabel = REMOTE_TYPES.find((r) => r.value === application.remote_type)?.label;
  const locationInfo = application.location && remoteLabel
    ? `${application.location} · ${remoteLabel}`
    : application.location || remoteLabel || null;
  const extraInfo = locationInfo || application.source_name || null;

  // Compact salary hint
  const salaryInfo = (() => {
    if (!application.salary_advertised_min && !application.salary_advertised_max) return null;
    const fmt = (n: number) => (n >= 1000 ? `${Math.round(n / 1000)}k` : String(n));
    const parts: string[] = [];
    if (application.salary_advertised_min) parts.push(fmt(application.salary_advertised_min));
    if (application.salary_advertised_max) parts.push(fmt(application.salary_advertised_max));
    const range = parts.join('–');
    const currency = application.salary_currency?.toUpperCase() || '';
    return `${range}${currency ? ` ${currency}` : ''}`;
  })();

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
          group relative
          bg-surface rounded-[var(--radius-lg)] shadow-sm border border-border p-3
          cursor-grab active:cursor-grabbing
          hover:shadow-md hover:border-border-hover transition-all
          ${isDragging ? 'opacity-50 shadow-lg ring-2 ring-primary' : ''}
        `}
        role="button"
        tabIndex={0}
        aria-label={`${application.company_name || 'Unknown'} — ${application.job_title}`}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onClick();
          }
        }}
      >
        <ChevronRight className="absolute top-3 right-2 w-3.5 h-3.5 text-text-placeholder opacity-40 group-hover:opacity-100 transition-opacity" />
        <div className="space-y-1.5">
          <p
            className="font-medium text-text text-sm truncate"
            title={application.company_name || undefined}
          >
            {application.company_name}
          </p>
          <p
            className="text-text-secondary text-xs truncate"
            title={application.job_title}
          >
            {application.job_title}
          </p>
          {(extraInfo || application.eligibility) && (
            <div className="flex items-center gap-1.5 text-text-placeholder text-xs">
              {application.eligibility && (
                <EligibilityBadge eligibility={application.eligibility} mode="dot" />
              )}
              {extraInfo && (
                <span className="truncate">{extraInfo}</span>
              )}
            </div>
          )}
          {salaryInfo && (
            <span className="text-text-placeholder text-xs">{salaryInfo}</span>
          )}
          {application.tags && application.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {application.tags.slice(0, 3).map((tag) => (
                <TagBadge key={tag.id} name={tag.name} color={tag.color} size="sm" />
              ))}
              {application.tags.length > 3 && (
                <span className="text-[10px] text-text-placeholder">+{application.tags.length - 3}</span>
              )}
            </div>
          )}
          <div className="flex items-center justify-between gap-2 pt-0.5">
            <StatusBadge status={application.status || 'bookmarked'} />
            {application.date_applied && (
              <span className="text-xs text-text-placeholder whitespace-nowrap">
                {formatDate(application.date_applied)}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
