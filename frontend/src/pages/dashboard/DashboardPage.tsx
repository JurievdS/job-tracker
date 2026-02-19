import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, FileText, MessageSquare, Clock } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/contexts/ToastContext';
import { applicationsApi } from '@/api/applications';
import { remindersApi } from '@/api/reminders';
import { interactionsApi } from '@/api/interactions';
import { PageHeader, Card, EmptyState, Button } from '@/components/common';
import { StatusBadge } from '@/components/common/Badge';
import { ROUTES } from '@/routes/routes';
import { formatDate } from '@/utils/date';
import type { ApplicationStatus, Application, SourceMetric } from '@/types/application';
import type { ReminderWithDetails } from '@/types/reminder';
import type { InteractionWithDetails } from '@/types/interaction';
import { INTERACTION_TYPES } from '@/types/interaction';

const PIPELINE_STATUSES: { key: ApplicationStatus; label: string; color: string }[] = [
  { key: 'bookmarked', label: 'Bookmarked', color: 'bg-status-bookmarked' },
  { key: 'applied', label: 'Applied', color: 'bg-status-applied' },
  { key: 'phone_screen', label: 'Phone Screen', color: 'bg-status-phone_screen' },
  { key: 'technical', label: 'Technical', color: 'bg-status-technical' },
  { key: 'final_round', label: 'Final Round', color: 'bg-status-final_round' },
  { key: 'offer', label: 'Offer', color: 'bg-status-offer' },
  { key: 'rejected', label: 'Rejected', color: 'bg-status-rejected' },
];

export function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [counts, setCounts] = useState<Partial<Record<ApplicationStatus, number>>>({});
  const [recentApps, setRecentApps] = useState<Application[]>([]);
  const [reminders, setReminders] = useState<ReminderWithDetails[]>([]);
  const [recentInteractions, setRecentInteractions] = useState<InteractionWithDetails[]>([]);
  const [sourceMetrics, setSourceMetrics] = useState<SourceMetric[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setLoadFailed(false);
    try {
      const [countsData, appsData, remindersData, interactionsData, sourceData] = await Promise.all([
        applicationsApi.getCountsByStatus(),
        applicationsApi.list(),
        remindersApi.list(true),
        interactionsApi.list(),
        applicationsApi.getSourceMetrics(),
      ]);

      setCounts(countsData);
      setSourceMetrics(sourceData);

      const sorted = [...appsData].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      setRecentApps(sorted.slice(0, 5));

      setReminders(remindersData.slice(0, 5));

      const sortedInteractions = [...interactionsData].sort(
        (a, b) =>
          new Date(b.interaction_date || b.created_at).getTime() -
          new Date(a.interaction_date || a.created_at).getTime()
      );
      setRecentInteractions(sortedInteractions.slice(0, 5));
    } catch {
      setLoadFailed(true);
      addToast('Failed to load dashboard data', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleMarkComplete = async (id: number) => {
    try {
      await remindersApi.markComplete(id);
      setReminders((prev) => prev.filter((r) => r.id !== id));
    } catch {
      // Silently fail — user can retry from reminders page
    }
  };

  // Derived stats
  const total = Object.values(counts).reduce((sum, n) => sum + (n || 0), 0);
  const active = (counts.bookmarked || 0) + (counts.applied || 0);
  const interviewing = (counts.phone_screen || 0) + (counts.technical || 0) + (counts.final_round || 0);
  const offers = counts.offer || 0;

  const isOverdue = (dateStr: string | null): boolean => {
    if (!dateStr) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return new Date(dateStr) < today;
  };

  const getInteractionTypeLabel = (type: string): string => {
    return INTERACTION_TYPES.find((t) => t.value === type)?.label || type;
  };

  // Loading skeleton
  if (isLoading) {
    return (
      <div>
        <PageHeader
          title="Dashboard"
          subtitle={`Welcome back, ${user?.name || user?.email || 'User'}!`}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-surface rounded-[var(--radius-lg)] shadow-sm border border-border p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-surface-alt rounded w-24 mb-3" />
                <div className="h-8 bg-surface-alt rounded w-16" />
              </div>
            </div>
          ))}
        </div>
        <div className="bg-surface rounded-[var(--radius-lg)] shadow-sm border border-border p-6 mb-6">
          <div className="animate-pulse">
            <div className="h-4 bg-surface-alt rounded w-32 mb-4" />
            <div className="h-6 bg-surface-alt rounded w-full" />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3 bg-surface rounded-[var(--radius-lg)] shadow-sm border border-border p-4">
            <div className="animate-pulse space-y-3">
              <div className="h-5 bg-surface-alt rounded w-40 mb-4" />
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-10 bg-surface-alt rounded" />
              ))}
            </div>
          </div>
          <div className="lg:col-span-2 space-y-6">
            {[1, 2].map((i) => (
              <div key={i} className="bg-surface rounded-[var(--radius-lg)] shadow-sm border border-border p-4">
                <div className="animate-pulse space-y-3">
                  <div className="h-5 bg-surface-alt rounded w-36" />
                  {[1, 2].map((j) => (
                    <div key={j} className="h-10 bg-surface-alt rounded" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Error state — show page header + empty state with retry
  if (loadFailed) {
    return (
      <div>
        <PageHeader
          title="Dashboard"
          subtitle={`Welcome back, ${user?.name || user?.email || 'User'}!`}
        />
        <EmptyState
          title="Unable to load dashboard"
          description="Something went wrong while fetching your data."
          action={{ label: 'Retry', onClick: fetchData }}
        />
      </div>
    );
  }

  // Empty state — no applications at all
  if (total === 0) {
    return (
      <div>
        <PageHeader
          title="Dashboard"
          subtitle={`Welcome back, ${user?.name || user?.email || 'User'}!`}
        />
        <EmptyState
          title="No applications yet"
          description="Start tracking your job search by adding your first application."
          action={{
            label: 'Add Application',
            onClick: () => navigate(ROUTES.APPLICATIONS),
          }}
        />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle={`Welcome back, ${user?.name || user?.email || 'User'}!`}
      />

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="Total Applications" value={total} color="blue" />
        <StatCard title="Active" value={active} subtitle="Bookmarked + Applied" color="green" />
        <StatCard title="Interviewing" value={interviewing} subtitle="Phone → Final Round" color="purple" />
        <StatCard title="Offers" value={offers} color="yellow" />
      </div>

      {/* Pipeline Bar */}
      <PipelineBar counts={counts} total={total} />

      {/* Two-column grid: Recent Apps + Reminders/Interactions */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left: Recent Applications */}
        <Card title="Recent Applications" className="lg:col-span-3">
          {recentApps.length === 0 ? (
            <p className="text-sm text-text-muted py-4 text-center">
              No applications yet
            </p>
          ) : (
            <div className="divide-y divide-border">
              {recentApps.map((app) => (
                <div
                  key={app.id}
                  className="flex items-center gap-3 py-3 first:pt-0 last:pb-0 cursor-pointer hover:bg-surface-alt -mx-4 px-4 transition-colors"
                  onClick={() => navigate(ROUTES.APPLICATIONS)}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text truncate">
                      {app.job_title}
                    </p>
                    <p className="text-xs text-text-muted truncate">
                      {app.company_name || 'Unknown company'}
                      {app.date_applied && ` · Applied ${formatDate(app.date_applied)}`}
                    </p>
                  </div>
                  {app.status && <StatusBadge status={app.status} />}
                </div>
              ))}
            </div>
          )}
          {recentApps.length > 0 && (
            <div className="mt-3 pt-3 border-t border-border">
              <button
                onClick={() => navigate(ROUTES.APPLICATIONS)}
                className="text-sm text-primary hover:underline"
              >
                View all applications
              </button>
            </div>
          )}
        </Card>

        {/* Right column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Upcoming Reminders */}
          <Card title="Upcoming Reminders">
            {reminders.length === 0 ? (
              <p className="text-sm text-text-muted py-4 text-center">
                No pending reminders
              </p>
            ) : (
              <div className="divide-y divide-border">
                {reminders.map((reminder) => (
                  <div key={reminder.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text">
                        {reminder.message}
                      </p>
                      <p className="text-xs text-text-muted truncate">
                        {reminder.job_title} at {reminder.company_name}
                      </p>
                      <p className={`text-xs mt-0.5 ${isOverdue(reminder.reminder_date) ? 'text-danger font-medium' : 'text-text-placeholder'}`}>
                        {isOverdue(reminder.reminder_date) ? 'Overdue · ' : ''}{formatDate(reminder.reminder_date) || '-'}
                      </p>
                    </div>
                    <button
                      onClick={() => handleMarkComplete(reminder.id)}
                      className="p-1.5 rounded-[var(--radius-md)] text-text-placeholder hover:text-success hover:bg-success-light transition-colors flex-shrink-0"
                      title="Mark complete"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            {reminders.length > 0 && (
              <div className="mt-3 pt-3 border-t border-border">
                <button
                  onClick={() => navigate(ROUTES.REMINDERS)}
                  className="text-sm text-primary hover:underline"
                >
                  View all reminders
                </button>
              </div>
            )}
          </Card>

          {/* Recent Interactions */}
          <Card title="Recent Interactions">
            {recentInteractions.length === 0 ? (
              <p className="text-sm text-text-muted py-4 text-center">
                No interactions yet
              </p>
            ) : (
              <div className="divide-y divide-border">
                {recentInteractions.map((interaction) => (
                  <div key={interaction.id} className="py-3 first:pt-0 last:pb-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-medium text-text-secondary">
                        {getInteractionTypeLabel(interaction.interaction_type)}
                      </span>
                      <span className="text-xs text-text-placeholder">
                        {formatDate(interaction.interaction_date) || '-'}
                      </span>
                    </div>
                    <p className="text-xs text-text-muted truncate">
                      {interaction.job_title} at {interaction.company_name}
                      {interaction.contact_name && ` · ${interaction.contact_name}`}
                    </p>
                  </div>
                ))}
              </div>
            )}
            {recentInteractions.length > 0 && (
              <div className="mt-3 pt-3 border-t border-border">
                <button
                  onClick={() => navigate(ROUTES.INTERACTIONS)}
                  className="text-sm text-primary hover:underline"
                >
                  View all interactions
                </button>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-3 gap-4 mt-6">
        {[
          { icon: FileText, label: 'Add Application', route: ROUTES.APPLICATIONS },
          { icon: MessageSquare, label: 'Log Interaction', route: ROUTES.INTERACTIONS },
          { icon: Clock, label: 'Set Reminder', route: ROUTES.REMINDERS },
        ].map(({ icon: Icon, label, route }) => (
          <button
            key={label}
            onClick={() => navigate(route)}
            className="flex flex-col items-center gap-2 p-4 bg-surface rounded-[var(--radius-lg)] shadow-sm border border-border hover:border-primary hover:shadow-md transition-all text-text-muted hover:text-primary"
          >
            <Icon className="w-5 h-5" />
            <span className="text-xs font-medium">{label}</span>
          </button>
        ))}
      </div>

      {/* Top Sources */}
      <TopSources metrics={sourceMetrics} onViewAll={() => navigate(ROUTES.SOURCES)} />
    </div>
  );
}

function StatCard({
  title,
  value,
  subtitle,
  color,
}: {
  title: string;
  value: number;
  subtitle?: string;
  color: 'blue' | 'green' | 'purple' | 'yellow';
}) {
  const colorClasses = {
    blue: 'text-info-text',
    green: 'text-success-text',
    purple: 'text-primary',
    yellow: 'text-warning-text',
  };

  return (
    <div className="bg-surface rounded-[var(--radius-lg)] shadow-sm border border-border p-5">
      <p className="text-sm text-text-muted">{title}</p>
      <p className={`text-3xl font-bold mt-1 ${colorClasses[color]}`}>{value}</p>
      {subtitle && (
        <p className="text-xs text-text-placeholder mt-1">{subtitle}</p>
      )}
    </div>
  );
}

function PipelineBar({
  counts,
  total,
}: {
  counts: Partial<Record<ApplicationStatus, number>>;
  total: number;
}) {
  if (total === 0) return null;

  return (
    <div className="bg-surface rounded-[var(--radius-lg)] shadow-sm border border-border p-5 mb-6">
      <h3 className="text-sm font-medium text-text-secondary mb-3">Pipeline</h3>

      {/* Bar */}
      <div className="flex h-3 rounded-full overflow-hidden bg-surface-alt">
        {PIPELINE_STATUSES.map(({ key, color }) => {
          const count = counts[key] || 0;
          if (count === 0) return null;
          const pct = (count / total) * 100;
          return (
            <div
              key={key}
              className={`${color} transition-all duration-500`}
              style={{ width: `${pct}%` }}
              title={`${key.replace(/_/g, ' ')}: ${count}`}
            />
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3">
        {PIPELINE_STATUSES.map(({ key, label, color }) => {
          const count = counts[key] || 0;
          if (count === 0) return null;
          return (
            <div key={key} className="flex items-center gap-1.5 text-xs text-text-muted">
              <div className={`w-2.5 h-2.5 rounded-full ${color}`} />
              <span>{label}</span>
              <span className="font-medium text-text">{count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TopSources({
  metrics,
  onViewAll,
}: {
  metrics: SourceMetric[];
  onViewAll: () => void;
}) {
  const sorted = [...metrics]
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  if (sorted.length === 0) return null;

  const max = sorted[0].total;

  return (
    <Card title="Top Sources" className="mt-6">
      <div className="space-y-3">
        {sorted.map((metric) => (
          <div key={metric.source_id ?? 'unknown'}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-text-secondary">
                {metric.source_name || 'Unknown'}
              </span>
              <span className="text-sm font-medium text-text">
                {metric.total}
              </span>
            </div>
            <div className="h-2 rounded-full bg-surface-alt overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500"
                style={{ width: `${max > 0 ? (metric.total / max) * 100 : 0}%` }}
              />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3 pt-3 border-t border-border">
        <button
          onClick={onViewAll}
          className="text-sm text-primary hover:underline"
        >
          View all sources
        </button>
      </div>
    </Card>
  );
}
