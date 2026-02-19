import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, ExternalLink, Building2, Users, Pencil, Briefcase, Trash2, Calendar } from 'lucide-react';
import type { CompanyWithNotes } from '@/types/company';
import type { Contact } from '@/types/contact';
import type { Application } from '@/types/application';
import { companiesApi } from '@/api/companies';
import { contactsApi } from '@/api/contacts';
import { applicationsApi } from '@/api/applications';
import { Card, Skeleton, Button, Input, Textarea, EmptyState, StarRating, StatusBadge, Modal } from '@/components/common';
import { useToast } from '@/contexts/ToastContext';
import { formatDate } from '@/utils/date';
import { parseApiError } from '@/utils/errors';
import { normalizeUrl } from '@/utils/url';
import { ROUTES } from '@/routes/routes';
import { ContactCard } from './ContactCard';
import { AddContactPanel } from './AddContactPanel';

const displayUrl = (url: string) =>
  url.replace(/^https?:\/\//, '').replace(/\/$/, '');

interface CompanyDetailProps {
  company: CompanyWithNotes | null;
  loading?: boolean;
  onCompanyUpdate?: (company: CompanyWithNotes) => void;
  onCompanyDelete?: (id: number) => void;
  onAddCompany?: () => void;
}

export function CompanyDetail({ company, loading, onCompanyUpdate, onCompanyDelete, onAddCompany }: CompanyDetailProps) {
  const { addToast } = useToast();
  const navigate = useNavigate();

  // Company edit state
  const [isEditingCompany, setIsEditingCompany] = useState(false);
  const [isSavingCompany, setIsSavingCompany] = useState(false);
  const [editName, setEditName] = useState('');
  const [editIndustry, setEditIndustry] = useState('');
  const [editWebsite, setEditWebsite] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editError, setEditError] = useState<string | null>(null);

  // Notes + rating state
  const [notes, setNotes] = useState('');
  const [rating, setRating] = useState<number | null>(null);
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [isSavingNotes, setIsSavingNotes] = useState(false);

  // Contacts state
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoadingContacts, setIsLoadingContacts] = useState(false);
  const [isAddContactModalOpen, setIsAddContactModalOpen] = useState(false);

  // Delete state
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Applications state
  const [companyApplications, setCompanyApplications] = useState<Application[]>([]);
  const [isLoadingApplications, setIsLoadingApplications] = useState(false);

  // Reset edit state when company changes
  useEffect(() => {
    setIsEditingCompany(false);
    setEditError(null);
  }, [company?.id]);

  // Load notes, contacts, and applications when company changes
  useEffect(() => {
    if (!company) {
      setNotes('');
      setRating(null);
      setContacts([]);
      setCompanyApplications([]);
      return;
    }

    const loadNotes = async () => {
      try {
        const userNotes = await companiesApi.getNotes(company.id);
        setNotes(userNotes?.notes || '');
        setRating(userNotes?.rating ?? null);
      } catch (err) {
        console.error('Failed to load notes:', err);
      }
    };

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

    const loadApplications = async () => {
      setIsLoadingApplications(true);
      try {
        const data = await applicationsApi.list(undefined, company.id);
        setCompanyApplications(data);
      } catch (err) {
        console.error('Failed to load applications:', err);
      } finally {
        setIsLoadingApplications(false);
      }
    };

    loadNotes();
    loadContacts();
    loadApplications();
  }, [company?.id]);

  // Start editing company
  const handleStartEditCompany = () => {
    if (!company) return;
    setEditName(company.name);
    setEditIndustry(company.industry || '');
    setEditWebsite(company.website || '');
    setEditLocation(company.location || '');
    setEditError(null);
    setIsEditingCompany(true);
  };

  // Save company edits
  const handleSaveCompany = async () => {
    if (!company) return;
    if (!editName.trim()) {
      setEditError('Company name is required');
      return;
    }

    setIsSavingCompany(true);
    setEditError(null);

    try {
      const updated = await companiesApi.update(company.id, {
        name: editName.trim(),
        industry: editIndustry.trim() || undefined,
        website: normalizeUrl(editWebsite),
        location: editLocation.trim() || undefined,
      });

      const updatedWithNotes: CompanyWithNotes = {
        ...updated,
        user_notes: company.user_notes,
        user_rating: company.user_rating,
      };

      onCompanyUpdate?.(updatedWithNotes);
      setIsEditingCompany(false);
      addToast('Company updated');
    } catch (err) {
      setEditError(parseApiError(err, 'Failed to update company'));
    } finally {
      setIsSavingCompany(false);
    }
  };

  // Save notes handler
  const handleSaveNotes = async () => {
    if (!company) return;

    setIsSavingNotes(true);
    try {
      await companiesApi.setNotes(company.id, {
        notes,
        rating: rating ?? undefined,
      });
      setIsEditingNotes(false);
      addToast('Notes saved');
    } catch {
      addToast('Failed to save notes', 'error');
    } finally {
      setIsSavingNotes(false);
    }
  };

  // Star rating change — saves immediately with optimistic update
  const handleRatingChange = async (newRating: number | null) => {
    if (!company) return;
    const prevRating = rating;
    setRating(newRating);
    try {
      await companiesApi.setNotes(company.id, {
        notes,
        rating: newRating ?? undefined,
      });
      onCompanyUpdate?.({ ...company, user_rating: newRating });
    } catch {
      setRating(prevRating);
      addToast('Failed to save rating', 'error');
    }
  };

  // Delete company
  const handleDeleteCompany = async () => {
    if (!company) return;
    setIsDeleting(true);
    try {
      await companiesApi.delete(company.id);
      onCompanyDelete?.(company.id);
      addToast('Company deleted');
    } catch (err) {
      addToast(parseApiError(err, 'Failed to delete company'), 'error');
    } finally {
      setIsDeleting(false);
      setIsDeleteConfirmOpen(false);
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

  // Empty state — no company selected
  if (!company) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-surface-alt rounded-full flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-8 h-8 text-text-placeholder" />
          </div>
          <p className="text-text-muted mb-1">Select a company to view details</p>
          {onAddCompany && (
            <Button variant="ghost" size="sm" onClick={onAddCompany}>
              or add a new one
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Company Header */}
      <Card>
        {isEditingCompany ? (
          <div className="space-y-3">
            {editError && (
              <div className="bg-danger-light text-danger-text p-3 rounded-[var(--radius-md)] text-sm">
                {editError}
              </div>
            )}
            <Input
              label="Company Name"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              required
            />
            <Input
              label="Industry"
              value={editIndustry}
              onChange={(e) => setEditIndustry(e.target.value)}
              placeholder="e.g., Technology, Finance"
            />
            <Input
              label="Location"
              value={editLocation}
              onChange={(e) => setEditLocation(e.target.value)}
              placeholder="e.g., Mountain View, CA"
            />
            <Input
              label="Website"
              value={editWebsite}
              onChange={(e) => setEditWebsite(e.target.value)}
              placeholder="e.g., example.com"
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsEditingCompany(false)}
              >
                Cancel
              </Button>
              <Button size="sm" onClick={handleSaveCompany} loading={isSavingCompany}>
                Save
              </Button>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-start justify-between">
              <h2 className="text-2xl font-bold text-text">{company.name}</h2>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleStartEditCompany}
                  icon={<Pencil className="w-3.5 h-3.5" />}
                  aria-label="Edit company"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsDeleteConfirmOpen(true)}
                  icon={<Trash2 className="w-3.5 h-3.5" />}
                  className="text-danger hover:bg-danger-light"
                  aria-label="Delete company"
                />
              </div>
            </div>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-3 mt-4">
              {company.industry && (
                <div>
                  <dt className="text-xs font-medium text-text-muted tracking-wide uppercase">Industry</dt>
                  <dd className="text-sm text-text mt-0.5 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-text-muted flex-shrink-0" />
                    {company.industry}
                  </dd>
                </div>
              )}
              {company.location && (
                <div>
                  <dt className="text-xs font-medium text-text-muted tracking-wide uppercase">Location</dt>
                  <dd className="text-sm text-text mt-0.5 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-text-muted flex-shrink-0" />
                    {company.location}
                  </dd>
                </div>
              )}
              {company.website && (
                <div>
                  <dt className="text-xs font-medium text-text-muted tracking-wide uppercase">Website</dt>
                  <dd className="text-sm mt-0.5">
                    <a
                      href={company.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline inline-flex items-center gap-1"
                    >
                      {displayUrl(company.website)}
                      <ExternalLink className="w-3 h-3 flex-shrink-0" />
                    </a>
                  </dd>
                </div>
              )}
              <div>
                <dt className="text-xs font-medium text-text-muted tracking-wide uppercase">Added</dt>
                <dd className="text-sm text-text mt-0.5 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-text-muted flex-shrink-0" />
                  {formatDate(company.created_at)}
                </dd>
              </div>
            </dl>
          </div>
        )}
      </Card>

      {/* Notes + Rating */}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-text">Your Notes</h3>
          <StarRating value={rating} onChange={handleRatingChange} size="md" />
        </div>

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
            className="cursor-pointer group relative rounded-[var(--radius-md)] p-2 -m-2 hover:bg-surface-alt transition-colors"
          >
            <Pencil className="absolute top-2 right-2 w-3.5 h-3.5 text-text-placeholder opacity-0 group-hover:opacity-100 transition-opacity" />
            {notes ? (
              <p className="text-text-secondary whitespace-pre-wrap">{notes}</p>
            ) : (
              <p className="text-text-placeholder italic group-hover:text-text-muted">
                Click to add notes about this company...
              </p>
            )}
          </div>
        )}
      </Card>

      {/* Applications */}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-text">Applications</h3>
            {companyApplications.length > 0 && (
              <span className="text-xs bg-surface-alt text-text-muted px-2 py-0.5 rounded-full">
                {companyApplications.length}
              </span>
            )}
          </div>
        </div>

        {isLoadingApplications ? (
          <div className="space-y-2">
            {Array.from({ length: 2 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : companyApplications.length > 0 ? (
          <div className="space-y-2">
            {companyApplications.map((app) => (
              <div
                key={app.id}
                onClick={() => navigate(ROUTES.APPLICATIONS, { state: { openApplicationId: app.id } })}
                className="flex items-center justify-between p-2.5 rounded-[var(--radius-md)] bg-surface-alt cursor-pointer hover:bg-surface-hover transition-colors"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    navigate(ROUTES.APPLICATIONS, { state: { openApplicationId: app.id } });
                  }
                }}
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-text truncate">{app.job_title}</p>
                  {app.date_applied && (
                    <p className="text-xs text-text-muted">{formatDate(app.date_applied)}</p>
                  )}
                </div>
                <StatusBadge status={app.status || 'bookmarked'} />
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<Briefcase className="w-8 h-8" />}
            title="No applications yet"
            description="Applications at this company will appear here"
          />
        )}
      </Card>

      {/* Contacts */}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-text">Contacts</h3>
            {contacts.length > 0 && (
              <span className="text-xs bg-surface-alt text-text-muted px-2 py-0.5 rounded-full">
                {contacts.length}
              </span>
            )}
          </div>
          {contacts.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsAddContactModalOpen(true)}
              icon={<Users className="w-4 h-4" />}
            >
              Add
            </Button>
          )}
        </div>

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
          <div className="space-y-1">
            {contacts.map((contact) => (
              <ContactCard
                key={contact.id}
                contact={contact}
                onUpdate={(updated) => {
                  setContacts((prev) =>
                    prev.map((c) => (c.id === updated.id ? updated : c))
                  );
                }}
                onDelete={(id) => {
                  setContacts((prev) => prev.filter((c) => c.id !== id));
                }}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<Users className="w-8 h-8" />}
            title="No contacts yet"
            description="Add contacts you know at this company"
            action={{
              label: '+ Add Contact',
              onClick: () => setIsAddContactModalOpen(true),
            }}
          />
        )}
      </Card>

      {/* Add Contact Modal */}
      <AddContactPanel
        companyId={company.id}
        isOpen={isAddContactModalOpen}
        onClose={() => setIsAddContactModalOpen(false)}
        onCreated={(newContact) => {
          setContacts((prev) => [...prev, newContact]);
        }}
      />

      {/* Delete Company Confirmation */}
      <Modal
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        title="Delete Company"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-text-secondary">
            Are you sure you want to delete <strong>{company.name}</strong>?
          </p>
          <p className="text-sm text-text-muted">
            Applications and contacts linked to this company will lose their company reference. This cannot be undone.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setIsDeleteConfirmOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDeleteCompany} loading={isDeleting}>
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
