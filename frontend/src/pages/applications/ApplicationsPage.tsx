import { useState, useEffect, useMemo, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Search, ExternalLink } from 'lucide-react';
import { applicationsApi } from '@/api/applications';
import { useToast } from '@/contexts/ToastContext';
import { Table, Button, EmptyState, Select, PageHeader, TagBadge } from '@/components/common';
import { formatDate } from '@/utils/date';
import { StatusBadge } from '@/components/common/Badge';
import { KanbanBoard } from '@/components/applications/KanbanBoard';
import { ApplicationPanel } from '@/components/applications';
import { EligibilityBadge } from '@/components/applications/EligibilityBadge';
import { tagsApi, type Tag } from '@/api/tags';
import type { Application, ApplicationStatus } from '@/types/application';
import { APPLICATION_STATUSES, REMOTE_TYPES } from '@/types/application';

type ViewMode = 'table' | 'kanban';
type PanelMode = 'create' | 'view' | 'edit';

/**
 * ApplicationsPage - List and manage job applications
 */
export function ApplicationsPage() {
  const { addToast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const pendingOpenId = useRef<number | null>(
    (location.state as { openApplicationId?: number } | null)?.openApplicationId ?? null
  );

  // List state
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | ''>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [tagFilter, setTagFilter] = useState('');

  // Tags for filtering
  const [allTags, setAllTags] = useState<Tag[]>([]);
  useEffect(() => { tagsApi.list().then(setAllTags).catch(() => {}); }, []);

  // Panel state
  const [panelMode, setPanelMode] = useState<PanelMode>('create');
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);

  // Client-side search + tag filtering
  const filteredApplications = useMemo(() => {
    let result = applications;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (app) =>
          app.company_name?.toLowerCase().includes(q) ||
          app.job_title.toLowerCase().includes(q)
      );
    }
    if (tagFilter) {
      const tagId = Number(tagFilter);
      result = result.filter(
        (app) => app.tags?.some((t) => t.id === tagId)
      );
    }
    return result;
  }, [applications, searchQuery, tagFilter]);

  // Fetch applications on mount and when filter changes
  useEffect(() => {
    const fetchApplications = async () => {
      setIsLoading(true);
      try {
        const data = await applicationsApi.list(statusFilter || undefined);
        setApplications(data);
      } catch (err) {
        addToast('Failed to load applications', 'error');
        console.error('Error fetching applications:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchApplications();
  }, [statusFilter]);

  // Auto-open application from navigation state (e.g., from company detail)
  useEffect(() => {
    if (pendingOpenId.current && applications.length > 0) {
      const app = applications.find((a) => a.id === pendingOpenId.current);
      if (app) {
        setSelectedApplication(app);
        setPanelMode('view');
        setIsPanelOpen(true);
      }
      pendingOpenId.current = null;
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [applications]);

  // Table column configuration
  const columns = [
    {
      key: 'company_name' as const,
      header: 'Company',
      sortable: true,
    },
    {
      key: 'job_title' as const,
      header: 'Position',
      sortable: true,
      render: (_value: unknown, row: Application) => (
        <div>
          <span>{row.job_title}</span>
          {row.tags && row.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-0.5">
              {row.tags.slice(0, 3).map((tag) => (
                <TagBadge key={tag.id} name={tag.name} color={tag.color} size="sm" />
              ))}
              {row.tags.length > 3 && (
                <span className="text-[10px] text-text-placeholder">+{row.tags.length - 3}</span>
              )}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'job_url' as const,
      header: '',
      render: (_value: unknown, row: Application) =>
        row.job_url ? (
          <a
            href={row.job_url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-text-placeholder hover:text-primary transition-colors"
            aria-label="Open job listing"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        ) : null,
    },
    {
      key: 'status' as const,
      header: 'Status',
      render: (_value: unknown, row: Application) => <StatusBadge status={row.status || 'bookmarked'} />,
    },
    {
      key: 'eligibility' as const,
      header: 'Eligibility',
      render: (_value: unknown, row: Application) => (
        <EligibilityBadge eligibility={row.eligibility} mode="dot" />
      ),
    },
    {
      key: 'location' as const,
      header: 'Location',
      render: (_value: unknown, row: Application) => {
        const remoteLabel = REMOTE_TYPES.find((r) => r.value === row.remote_type)?.label;
        const text = row.location && remoteLabel
          ? `${row.location} · ${remoteLabel}`
          : row.location || remoteLabel || null;
        return text ? (
          <span className="text-text-muted text-xs whitespace-nowrap">{text}</span>
        ) : null;
      },
    },
    {
      key: 'salary_advertised_min' as const,
      header: 'Salary',
      render: (_value: unknown, row: Application) => {
        if (!row.salary_advertised_min && !row.salary_advertised_max) return null;
        const fmt = (n: number) => (n >= 1000 ? `${Math.round(n / 1000)}k` : String(n));
        const parts: string[] = [];
        if (row.salary_advertised_min) parts.push(fmt(row.salary_advertised_min));
        if (row.salary_advertised_max) parts.push(fmt(row.salary_advertised_max));
        const range = parts.join('–');
        const currency = row.salary_currency?.toUpperCase() || '';
        return (
          <span className="text-text-muted text-xs whitespace-nowrap">
            {range}{currency ? ` ${currency}` : ''}
          </span>
        );
      },
    },
    {
      key: 'source_name' as const,
      header: 'Source',
      sortable: true,
      render: (_value: unknown, row: Application) => (
        <span className="text-text-muted">{row.source_name || '—'}</span>
      ),
    },
    {
      key: 'date_applied' as const,
      header: 'Applied',
      sortable: true,
      render: (_value: unknown, row: Application) => formatDate(row.date_applied) || '—',
    },
  ];

  const handleApplicationClick = (application: Application) => {
    setSelectedApplication(application);
    setPanelMode('view');
    setIsPanelOpen(true);
  };

  const handleAddApplication = () => {
    setSelectedApplication(null);
    setPanelMode('create');
    setIsPanelOpen(true);
  };

  const handleApplicationUpdate = (updated: Application) => {
    setApplications((prev) =>
      prev.map((app) => (app.id === updated.id ? updated : app))
    );
    setSelectedApplication(updated);
  };

  const handleApplicationDelete = (id: number) => {
    setApplications((prev) => prev.filter((app) => app.id !== id));
  };

  const filterOptions = [
    { value: '', label: 'All Statuses' },
    ...APPLICATION_STATUSES,
  ];

  return (
    <div>
      <PageHeader
        title="Applications"
        subtitle="Track and manage your job applications"
        action={<Button onClick={handleAddApplication}>+ Add Application</Button>}
      />

      {/* Filters and View Toggle */}
      <div className="flex flex-wrap items-end gap-3 mb-4">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-placeholder pointer-events-none" />
          <input
            type="text"
            placeholder="Search by company or title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-9 pr-3 py-2 rounded-[var(--radius-md)] border border-border shadow-sm text-sm bg-surface text-text placeholder:text-text-placeholder focus:outline-none focus:ring-2 focus:ring-border-focus focus:border-border-focus"
            aria-label="Search applications"
          />
        </div>

        {/* Status filter */}
        <div className="min-w-[180px]">
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as ApplicationStatus | '')}
            options={filterOptions}
            aria-label="Filter by status"
          />
        </div>

        {/* Tag filter */}
        {allTags.length > 0 && (
          <div className="min-w-[150px]">
            <Select
              value={tagFilter}
              onChange={(e) => setTagFilter(e.target.value)}
              options={[
                { value: '', label: 'All Tags' },
                ...allTags.map((t) => ({ value: String(t.id), label: t.name })),
              ]}
              aria-label="Filter by tag"
            />
          </div>
        )}

        {/* View Toggle */}
        <div className="flex items-center gap-1 bg-surface-alt p-1 rounded-[var(--radius-lg)] ml-auto">
          <button
            onClick={() => setViewMode('table')}
            aria-label="Switch to table view"
            className={`px-3 py-1.5 text-sm font-medium rounded-[var(--radius-md)] transition-colors ${
              viewMode === 'table'
                ? 'bg-surface text-text shadow-sm'
                : 'text-text-secondary hover:text-text'
            }`}
          >
            Table
          </button>
          <button
            onClick={() => setViewMode('kanban')}
            aria-label="Switch to kanban view"
            className={`px-3 py-1.5 text-sm font-medium rounded-[var(--radius-md)] transition-colors ${
              viewMode === 'kanban'
                ? 'bg-surface text-text shadow-sm'
                : 'text-text-secondary hover:text-text'
            }`}
          >
            Kanban
          </button>
        </div>
      </div>

      {/* Applications View (Table or Kanban) */}
      {viewMode === 'table' ? (
        !isLoading && filteredApplications.length === 0 ? (
          <EmptyState
            title={searchQuery ? 'No matching applications' : 'No applications yet'}
            description={
              searchQuery
                ? 'Try a different search term or clear the filter.'
                : 'Start tracking your job search by adding your first application.'
            }
            action={
              searchQuery
                ? { label: 'Clear Search', onClick: () => setSearchQuery('') }
                : { label: 'Add Application', onClick: handleAddApplication }
            }
          />
        ) : (
          <Table
            data={filteredApplications}
            columns={columns}
            onRowClick={handleApplicationClick}
            loading={isLoading}
          />
        )
      ) : (
        <KanbanBoard
          applications={filteredApplications}
          setApplications={setApplications}
          isLoading={isLoading}
          onError={(msg) => addToast(msg, 'error')}
          onCardClick={handleApplicationClick}
          onAddApplication={handleAddApplication}
        />
      )}

      {/* Application Panel (create / view / edit) */}
      <ApplicationPanel
        mode={panelMode}
        application={selectedApplication}
        isOpen={isPanelOpen}
        onClose={() => setIsPanelOpen(false)}
        onCreated={(app) => setApplications((prev) => [app, ...prev])}
        onUpdated={handleApplicationUpdate}
        onDeleted={handleApplicationDelete}
      />
    </div>
  );
}
