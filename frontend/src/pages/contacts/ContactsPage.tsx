import { useState, useEffect, useMemo } from 'react';
import type { Contact, CreateContactDto, UpdateContactDto } from '@/types/contact';
import type { Company } from '@/types/company';
import { contactsApi } from '@/api/contacts';
import { companiesApi } from '@/api/companies';
import { Button, Input, Textarea, Select, Modal, Form, Table, ComboBox, type ComboBoxOption } from '@/components/common';

export function ContactsPage() {
  // Data state
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      setError('Failed to fetch contacts');
      console.error('Failed to fetch contacts', err);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [contactsData, companiesData] = await Promise.all([
          contactsApi.list(),
          companiesApi.list(),
        ]);
        setContacts(contactsData);
        setCompanies(companiesData);
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
    setFormLinkedin('');
    setFormNotes('');
    setError(null);
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
    setFormLinkedin(contact.linkedin || '');
    setFormNotes(contact.notes || '');
    setError(null);
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
      setError('Name is required');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      if (editingContact) {
        const updateData: UpdateContactDto = {
          name: formName.trim(),
          company_id: formCompany ? Number(formCompany.value) : undefined,
          role: formRole.trim() || undefined,
          email: formEmail.trim() || undefined,
          linkedin: formLinkedin.trim() || undefined,
          notes: formNotes.trim() || undefined,
        };

        await contactsApi.update(editingContact.id, updateData);
      } else {
        const createData: CreateContactDto = {
          name: formName.trim(),
          company_id: formCompany ? Number(formCompany.value) : 0,
          role: formRole.trim() || undefined,
          email: formEmail.trim() || undefined,
          linkedin: formLinkedin.trim() || undefined,
          notes: formNotes.trim() || undefined,
        };

        await contactsApi.create(createData);
      }

      await fetchContacts();
      handleCloseModal();
    } catch (err) {
      setError(editingContact ? 'Failed to update contact' : 'Failed to create contact');
      console.error('Submit error', err);
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
    } catch (err) {
      setError('Failed to delete contact');
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
    },
    {
      key: 'company_name' as const,
      header: 'Company',
      width: 'w-1/6',
      render: (_: unknown, row: Contact) => row.company_name || '-',
    },
    {
      key: 'role' as const,
      header: 'Role',
      width: 'w-1/6',
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
            className="text-blue-600 hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            {row.email}
          </a>
        ) : (
          '-'
        ),
    },
    {
      key: 'linkedin' as const,
      header: 'LinkedIn',
      width: 'w-24',
      render: (_: unknown, row: Contact) =>
        row.linkedin ? (
          <a
            href={row.linkedin.startsWith('http') ? row.linkedin : `https://${row.linkedin}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            Profile
          </a>
        ) : (
          '-'
        ),
    },
    {
      key: 'id' as const,
      header: 'Actions',
      width: 'w-24',
      render: (_: unknown, row: Contact) => (
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
          <h1 className="text-2xl font-bold text-gray-900">Contacts</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage your professional contacts
          </p>
        </div>
        <Button onClick={handleOpenAddModal}>+ Add Contact</Button>
      </div>

      {/* Filters */}
      <div className="mb-4 flex gap-4">
        <div className="w-64">
          <Input
            placeholder="Search contacts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="w-64">
          <Select
            options={companyFilterOptions}
            value={filterCompanyId}
            onChange={(e) => setFilterCompanyId(e.target.value)}
          />
        </div>
      </div>

      {/* Error State */}
      {error && !isModalOpen && (
        <div className="mb-4 bg-red-50 text-red-700 p-4 rounded-md">
          {error}
        </div>
      )}

      {/* Contacts Table */}
      <div className="flex-1">
        <Table
          data={filteredContacts}
          columns={columns}
          onRowClick={handleOpenEditModal}
          loading={loading}
        />
        {!loading && (
          <div className="mt-3 text-xs text-gray-500 text-center">
            {filteredContacts.length} of {contacts.length} contact{contacts.length !== 1 ? 's' : ''}
          </div>
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
            {error && (
              <div className="bg-red-50 text-red-700 p-3 rounded-md text-sm">
                {error}
              </div>
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
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            Are you sure you want to delete <strong>{contactToDelete?.name}</strong>?
          </p>
          {contactToDelete?.company_name && (
            <p className="text-sm text-gray-500">
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
