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
import { useToast } from '@/contexts/ToastContext';
import { parseApiError } from '@/utils/errors';
import { formatDate } from '@/utils/date';
import { Search, Plus, Trash2, MessageSquare } from 'lucide-react';
import { Button, Input, Textarea, Select, Modal, Form, Table, Badge, PageHeader, EmptyState, Alert, DateInput } from '@/components/common';

export function InteractionsPage() {
  const { addToast } = useToast();

  // Data state
  const [interactions, setInteractions] = useState<InteractionWithDetails[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);

  // Filter state
  const [filterApplicationId, setFilterApplicationId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');

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
      addToast('Failed to fetch interactions', 'error');
      console.error('Failed to fetch interactions', err);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
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
      fetchInteractions();
    }
  }, [filterApplicationId]);

  const applicationFilterOptions = useMemo(() => {
    return [
      { value: '', label: 'All Applications' },
      ...applications.map((a) => ({
        value: String(a.id),
        label: `${a.job_title} at ${a.company_name}`,
      })),
    ];
  }, [applications]);

  const applicationFormOptions = useMemo(() => {
    return [
      { value: '', label: 'Select an application...' },
      ...applications.map((a) => ({
        value: String(a.id),
        label: `${a.job_title} at ${a.company_name}`,
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

  // Client-side search filtering
  const filteredInteractions = useMemo(() => {
    if (!searchTerm.trim()) return interactions;
    const term = searchTerm.toLowerCase();
    return interactions.filter(
      (i) =>
        i.notes?.toLowerCase().includes(term) ||
        i.contact_name?.toLowerCase().includes(term) ||
        i.job_title.toLowerCase().includes(term) ||
        i.company_name.toLowerCase().includes(term)
    );
  }, [interactions, searchTerm]);

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
    setFormError(null);
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
    setFormError(null);
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
      setFormError('Please select an application');
      return;
    }

    if (!formDate) {
      setFormError('Please select a date');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

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

      addToast(editingInteraction ? 'Interaction updated' : 'Interaction created', 'success');
      await fetchInteractions();
      handleCloseModal();
    } catch (err) {
      setFormError(parseApiError(err, editingInteraction ? 'Failed to update interaction' : 'Failed to create interaction'));
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
      addToast('Interaction deleted', 'success');
    } catch (err) {
      addToast('Failed to delete interaction', 'error');
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
      sortable: true,
      render: (_value: unknown, row: InteractionWithDetails) => (
        <Badge variant={getTypeBadgeVariant(row.interaction_type)}>{getTypeLabel(row.interaction_type)}</Badge>
      ),
    },
    {
      key: 'interaction_date' as const,
      header: 'Date',
      width: 'w-28',
      sortable: true,
      render: (_value: unknown, row: InteractionWithDetails) => formatDate(row.interaction_date) || '-',
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
      key: 'contact_name' as const,
      header: 'Contact',
      width: 'w-1/6',
      render: (_value: unknown, row: InteractionWithDetails) => row.contact_name || '-',
    },
    {
      key: 'notes' as const,
      header: 'Notes',
      render: (_value: unknown, row: InteractionWithDetails) =>
        row.notes ? (row.notes.length > 50 ? row.notes.substring(0, 50) + '...' : row.notes) : '-',
    },
    {
      key: 'id' as const,
      header: '',
      width: 'w-10',
      render: (_value: unknown, row: InteractionWithDetails) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={(e: React.MouseEvent) => handleDeleteClick(row, e)}
          aria-label={`Delete ${getTypeLabel(row.interaction_type)} interaction`}
          className="text-text-placeholder hover:text-danger"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      ),
    },
  ];

  return (
    <div className="h-full flex flex-col">
      <PageHeader
        title="Interactions"
        subtitle="Track your communications with contacts and companies"
        action={<Button onClick={handleOpenAddModal} icon={<Plus className="w-4 h-4" />}>Add Interaction</Button>}
      />

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3 mb-4">
        <div className="flex-1 min-w-[200px]">
          <Input
            placeholder="Search interactions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            startElement={<Search className="w-4 h-4" />}
            aria-label="Search interactions"
          />
        </div>
        <div className="min-w-[180px]">
          <Select
            options={applicationFilterOptions}
            value={filterApplicationId}
            onChange={(e) => setFilterApplicationId(e.target.value)}
            aria-label="Filter by application"
          />
        </div>
      </div>

      {/* Interactions Table */}
      <div className="flex-1">
        {!loading && filteredInteractions.length === 0 ? (
          <EmptyState
            icon={<MessageSquare className="w-12 h-12" />}
            title={searchTerm || filterApplicationId ? 'No matching interactions' : 'No interactions yet'}
            description={
              searchTerm || filterApplicationId
                ? 'Try a different search term or clear the filters.'
                : 'Start logging your communications by adding an interaction.'
            }
            action={
              searchTerm || filterApplicationId
                ? { label: 'Clear Filters', onClick: () => { setSearchTerm(''); setFilterApplicationId(''); } }
                : { label: 'Add Interaction', onClick: handleOpenAddModal }
            }
          />
        ) : (
          <>
            <Table
              data={filteredInteractions}
              columns={columns}
              onRowClick={handleOpenEditModal}
              loading={loading}
            />
            {!loading && (
              <div className="mt-3 pt-3 border-t border-border text-xs text-text-muted text-center">
                {filteredInteractions.length} of {interactions.length} interaction{interactions.length !== 1 ? 's' : ''}
              </div>
            )}
          </>
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
            {formError && (
              <Alert variant="danger">{formError}</Alert>
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

            <DateInput
              label="Date"
              value={formDate}
              onChange={(e) => setFormDate(e.target.value)}
              showRelative
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
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-text-secondary">
            Are you sure you want to delete this interaction?
          </p>
          {interactionToDelete && (
            <div className="bg-surface-alt p-3 rounded-[var(--radius-md)] text-sm">
              <p className="font-medium text-text">
                {getTypeLabel(interactionToDelete.interaction_type)} on{' '}
                {formatDate(interactionToDelete.interaction_date) || '-'}
              </p>
              <p className="text-text-muted mt-1">
                {interactionToDelete.job_title} at {interactionToDelete.company_name}
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
