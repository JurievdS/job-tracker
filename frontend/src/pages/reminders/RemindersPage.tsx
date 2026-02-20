import { useState, useEffect, useMemo } from 'react';
import type { ReminderWithDetails, CreateReminderDto } from '@/types/reminder';
import type { Application } from '@/types/application';
import { remindersApi } from '@/api/reminders';
import { applicationsApi } from '@/api/applications';
import { useToast } from '@/contexts/ToastContext';
import { parseApiError } from '@/utils/errors';
import { formatDate } from '@/utils/date';
import { Search, Plus, Trash2, Check, Bell } from 'lucide-react';
import { Button, Input, Textarea, Select, Modal, Form, Table, Badge, PageHeader, EmptyState, Alert, DateInput, Tooltip } from '@/components/common';

export function RemindersPage() {
  const { addToast } = useToast();

  // Reminders list state
  const [reminders, setReminders] = useState<ReminderWithDetails[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);

  // Filter state
  const [showPendingOnly, setShowPendingOnly] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [formApplicationId, setFormApplicationId] = useState<string>('');
  const [formDate, setFormDate] = useState('');
  const [formMessage, setFormMessage] = useState('');

  // Delete confirmation state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [reminderToDelete, setReminderToDelete] = useState<ReminderWithDetails | null>(null);

  const fetchReminders = async () => {
    try {
      const data = await remindersApi.list(showPendingOnly ? true : undefined);
      setReminders(data);
    } catch (err) {
      addToast('Failed to fetch reminders', 'error');
      console.error('Failed to fetch reminders', err);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [remindersData, applicationsData] = await Promise.all([
          remindersApi.list(showPendingOnly ? true : undefined),
          applicationsApi.list(),
        ]);
        setReminders(remindersData);
        setApplications(applicationsData);
      } catch (err) {
        addToast('Failed to fetch data', 'error');
        console.error('Failed to fetch data', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Refetch when filter changes
  useEffect(() => {
    if (!loading) {
      fetchReminders();
    }
  }, [showPendingOnly]);

  const applicationOptions = useMemo(() => {
    return [
      { value: '', label: 'Select an application...' },
      ...applications.map((a) => ({
        value: String(a.id),
        label: `${a.job_title} at ${a.company_name}`,
      })),
    ];
  }, [applications]);

  const isOverdue = (reminder: ReminderWithDetails): boolean => {
    if (!reminder.reminder_date || reminder.completed) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const reminderDate = new Date(reminder.reminder_date);
    return reminderDate < today;
  };

  // Client-side search filtering
  const filteredReminders = useMemo(() => {
    if (!searchTerm.trim()) return reminders;
    const term = searchTerm.toLowerCase();
    return reminders.filter(
      (r) =>
        r.message?.toLowerCase().includes(term) ||
        r.job_title.toLowerCase().includes(term) ||
        r.company_name.toLowerCase().includes(term)
    );
  }, [reminders, searchTerm]);

  const resetForm = () => {
    setFormApplicationId('');
    setFormDate('');
    setFormMessage('');
    setFormError(null);
  };

  const handleOpenAddModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formApplicationId) {
      setFormError('Please select an application');
      return;
    }

    if (!formDate) {
      setFormError('Please select a date');
      return;
    }

    if (!formMessage.trim()) {
      setFormError('Please enter a message');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    try {
      const createData: CreateReminderDto = {
        application_id: Number(formApplicationId),
        reminder_date: formDate,
        message: formMessage.trim(),
      };

      await remindersApi.create(createData);

      addToast('Reminder created', 'success');
      await fetchReminders();
      handleCloseModal();
    } catch (err) {
      setFormError(parseApiError(err, 'Failed to create reminder'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMarkComplete = async (reminder: ReminderWithDetails, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await remindersApi.markComplete(reminder.id);
      setReminders((prev) =>
        prev.map((r) => (r.id === reminder.id ? { ...r, completed: true } : r))
      );
      addToast('Reminder completed', 'success');
    } catch (err) {
      addToast('Failed to mark reminder as complete', 'error');
      console.error('Complete error', err);
    }
  };

  const handleDeleteClick = (reminder: ReminderWithDetails, e: React.MouseEvent) => {
    e.stopPropagation();
    setReminderToDelete(reminder);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!reminderToDelete) return;

    setIsSubmitting(true);
    try {
      await remindersApi.delete(reminderToDelete.id);
      setReminders((prev) => prev.filter((r) => r.id !== reminderToDelete.id));
      setIsDeleteModalOpen(false);
      setReminderToDelete(null);
      addToast('Reminder deleted', 'success');
    } catch (err) {
      addToast('Failed to delete reminder', 'error');
      console.error('Delete error', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns = [
    {
      key: 'message' as const,
      header: 'Message',
      width: 'w-1/3',
      sortable: true,
      render: (_value: unknown, row: ReminderWithDetails) => (
        <span className={row.completed ? 'text-text-muted line-through' : ''}>
          {row.message ? (row.message.length > 60 ? row.message.substring(0, 60) + '...' : row.message) : '-'}
        </span>
      ),
    },
    {
      key: 'job_title' as const,
      header: 'Position',
      width: 'w-1/5',
      sortable: true,
    },
    {
      key: 'company_name' as const,
      header: 'Company',
      width: 'w-1/6',
      sortable: true,
    },
    {
      key: 'reminder_date' as const,
      header: 'Date',
      width: 'w-28',
      sortable: true,
      render: (_value: unknown, row: ReminderWithDetails) => (
        <span className={isOverdue(row) ? 'text-danger font-medium' : ''}>
          {formatDate(row.reminder_date) || '-'}
        </span>
      ),
    },
    {
      key: 'completed' as const,
      header: 'Status',
      width: 'w-24',
      render: (_value: unknown, row: ReminderWithDetails) => {
        if (row.completed) {
          return <Badge variant="success">Completed</Badge>;
        }
        if (isOverdue(row)) {
          return <Badge variant="danger">Overdue</Badge>;
        }
        return <Badge variant="warning">Pending</Badge>;
      },
    },
    {
      key: 'id' as const,
      header: '',
      width: 'w-20',
      render: (_value: unknown, row: ReminderWithDetails) => (
        <div className="flex gap-1">
          {!row.completed && (
            <Tooltip content="Mark complete">
              <Button
                variant="ghost"
                size="sm"
                onClick={(e: React.MouseEvent) => handleMarkComplete(row, e)}
                aria-label="Mark as complete"
                className="text-text-placeholder hover:text-success"
              >
                <Check className="w-4 h-4" />
              </Button>
            </Tooltip>
          )}
          <Tooltip content="Delete">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e: React.MouseEvent) => handleDeleteClick(row, e)}
              aria-label="Delete reminder"
              className="text-text-placeholder hover:text-danger"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </Tooltip>
        </div>
      ),
    },
  ];

  return (
    <div className="h-full flex flex-col">
      <PageHeader
        title="Reminders"
        subtitle="Track follow-ups and important dates for your applications"
        action={<Button onClick={handleOpenAddModal} icon={<Plus className="w-4 h-4" />}>Add Reminder</Button>}
      />

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3 mb-4">
        <div className="flex-1 min-w-[200px]">
          <Input
            placeholder="Search reminders..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            startElement={<Search className="w-4 h-4" />}
            aria-label="Search reminders"
          />
        </div>
        <label className="flex items-center gap-2 cursor-pointer px-2">
          <input
            type="checkbox"
            checked={showPendingOnly}
            onChange={(e) => setShowPendingOnly(e.target.checked)}
            className="rounded border-border text-primary focus:ring-primary"
          />
          <span className="text-sm text-text-secondary whitespace-nowrap">Pending only</span>
        </label>
      </div>

      {/* Reminders Table */}
      <div className="flex-1">
        {!loading && filteredReminders.length === 0 ? (
          <EmptyState
            icon={<Bell className="w-12 h-12" />}
            title={searchTerm || showPendingOnly ? 'No matching reminders' : 'No reminders yet'}
            description={
              searchTerm || showPendingOnly
                ? 'Try a different search term or clear the filters.'
                : 'Create a reminder to track follow-ups for your applications.'
            }
            action={
              searchTerm || showPendingOnly
                ? { label: 'Clear Filters', onClick: () => { setSearchTerm(''); setShowPendingOnly(false); } }
                : { label: 'Add Reminder', onClick: handleOpenAddModal }
            }
          />
        ) : (
          <>
            <Table
              data={filteredReminders}
              columns={columns}
              loading={loading}
            />
            {!loading && (
              <div className="mt-3 pt-3 border-t border-border text-xs text-text-muted text-center">
                {filteredReminders.length} of {reminders.length} reminder{reminders.length !== 1 ? 's' : ''}
              </div>
            )}
          </>
        )}
      </div>

      {/* Add Reminder Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title="Add Reminder"
      >
        <Form onSubmit={handleSubmit}>
          <div className="space-y-4">
            {formError && (
              <Alert variant="danger">{formError}</Alert>
            )}

            <Select
              label="Application"
              options={applicationOptions}
              value={formApplicationId}
              onChange={(e) => setFormApplicationId(e.target.value)}
              required
            />

            <DateInput
              label="Reminder Date"
              value={formDate}
              onChange={(e) => setFormDate(e.target.value)}
              showRelative
              warnPast
              required
            />

            <Textarea
              label="Message"
              value={formMessage}
              onChange={(e) => setFormMessage(e.target.value)}
              placeholder="What do you need to remember?"
              rows={3}
              required
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={handleCloseModal}
              >
                Cancel
              </Button>
              <Button type="submit" loading={isSubmitting}>
                Add Reminder
              </Button>
            </div>
          </div>
        </Form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Reminder"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-text-secondary">
            Are you sure you want to delete this reminder?
          </p>
          {reminderToDelete && (
            <div className="bg-surface-alt p-3 rounded-[var(--radius-md)] text-sm">
              <p className="font-medium text-text">{reminderToDelete.message}</p>
              <p className="text-text-muted mt-1">
                {reminderToDelete.job_title} at {reminderToDelete.company_name}
              </p>
            </div>
          )}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="secondary"
              onClick={() => setIsDeleteModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleConfirmDelete}
              loading={isSubmitting}
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
