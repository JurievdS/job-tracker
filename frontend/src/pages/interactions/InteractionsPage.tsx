import { useState, useEffect, useMemo } from 'react';
import type {
  InteractionWithDetails,
  CreateInteractionDto,
  UpdateInteractionDto,
  InteractionType,
} from '@/types/interaction';
import { INTERACTION_TYPES } from '@/types/interaction';
import type { Application } from '@/types/application';
import type { Contact } from '@/types/contact';
import { interactionsApi } from '@/api/interactions';
import { applicationsApi } from '@/api/applications';
import { contactsApi } from '@/api/contacts';
import { Button, Input, Textarea, Select, Modal, Form, Table, Badge } from '@/components/common';

export function InteractionsPage() {
  // Data state
  const [interactions, setInteractions] = useState<InteractionWithDetails[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [filterApplicationId, setFilterApplicationId] = useState<string>('');

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingInteraction, setEditingInteraction] = useState<InteractionWithDetails | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [formApplicationId, setFormApplicationId] = useState<string>('');
  const [formContactId, setFormContactId] = useState<string>('');
  const [formType, setFormType] = useState<string>('email');
  const [formDate, setFormDate] = useState('');
  const [formNotes, setFormNotes] = useState('');

  // Delete confirmation state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [interactionToDelete, setInteractionToDelete] = useState<InteractionWithDetails | null>(null);

  const fetchInteractions = async () => {
    try {
      const applicationId = filterApplicationId ? Number(filterApplicationId) : undefined;
      const data = await interactionsApi.list(applicationId);
      setInteractions(data);
    } catch (err) {
      setError('Failed to fetch interactions');
      console.error('Failed to fetch interactions', err);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [interactionsData, applicationsData, contactsData] = await Promise.all([
          interactionsApi.list(),
          applicationsApi.list(),
          contactsApi.list(),
        ]);
        setInteractions(interactionsData);
        setApplications(applicationsData);
        setContacts(contactsData);
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
      fetchInteractions();
    }
  }, [filterApplicationId]);

  const applicationFilterOptions = useMemo(() => {
    return [
      { value: '', label: 'All Applications' },
      ...applications.map((a) => ({
        value: String(a.id),
        label: `${a.position_title} at ${a.company_name}`,
      })),
    ];
  }, [applications]);

  const applicationFormOptions = useMemo(() => {
    return [
      { value: '', label: 'Select an application...' },
      ...applications.map((a) => ({
        value: String(a.id),
        label: `${a.position_title} at ${a.company_name}`,
      })),
    ];
  }, [applications]);

  const contactFormOptions = useMemo(() => {
    return [
      { value: '', label: 'No contact (optional)' },
      ...contacts.map((c) => ({
        value: String(c.id),
        label: c.company_name ? `${c.name} (${c.company_name})` : c.name,
      })),
    ];
  }, [contacts]);

  const typeOptions = useMemo(() => {
    return INTERACTION_TYPES.map((t) => ({
      value: t.value,
      label: t.label,
    }));
  }, []);

  const formatDate = (dateStr: string | null): string => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString();
  };

  const getTypeLabel = (type: string): string => {
    const found = INTERACTION_TYPES.find((t) => t.value === type);
    return found ? found.label : type;
  };

  const getTypeBadgeVariant = (type: string): 'default' | 'info' | 'success' | 'warning' | 'danger' => {
    switch (type) {
      case 'email':
        return 'info';
      case 'phone_call':
        return 'success';
      case 'in_person':
        return 'warning';
      case 'video_call':
        return 'default';
      default:
        return 'default';
    }
  };

  const resetForm = () => {
    setFormApplicationId('');
    setFormContactId('');
    setFormType('email');
    setFormDate('');
    setFormNotes('');
    setError(null);
  };

  const handleOpenAddModal = () => {
    setEditingInteraction(null);
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (interaction: InteractionWithDetails) => {
    setEditingInteraction(interaction);
    setFormApplicationId(interaction.application_id ? String(interaction.application_id) : '');
    setFormContactId(interaction.contact_id ? String(interaction.contact_id) : '');
    setFormType(interaction.interaction_type);
    setFormDate(interaction.interaction_date || '');
    setFormNotes(interaction.notes || '');
    setError(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingInteraction(null);
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

    setIsSubmitting(true);
    setError(null);

    try {
      if (editingInteraction) {
        const updateData: UpdateInteractionDto = {
          application_id: Number(formApplicationId),
          contact_id: formContactId ? Number(formContactId) : undefined,
          interaction_type: formType as InteractionType,
          interaction_date: formDate,
          notes: formNotes.trim() || undefined,
        };

        await interactionsApi.update(editingInteraction.id, updateData);
      } else {
        const createData: CreateInteractionDto = {
          application_id: Number(formApplicationId),
          contact_id: formContactId ? Number(formContactId) : undefined,
          interaction_type: formType as InteractionType,
          interaction_date: formDate,
          notes: formNotes.trim() || undefined,
        };

        await interactionsApi.create(createData);
      }

      await fetchInteractions();
      handleCloseModal();
    } catch (err) {
      setError(editingInteraction ? 'Failed to update interaction' : 'Failed to create interaction');
      console.error('Submit error', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (interaction: InteractionWithDetails, e: React.MouseEvent) => {
    e.stopPropagation();
    setInteractionToDelete(interaction);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!interactionToDelete) return;

    setIsSubmitting(true);
    try {
      await interactionsApi.delete(interactionToDelete.id);
      setInteractions((prev) => prev.filter((i) => i.id !== interactionToDelete.id));
      setIsDeleteModalOpen(false);
      setInteractionToDelete(null);
    } catch (err) {
      setError('Failed to delete interaction');
      console.error('Delete error', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns = [
    {
      key: 'interaction_type' as const,
      header: 'Type',
      width: 'w-28',
      render: (value: string) => (
        <Badge variant={getTypeBadgeVariant(value)}>{getTypeLabel(value)}</Badge>
      ),
    },
    {
      key: 'interaction_date' as const,
      header: 'Date',
      width: 'w-28',
      render: (value: string | null) => formatDate(value),
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
      key: 'contact_name' as const,
      header: 'Contact',
      width: 'w-1/6',
      render: (value: string | null) => value || '-',
    },
    {
      key: 'notes' as const,
      header: 'Notes',
      render: (value: string | null) =>
        value ? (value.length > 50 ? value.substring(0, 50) + '...' : value) : '-',
    },
    {
      key: 'id' as const,
      header: 'Actions',
      width: 'w-24',
      render: (_: number, row: InteractionWithDetails) => (
        <Button
          variant="danger"
          onClick={(e: React.MouseEvent) => handleDeleteClick(row, e)}
        >
          Delete
        </Button>
      ),
    },
  ];

  return (
    <div className="h-full flex flex-col">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Interactions</h1>
          <p className="text-sm text-gray-500 mt-1">
            Track your communications with contacts and companies
          </p>
        </div>
        <Button onClick={handleOpenAddModal}>+ Add Interaction</Button>
      </div>

      {/* Filter */}
      <div className="mb-4 max-w-md">
        <Select
          label="Filter by Application"
          options={applicationFilterOptions}
          value={filterApplicationId}
          onChange={(e) => setFilterApplicationId(e.target.value)}
        />
      </div>

      {/* Error State */}
      {error && !isModalOpen && (
        <div className="mb-4 bg-red-50 text-red-700 p-4 rounded-md">
          {error}
        </div>
      )}

      {/* Interactions Table */}
      <div className="flex-1">
        <Table
          data={interactions}
          columns={columns}
          onRowClick={handleOpenEditModal}
          loading={loading}
        />
        {!loading && (
          <div className="mt-3 text-xs text-gray-500 text-center">
            {interactions.length} interaction{interactions.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* Add/Edit Interaction Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingInteraction ? 'Edit Interaction' : 'Add Interaction'}
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
              options={applicationFormOptions}
              value={formApplicationId}
              onChange={(e) => setFormApplicationId(e.target.value)}
              required
            />

            <Select
              label="Contact (Optional)"
              options={contactFormOptions}
              value={formContactId}
              onChange={(e) => setFormContactId(e.target.value)}
            />

            <Select
              label="Interaction Type"
              options={typeOptions}
              value={formType}
              onChange={(e) => setFormType(e.target.value)}
              required
            />

            <Input
              label="Date"
              type="date"
              value={formDate}
              onChange={(e) => setFormDate(e.target.value)}
              required
            />

            <Textarea
              label="Notes"
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
              placeholder="Any notes about this interaction..."
              rows={3}
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
                {editingInteraction ? 'Save Changes' : 'Add Interaction'}
              </Button>
            </div>
          </div>
        </Form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Interaction"
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            Are you sure you want to delete this interaction?
          </p>
          {interactionToDelete && (
            <div className="bg-gray-50 p-3 rounded-md text-sm">
              <p className="font-medium">
                {getTypeLabel(interactionToDelete.interaction_type)} on{' '}
                {formatDate(interactionToDelete.interaction_date)}
              </p>
              <p className="text-gray-500 mt-1">
                {interactionToDelete.position_title} at {interactionToDelete.company_name}
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
