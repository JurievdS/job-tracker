import { useState, useEffect, useMemo } from 'react';
import type { ReminderWithDetails, CreateReminderDto } from '@/types/reminder';
import type { Application } from '@/types/application';
import { remindersApi } from '@/api/reminders';
import { applicationsApi } from '@/api/applications';
import { Button, Input, Textarea, Select, Modal, Form, Table, Badge } from '@/components/common';

export function RemindersPage() {
  // Reminders list state
  const [reminders, setReminders] = useState<ReminderWithDetails[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [showPendingOnly, setShowPendingOnly] = useState(false);

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
      setError('Failed to fetch reminders');
      console.error('Failed to fetch reminders', err);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [remindersData, applicationsData] = await Promise.all([
          remindersApi.list(showPendingOnly ? true : undefined),
          applicationsApi.list(),
        ]);
        setReminders(remindersData);
        setApplications(applicationsData);
      } catch (err) {
        setError('Failed to fetch data');
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
        label: `${a.position_title} at ${a.company_name}`,
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

  const formatDate = (dateStr: string | null): string => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString();
  };

  const resetForm = () => {
    setFormApplicationId('');
    setFormDate('');
    setFormMessage('');
    setError(null);
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
      setError('Please select an application');
      return;
    }

    if (!formDate) {
      setError('Please select a date');
      return;
    }

    if (!formMessage.trim()) {
      setError('Please enter a message');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const createData: CreateReminderDto = {
        application_id: Number(formApplicationId),
        reminder_date: formDate,
        message: formMessage.trim(),
      };

      await remindersApi.create(createData);

      // Refetch to get the new reminder with details
      await fetchReminders();
      handleCloseModal();
    } catch (err) {
      setError('Failed to create reminder');
      console.error('Submit error', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMarkComplete = async (reminder: ReminderWithDetails, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await remindersApi.markComplete(reminder.id);
      // Update local state
      setReminders((prev) =>
        prev.map((r) => (r.id === reminder.id ? { ...r, completed: true } : r))
      );
    } catch (err) {
      setError('Failed to mark reminder as complete');
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
    } catch (err) {
      setError('Failed to delete reminder');
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
      render: (value: string | null) => value || '-',
    },
    {
      key: 'position_title' as const,
      header: 'Position',
      width: 'w-1/5',
    },
    {
      key: 'company_name' as const,
      header: 'Company',
      width: 'w-1/6',
    },
    {
      key: 'reminder_date' as const,
      header: 'Date',
      width: 'w-24',
      render: (value: string | null, row: ReminderWithDetails) => (
        <span className={isOverdue(row) ? 'text-red-600 font-medium' : ''}>
          {formatDate(value)}
        </span>
      ),
    },
    {
      key: 'completed' as const,
      header: 'Status',
      width: 'w-24',
      render: (value: boolean | null, row: ReminderWithDetails) => {
        if (value) {
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
      header: 'Actions',
      width: 'w-40',
      render: (_: number, row: ReminderWithDetails) => (
        <div className="flex gap-2">
          {!row.completed && (
            <Button
              variant="secondary"
              onClick={(e: React.MouseEvent) => handleMarkComplete(row, e)}
            >
              Complete
            </Button>
          )}
          <Button
            variant="danger"
            onClick={(e: React.MouseEvent) => handleDeleteClick(row, e)}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="h-full flex flex-col">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reminders</h1>
          <p className="text-sm text-gray-500 mt-1">
            Track follow-ups and important dates for your applications
          </p>
        </div>
        <Button onClick={handleOpenAddModal}>+ Add Reminder</Button>
      </div>

      {/* Filter */}
      <div className="mb-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={showPendingOnly}
            onChange={(e) => setShowPendingOnly(e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700">Show pending only</span>
        </label>
      </div>

      {/* Error State */}
      {error && !isModalOpen && (
        <div className="mb-4 bg-red-50 text-red-700 p-4 rounded-md">
          {error}
        </div>
      )}

      {/* Reminders Table */}
      <div className="flex-1">
        <Table
          data={reminders}
          columns={columns}
          loading={loading}
        />
        {!loading && (
          <div className="mt-3 text-xs text-gray-500 text-center">
            {reminders.length} reminder{reminders.length !== 1 ? 's' : ''}
          </div>
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
            {error && (
              <div className="bg-red-50 text-red-700 p-3 rounded-md text-sm">
                {error}
              </div>
            )}

            <Select
              label="Application"
              options={applicationOptions}
              value={formApplicationId}
              onChange={(e) => setFormApplicationId(e.target.value)}
              required
            />

            <Input
              label="Reminder Date"
              type="date"
              value={formDate}
              onChange={(e) => setFormDate(e.target.value)}
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
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            Are you sure you want to delete this reminder?
          </p>
          {reminderToDelete && (
            <div className="bg-gray-50 p-3 rounded-md text-sm">
              <p className="font-medium">{reminderToDelete.message}</p>
              <p className="text-gray-500 mt-1">
                {reminderToDelete.position_title} at {reminderToDelete.company_name}
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
