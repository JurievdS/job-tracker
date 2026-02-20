import { useState, useEffect, useMemo } from 'react';
import type { Contact, CreateContactDto, UpdateContactDto } from '@/types/contact';
import type { Company } from '@/types/company';
import { contactsApi } from '@/api/contacts';
import { companiesApi } from '@/api/companies';
import { useToast } from '@/contexts/ToastContext';
import { parseApiError } from '@/utils/errors';
import { normalizeUrl } from '@/utils/url';
import { Search, Plus, ExternalLink, Trash2, Users } from 'lucide-react';
import { Button, Input, Textarea, Select, Modal, Form, Table, ComboBox, PageHeader, EmptyState, Alert, type ComboBoxOption } from '@/components/common';

export function ContactsPage() {
  const { addToast } = useToast();

  // Data state
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);

  // Filter state
  const [filterCompanyId, setFilterCompanyId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [formName, setFormName] = useState('');
  const [formCompany, setFormCompany] = useState<ComboBoxOption | null>(null);
  const [companySearchResults, setCompanySearchResults] = useState<ComboBoxOption[]>([]);
  const [formRole, setFormRole] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formLinkedin, setFormLinkedin] = useState('');
  const [formNotes, setFormNotes] = useState('');

  // Delete confirmation state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [contactToDelete, setContactToDelete] = useState<Contact | null>(null);

  const fetchContacts = async () => {
    try {
      const companyId = filterCompanyId ? Number(filterCompanyId) : undefined;
      const data = await contactsApi.list(companyId);
      setContacts(data);
    } catch (err) {
      addToast('Failed to fetch contacts', 'error');
      console.error('Failed to fetch contacts', err);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [contactsData, companiesData] = await Promise.all([
          contactsApi.list(),
          companiesApi.list(),
        ]);
        setContacts(contactsData);
        setCompanies(companiesData);
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
      fetchContacts();
    }
  }, [filterCompanyId]);

  // Filter contacts by search term (client-side)
  const filteredContacts = useMemo(() => {
    if (!searchTerm.trim()) return contacts;
    const term = searchTerm.toLowerCase();
    return contacts.filter(
      (c) =>
        c.name.toLowerCase().includes(term) ||
        c.role?.toLowerCase().includes(term) ||
        c.email?.toLowerCase().includes(term) ||
        c.company_name?.toLowerCase().includes(term)
    );
  }, [contacts, searchTerm]);

  const companyFilterOptions = useMemo(() => {
    return [
      { value: '', label: 'All Companies' },
      ...companies.map((c) => ({ value: String(c.id), label: c.name })),
    ];
  }, [companies]);

  const resetForm = () => {
    setFormName('');
    setFormCompany(null);
    setCompanySearchResults(companies.map((c) => ({ value: String(c.id), label: c.name })));
    setFormRole('');
    setFormEmail('');
    setFormPhone('');
    setFormLinkedin('');
    setFormNotes('');
    setFormError(null);
  };

  const handleCompanySearch = (term: string) => {
    const filtered = companies
      .filter((c) => c.name.toLowerCase().includes(term.toLowerCase()))
      .map((c) => ({ value: String(c.id), label: c.name }));
    setCompanySearchResults(filtered);
  };

  const handleOpenAddModal = () => {
    setEditingContact(null);
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (contact: Contact) => {
    setEditingContact(contact);
    setFormName(contact.name);
    setFormCompany(
      contact.company_id && contact.company_name
        ? { value: String(contact.company_id), label: contact.company_name }
        : null
    );
    setCompanySearchResults(companies.map((c) => ({ value: String(c.id), label: c.name })));
    setFormRole(contact.role || '');
    setFormEmail(contact.email || '');
    setFormPhone(contact.phone || '');
    setFormLinkedin(contact.linkedin || '');
    setFormNotes(contact.notes || '');
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingContact(null);
    resetForm();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formName.trim()) {
      setFormError('Name is required');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    try {
      if (editingContact) {
        const updateData: UpdateContactDto = {
          name: formName.trim(),
          company_id: formCompany ? Number(formCompany.value) : undefined,
          role: formRole.trim() || undefined,
          email: formEmail.trim() || undefined,
          phone: formPhone.trim() || undefined,
          linkedin: normalizeUrl(formLinkedin),
          notes: formNotes.trim() || undefined,
        };

        await contactsApi.update(editingContact.id, updateData);
      } else {
        const createData: CreateContactDto = {
          name: formName.trim(),
          company_id: formCompany ? Number(formCompany.value) : 0,
          role: formRole.trim() || undefined,
          email: formEmail.trim() || undefined,
          phone: formPhone.trim() || undefined,
          linkedin: normalizeUrl(formLinkedin),
          notes: formNotes.trim() || undefined,
        };

        await contactsApi.create(createData);
      }

      addToast(editingContact ? 'Contact updated' : 'Contact created', 'success');
      await fetchContacts();
      handleCloseModal();
    } catch (err) {
      setFormError(parseApiError(err, editingContact ? 'Failed to update contact' : 'Failed to create contact'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (contact: Contact, e: React.MouseEvent) => {
    e.stopPropagation();
    setContactToDelete(contact);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!contactToDelete) return;

    setIsSubmitting(true);
    try {
      await contactsApi.delete(contactToDelete.id);
      setContacts((prev) => prev.filter((c) => c.id !== contactToDelete.id));
      setIsDeleteModalOpen(false);
      setContactToDelete(null);
      addToast('Contact deleted', 'success');
    } catch (err) {
      addToast('Failed to delete contact', 'error');
      console.error('Delete error', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns = [
    {
      key: 'name' as const,
      header: 'Name',
      width: 'w-1/5',
      sortable: true,
    },
    {
      key: 'company_name' as const,
      header: 'Company',
      width: 'w-1/6',
      sortable: true,
      render: (_: unknown, row: Contact) => row.company_name || '-',
    },
    {
      key: 'role' as const,
      header: 'Role',
      width: 'w-1/6',
      sortable: true,
      render: (_: unknown, row: Contact) => row.role || '-',
    },
    {
      key: 'email' as const,
      header: 'Email',
      width: 'w-1/5',
      render: (_: unknown, row: Contact) =>
        row.email ? (
          <a
            href={`mailto:${row.email}`}
            className="text-primary hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            {row.email}
          </a>
        ) : (
          '-'
        ),
    },
    {
      key: 'phone' as const,
      header: 'Phone',
      width: 'w-1/6',
      render: (_: unknown, row: Contact) =>
        row.phone ? (
          <a
            href={`tel:${row.phone}`}
            className="text-primary hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            {row.phone}
          </a>
        ) : (
          '-'
        ),
    },
    {
      key: 'linkedin' as const,
      header: '',
      width: 'w-10',
      render: (_: unknown, row: Contact) =>
        row.linkedin ? (
          <a
            href={row.linkedin.startsWith('http') ? row.linkedin : `https://${row.linkedin}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-text-placeholder hover:text-primary transition-colors"
            aria-label="Open LinkedIn profile"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        ) : null,
    },
    {
      key: 'id' as const,
      header: '',
      width: 'w-10',
      render: (_: unknown, row: Contact) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={(e: React.MouseEvent) => handleDeleteClick(row, e)}
          aria-label={`Delete ${row.name}`}
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
        title="Contacts"
        subtitle="Manage your professional contacts"
        action={<Button onClick={handleOpenAddModal} icon={<Plus className="w-4 h-4" />}>Add Contact</Button>}
      />

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3 mb-4">
        <div className="flex-1 min-w-[200px]">
          <Input
            placeholder="Search contacts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            startElement={<Search className="w-4 h-4" />}
            aria-label="Search contacts"
          />
        </div>
        <div className="min-w-[180px]">
          <Select
            options={companyFilterOptions}
            value={filterCompanyId}
            onChange={(e) => setFilterCompanyId(e.target.value)}
            aria-label="Filter by company"
          />
        </div>
      </div>

      {/* Contacts Table */}
      <div className="flex-1">
        {!loading && filteredContacts.length === 0 ? (
          <EmptyState
            icon={<Users className="w-12 h-12" />}
            title={searchTerm || filterCompanyId ? 'No matching contacts' : 'No contacts yet'}
            description={
              searchTerm || filterCompanyId
                ? 'Try a different search term or clear the filters.'
                : 'Add your first professional contact to get started.'
            }
            action={
              searchTerm || filterCompanyId
                ? { label: 'Clear Filters', onClick: () => { setSearchTerm(''); setFilterCompanyId(''); } }
                : { label: 'Add Contact', onClick: handleOpenAddModal }
            }
          />
        ) : (
          <>
            <Table
              data={filteredContacts}
              columns={columns}
              onRowClick={handleOpenEditModal}
              loading={loading}
            />
            {!loading && (
              <div className="mt-3 pt-3 border-t border-border text-xs text-text-muted text-center">
                {filteredContacts.length} of {contacts.length} contact{contacts.length !== 1 ? 's' : ''}
              </div>
            )}
          </>
        )}
      </div>

      {/* Add/Edit Contact Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingContact ? 'Edit Contact' : 'Add Contact'}
      >
        <Form onSubmit={handleSubmit}>
          <div className="space-y-4">
            {formError && (
              <Alert variant="danger">{formError}</Alert>
            )}

            <Input
              label="Name"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="John Doe"
              required
            />

            <ComboBox
              label="Company"
              value={formCompany}
              onChange={setFormCompany}
              onSearch={handleCompanySearch}
              options={companySearchResults}
              placeholder="Search companies..."
            />

            <Input
              label="Role"
              value={formRole}
              onChange={(e) => setFormRole(e.target.value)}
              placeholder="e.g., Engineering Manager"
            />

            <Input
              label="Email"
              type="email"
              value={formEmail}
              onChange={(e) => setFormEmail(e.target.value)}
              placeholder="john@example.com"
            />

            <Input
              label="Phone"
              type="tel"
              value={formPhone}
              onChange={(e) => setFormPhone(e.target.value)}
              placeholder="+1 (555) 123-4567"
            />

            <Input
              label="LinkedIn"
              value={formLinkedin}
              onChange={(e) => setFormLinkedin(e.target.value)}
              placeholder="https://linkedin.com/in/johndoe"
            />

            <Textarea
              label="Notes"
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
              placeholder="Any notes about this contact..."
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
                {editingContact ? 'Save Changes' : 'Add Contact'}
              </Button>
            </div>
          </div>
        </Form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Contact"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-text-secondary">
            Are you sure you want to delete <strong>{contactToDelete?.name}</strong>?
          </p>
          {contactToDelete?.company_name && (
            <p className="text-sm text-text-muted">
              Contact at {contactToDelete.company_name}
            </p>
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
