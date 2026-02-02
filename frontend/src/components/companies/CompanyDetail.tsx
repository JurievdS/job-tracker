import { useState, useEffect } from 'react';
import type { Company } from '@/types/company';
import type { Contact } from '@/types/contact';
import { companiesApi } from '@/api/companies';
import { contactsApi } from '@/api/contacts';
import { Card, Skeleton, Button, Textarea, Input, Modal, Form } from '@/components/common';

interface CompanyDetailProps {
  company: Company | null;
  loading?: boolean;
}

export function CompanyDetail({ company, loading }: CompanyDetailProps) {
  // Notes state
  const [notes, setNotes] = useState('');
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [notesError, setNotesError] = useState<string | null>(null);

  // Contacts state
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoadingContacts, setIsLoadingContacts] = useState(false);

  // Add contact modal state
  const [isAddContactModalOpen, setIsAddContactModalOpen] = useState(false);
  const [newContactName, setNewContactName] = useState('');
  const [newContactRole, setNewContactRole] = useState('');
  const [newContactEmail, setNewContactEmail] = useState('');
  const [newContactLinkedin, setNewContactLinkedin] = useState('');
  const [isSubmittingContact, setIsSubmittingContact] = useState(false);
  const [contactError, setContactError] = useState<string | null>(null);

  // Load notes and contacts when company changes
  useEffect(() => {
    if (!company) {
      setNotes('');
      setContacts([]);
      return;
    }

    // Load notes
    const loadNotes = async () => {
      try {
        const userNotes = await companiesApi.getNotes(company.id);
        setNotes(userNotes?.notes || '');
      } catch (err) {
        console.error('Failed to load notes:', err);
      }
    };

    // Load contacts
    const loadContacts = async () => {
      setIsLoadingContacts(true);
      try {
        const data = await contactsApi.list(company.id);
        setContacts(data);
      } catch (err) {
        console.error('Failed to load contacts:', err);
      } finally {
        setIsLoadingContacts(false);
      }
    };

    loadNotes();
    loadContacts();
  }, [company?.id]);

  // Save notes handler
  const handleSaveNotes = async () => {
    if (!company) return;

    setIsSavingNotes(true);
    setNotesError(null);
    try {
      await companiesApi.setNotes(company.id, { notes });
      setIsEditingNotes(false);
    } catch (err) {
      setNotesError('Failed to save notes');
      console.error('Failed to save notes:', err);
    } finally {
      setIsSavingNotes(false);
    }
  };

  // Add contact handlers
  const handleOpenAddContact = () => {
    setIsAddContactModalOpen(true);
    setContactError(null);
  };

  const handleCloseAddContact = () => {
    setIsAddContactModalOpen(false);
    setNewContactName('');
    setNewContactRole('');
    setNewContactEmail('');
    setNewContactLinkedin('');
    setContactError(null);
  };

  const handleSubmitContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company) return;

    if (!newContactName.trim()) {
      setContactError('Contact name is required');
      return;
    }

    setIsSubmittingContact(true);
    setContactError(null);

    try {
      const newContact = await contactsApi.create({
        name: newContactName.trim(),
        company_id: company.id,
        role: newContactRole.trim() || undefined,
        email: newContactEmail.trim() || undefined,
        linkedin: newContactLinkedin.trim()
          ? (newContactLinkedin.trim().startsWith('http')
              ? newContactLinkedin.trim()
              : `https://${newContactLinkedin.trim()}`)
          : undefined,
      });

      setContacts((prev) => [...prev, newContact]);
      handleCloseAddContact();
    } catch (err) {
      setContactError('Failed to add contact');
      console.error('Failed to add contact:', err);
    } finally {
      setIsSubmittingContact(false);
    }
  };

  // Skeleton state
  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <Skeleton className="h-8 w-1/2 mb-4" />
          <Skeleton className="h-5 w-1/3 mb-2" />
          <Skeleton className="h-5 w-1/4" />
        </Card>
        <Card>
          <Skeleton className="h-6 w-1/4 mb-4" />
          <Skeleton className="h-20 w-full" />
        </Card>
      </div>
    );
  }

  // Empty state
  if (!company) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
          </div>
          <p className="text-gray-500">Select a company to view details</p>
        </div>
      </div>
    );
  }

  // Actual content
  return (
    <div className="space-y-6">
      {/* Company Header */}
      <Card>
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{company.name}</h2>
            {company.location && (
              <p className="text-gray-500 mt-1 flex items-center gap-1">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                {company.location}
              </p>
            )}
          </div>
          {company.website && (
            <a
              href={company.website}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
              Website
            </a>
          )}
        </div>
      </Card>

        {/* Notes */}
      <Card title="Your Notes">
        {notesError && (
          <div className="mb-3 bg-red-50 text-red-700 p-2 rounded text-sm">
            {notesError}
          </div>
        )}
        {isEditingNotes ? (
          <div className="space-y-3">
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add your personal notes about this company..."
              rows={4}
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsEditingNotes(false)}
              >
                Cancel
              </Button>
              <Button size="sm" onClick={handleSaveNotes} loading={isSavingNotes}>
                Save
              </Button>
            </div>
          </div>
        ) : (
          <div
            onClick={() => setIsEditingNotes(true)}
            className="cursor-pointer group"
          >
            {notes ? (
              <p className="text-gray-700 whitespace-pre-wrap">{notes}</p>
            ) : (
              <p className="text-gray-400 italic group-hover:text-gray-500">
                Click to add notes about this company...
              </p>
            )}
          </div>
        )}
      </Card>

      {/* Contacts */}
      <Card title="Contacts">
        {isLoadingContacts ? (
          <div className="space-y-3">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="w-10 h-10 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-1/3 mb-1" />
                  <Skeleton className="h-3 w-1/4" />
                </div>
              </div>
            ))}
          </div>
        ) : contacts.length > 0 ? (
          <div className="space-y-3">
            {contacts.map((contact) => (
              <div
                key={contact.id}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50"
              >
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-medium text-sm">
                    {contact.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">
                    {contact.name}
                  </p>
                  {contact.role && (
                    <p className="text-sm text-gray-500 truncate">{contact.role}</p>
                  )}
                </div>
                {contact.email && (
                  <a
                    href={`mailto:${contact.email}`}
                    className="text-gray-400 hover:text-gray-600"
                    title={contact.email}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </a>
                )}
                {contact.linkedin && (
                  <a
                    href={contact.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-blue-600"
                    title="LinkedIn"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                    </svg>
                  </a>
                )}
              </div>
            ))}
            <Button
              variant="secondary"
              size="sm"
              onClick={handleOpenAddContact}
              className="w-full mt-2"
            >
              + Add Contact
            </Button>
          </div>
        ) : (
          <div className="text-center py-6">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg
                className="w-6 h-6 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
            <p className="text-gray-500 text-sm mb-3">No contacts yet</p>
            <Button variant="secondary" size="sm" onClick={handleOpenAddContact}>
              + Add Contact
            </Button>
          </div>
        )}
      </Card>

      {/* Add Contact Modal */}
      <Modal
        isOpen={isAddContactModalOpen}
        onClose={handleCloseAddContact}
        title="Add Contact"
      >
        <Form onSubmit={handleSubmitContact}>
          <div className="space-y-4">
            {contactError && (
              <div className="bg-red-50 text-red-700 p-3 rounded-md text-sm">
                {contactError}
              </div>
            )}

            <Input
              label="Name"
              value={newContactName}
              onChange={(e) => setNewContactName(e.target.value)}
              placeholder="e.g., John Smith"
              required
            />

            <Input
              label="Role"
              value={newContactRole}
              onChange={(e) => setNewContactRole(e.target.value)}
              placeholder="e.g., Recruiter"
            />

            <Input
              label="Email"
              type="email"
              value={newContactEmail}
              onChange={(e) => setNewContactEmail(e.target.value)}
              placeholder="e.g., john@company.com"
            />

            <Input
              label="LinkedIn"
              value={newContactLinkedin}
              onChange={(e) => setNewContactLinkedin(e.target.value)}
              placeholder="e.g., https://linkedin.com/in/johnsmith"
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={handleCloseAddContact}
              >
                Cancel
              </Button>
              <Button type="submit" loading={isSubmittingContact}>
                Add Contact
              </Button>
            </div>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
