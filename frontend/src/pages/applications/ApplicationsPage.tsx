import { useState, useEffect } from 'react';
import { applicationsApi } from '@/api/applications';
import { companiesApi } from '@/api/companies';
import {
  Table, Button, EmptyState, Select, Modal, Form, Input, Textarea, Autocomplete, DateInput, type AutocompleteOption
} from '@/components/common';
import { today } from '@/utils/date';
import { StatusBadge } from '@/components/common/Badge';
import { KanbanBoard, ApplicationDetailModal } from '@/components/applications/KanbanBoard';
import type { Application, ApplicationStatus } from '@/types/application';
import { APPLICATION_STATUSES } from '@/types/application';

type ViewMode = 'table' | 'kanban';

/**
 * ApplicationsPage - List and manage job applications
 */
export function ApplicationsPage() {
  // State
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | ''>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [positionTitle, setPositionTitle] = useState('');
  const [dateApplied, setDateApplied] = useState(today());
  const [status, setStatus] = useState<ApplicationStatus>('bookmarked');
  const [notes, setNotes] = useState('');
  const [company, setCompany] = useState<AutocompleteOption | null>(null);
  const [companies, setCompanies] = useState<AutocompleteOption[]>([]);

  // View mode and detail modal state
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!company) {
      setError('Please select a company');
      return;
    }

    if (!positionTitle.trim()) {
      setError('Please enter a position title');
      return;
    }

    try {
      const newApp = await applicationsApi.quickCreate({
        company_name: company.label,
        position_title: positionTitle,
        status,
        date_applied: dateApplied || undefined,
        notes: notes || undefined,
      });

      // Add to list and close modal
      setApplications(prev => [newApp, ...prev]);
      setIsModalOpen(false);

      // Reset form
      setCompany(null);
      setPositionTitle('');
      setDateApplied(today());
      setStatus('bookmarked');
      setNotes('');
      setError(null);
    } catch (err) {
      setError('Failed to create application');
      console.error('Error creating application:', err);
    }
  };

  // Fetch applications on mount and when filter changes
  useEffect(() => {
    const fetchApplications = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const data = await applicationsApi.list(statusFilter || undefined);
        setApplications(data);
      } catch (err) {
        setError('Failed to load applications');
        console.error('Error fetching applications:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchApplications();
  }, [statusFilter]);

  // Table column configuration
  const columns = [
    {
      key: 'company_name' as const,
      header: 'Company',
    },
    {
      key: 'position_title' as const,
      header: 'Position',
    },
    {
      key: 'status' as const,
      header: 'Status',
      render: (_value: unknown, row: Application) => <StatusBadge status={row.status} />,
    },
    {
      key: 'date_applied' as const,
      header: 'Applied',
      render: (_value: unknown, row: Application) =>
        row.date_applied ? new Date(row.date_applied).toLocaleDateString() : '—',
    },
    {
      key: 'updated_at' as const,
      header: 'Last Updated',
      render: (_value: unknown, row: Application) =>
        new Date(row.updated_at).toLocaleDateString(),
    },
  ];

  // Handle row/card click - open detail modal
  const handleApplicationClick = (application: Application) => {
    setSelectedApplication(application);
    setIsDetailModalOpen(true);
  };

  // Handle application update from detail modal
  const handleApplicationUpdate = (updated: Application) => {
    setApplications((prev) =>
      prev.map((app) => (app.id === updated.id ? updated : app))
    );
  };

  // Handle application delete from detail modal
  const handleApplicationDelete = (id: number) => {
    setApplications((prev) => prev.filter((app) => app.id !== id));
  };

  // Handle add new application
  const handleAddApplication = () => {
    setIsModalOpen(true);
  };

  // Filter options including "All" option
  const filterOptions = [
    { value: '', label: 'All Statuses' },
    ...APPLICATION_STATUSES,
  ];

  const handleSearch = async (term: string) => {
    const results = await companiesApi.search(term);
    const options = results.map((c: { name: string }) => ({ value: c.name, label: c.name }));
    setCompanies(options);
    
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Applications</h1>
          <p className="text-sm text-gray-500 mt-1">
            Track and manage your job applications
          </p>
        </div>
        <Button onClick={handleAddApplication}>
          + Add Application
        </Button>
      </div>

      {/* Filters and View Toggle */}
      <div className="flex items-center justify-between gap-4">
        <div className="w-48">
          <Select
            label="Filter by Status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as ApplicationStatus | '')}
            options={filterOptions}
          />
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setViewMode('table')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              viewMode === 'table'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Table
          </button>
          <button
            onClick={() => setViewMode('kanban')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              viewMode === 'kanban'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Kanban
          </button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-md">
          {error}
        </div>
      )}

      {/* Applications View (Table or Kanban) */}
      {viewMode === 'table' ? (
        /* Table View */
        !isLoading && applications.length === 0 ? (
          <EmptyState
            title="No applications yet"
            description="Start tracking your job search by adding your first application."
            action={{
              label: 'Add Application',
              onClick: handleAddApplication,
            }}
          />
        ) : (
          <Table
            data={applications}
            columns={columns}
            onRowClick={handleApplicationClick}
            loading={isLoading}
          />
        )
      ) : (
        /* Kanban View */
        <KanbanBoard
          applications={applications}
          setApplications={setApplications}
          isLoading={isLoading}
          error={error}
          onError={setError}
          onCardClick={handleApplicationClick}
          onAddApplication={handleAddApplication}
        />
      )}

      {/* Application Detail Modal */}
      <ApplicationDetailModal
        application={selectedApplication}
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        onUpdate={handleApplicationUpdate}
        onDelete={handleApplicationDelete}
      />

      <Modal 
        title="Add New Application" 
        onClose={() => setIsModalOpen(false)} 
        isOpen={isModalOpen} >
          <Form title="New Application" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <Autocomplete
                label="Company"
                value={company}
                onChange={setCompany}
                onSearch={handleSearch}
                options={companies}
                allowCreate
                onCreateNew={(name) => {
                  const newOption = { value: name, label: name };
                  setCompanies((prev) => [...prev, newOption]);
                  setCompany(newOption);
                }}
              />
              <Input 
                label="Position Title"
                value={positionTitle}
                onChange={(e) => setPositionTitle(e.target.value)}
                placeholder="Enter position title"
              />
              <DateInput
                label="Date Applied"
                value={dateApplied}
                onChange={(e) => setDateApplied(e.target.value)}
              />
              <Select
                label="Status"
                value={status}
                onChange={(e) => setStatus(e.target.value as ApplicationStatus)}
                options={APPLICATION_STATUSES}
              />
              <Textarea 
                label="Notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Additional notes"
              />
              <div className="flex justify-end">
                <Button type="submit">Save Application</Button>
              </div>
            </div>
          </Form>
    </Modal>
    </div>
  );
}
