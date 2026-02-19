import { useState, useEffect } from 'react';
import type { UserProfile, UpdateProfileDto } from '@/types/profile';
import type { WorkAuthorization, CreateWorkAuthorizationDto } from '@/types/workAuthorization';
import { WORK_AUTH_STATUSES } from '@/types/workAuthorization';
import { profileApi } from '@/api/profile';
import { workAuthorizationsApi } from '@/api/workAuthorizations';
import { useToast } from '@/contexts/ToastContext';
import { Plus, Pencil, Trash2, User, Link, FileText, DollarSign, Shield } from 'lucide-react';
import { Button, Input, Textarea, Select, Form, DateInput, PageHeader, Alert, Tooltip, Skeleton, Modal, Badge } from '@/components/common';
import { parseApiError } from '@/utils/errors';
import { normalizeUrl } from '@/utils/url';
import { formatDate } from '@/utils/date';

const CURRENCY_OPTIONS = [
  { value: 'EUR', label: 'EUR - Euro' },
  { value: 'USD', label: 'USD - US Dollar' },
  { value: 'GBP', label: 'GBP - British Pound' },
  { value: 'ZAR', label: 'ZAR - South African Rand' },
  { value: 'CHF', label: 'CHF - Swiss Franc' },
];

interface ProfileFormState {
  fullName: string;
  phone: string;
  location: string;
  nationality: string;
  linkedinUrl: string;
  githubUrl: string;
  portfolioUrl: string;
  summary: string;
  baseCurrency: string;
  salaryMin: string;
  salaryMax: string;
}

const INITIAL_FORM: ProfileFormState = {
  fullName: '',
  phone: '',
  location: '',
  nationality: '',
  linkedinUrl: '',
  githubUrl: '',
  portfolioUrl: '',
  summary: '',
  baseCurrency: 'EUR',
  salaryMin: '',
  salaryMax: '',
};

export function ProfilePage() {
  const { addToast } = useToast();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Delete confirmation state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [workAuthToDelete, setWorkAuthToDelete] = useState<WorkAuthorization | null>(null);

  // Work Authorizations state
  const [workAuths, setWorkAuths] = useState<WorkAuthorization[]>([]);
  const [workAuthFormError, setWorkAuthFormError] = useState<string | null>(null);
  const [showAddWorkAuth, setShowAddWorkAuth] = useState(false);
  const [addingWorkAuth, setAddingWorkAuth] = useState(false);
  const [editingWorkAuthId, setEditingWorkAuthId] = useState<number | null>(null);
  const [workAuthForm, setWorkAuthForm] = useState<CreateWorkAuthorizationDto>({
    country_code: '',
    status: 'work_permit',
  });

  // Profile form state
  const [form, setForm] = useState<ProfileFormState>(INITIAL_FORM);

  const updateField = <K extends keyof ProfileFormState>(field: K, value: ProfileFormState[K]) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [profileData, workAuthData] = await Promise.allSettled([
          profileApi.get(),
          workAuthorizationsApi.list(),
        ]);

        if (profileData.status === 'fulfilled') {
          setProfile(profileData.value);
          populateForm(profileData.value);
        }

        if (workAuthData.status === 'fulfilled') {
          setWorkAuths(workAuthData.value);
        }
      } catch (err) {
        console.log('Error fetching profile data', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const populateForm = (data: UserProfile) => {
    setForm({
      fullName: data.full_name || '',
      phone: data.phone || '',
      location: data.location || '',
      nationality: data.nationality || '',
      linkedinUrl: data.linkedin_url || '',
      githubUrl: data.github_url || '',
      portfolioUrl: data.portfolio_url || '',
      summary: data.summary || '',
      baseCurrency: data.base_currency || 'EUR',
      salaryMin: data.salary_expectation_min?.toString() || '',
      salaryMax: data.salary_expectation_max?.toString() || '',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveError(null);

    try {
      const updateData: UpdateProfileDto = {
        full_name: form.fullName.trim() || undefined,
        phone: form.phone.trim() || undefined,
        location: form.location.trim() || undefined,
        nationality: form.nationality.trim() || undefined,
        linkedin_url: normalizeUrl(form.linkedinUrl),
        github_url: normalizeUrl(form.githubUrl),
        portfolio_url: normalizeUrl(form.portfolioUrl),
        summary: form.summary.trim() || undefined,
        base_currency: form.baseCurrency || undefined,
        salary_expectation_min: form.salaryMin ? parseInt(form.salaryMin, 10) : undefined,
        salary_expectation_max: form.salaryMax ? parseInt(form.salaryMax, 10) : undefined,
      };

      const updated = await profileApi.update(updateData);
      setProfile(updated);
      addToast('Profile saved successfully', 'success');
    } catch (err) {
      setSaveError(parseApiError(err, 'Failed to save profile'));
    } finally {
      setSaving(false);
    }
  };

  // Work Authorization handlers
  const resetWorkAuthForm = () => {
    setWorkAuthForm({ country_code: '', status: 'work_permit' });
    setEditingWorkAuthId(null);
    setShowAddWorkAuth(false);
  };

  const handleAddWorkAuth = async () => {
    if (!workAuthForm.country_code || workAuthForm.country_code.length !== 3) {
      setWorkAuthFormError('Country code must be exactly 3 characters (e.g., NLD, ZAF, USA)');
      return;
    }

    setAddingWorkAuth(true);
    setWorkAuthFormError(null);

    try {
      if (editingWorkAuthId) {
        const updated = await workAuthorizationsApi.update(editingWorkAuthId, workAuthForm);
        setWorkAuths((prev) => prev.map((wa) => (wa.id === editingWorkAuthId ? updated : wa)));
        addToast('Work authorization updated', 'success');
      } else {
        const created = await workAuthorizationsApi.create(workAuthForm);
        setWorkAuths((prev) => [...prev, created]);
        addToast('Work authorization added', 'success');
      }
      resetWorkAuthForm();
    } catch (err) {
      setWorkAuthFormError(parseApiError(err, 'Failed to save work authorization'));
    } finally {
      setAddingWorkAuth(false);
    }
  };

  const handleEditWorkAuth = (wa: WorkAuthorization) => {
    setEditingWorkAuthId(wa.id);
    setWorkAuthForm({
      country_code: wa.country_code,
      status: wa.status,
      expiry_date: wa.expiry_date || undefined,
      notes: wa.notes || undefined,
    });
    setShowAddWorkAuth(true);
    setWorkAuthFormError(null);
  };

  const handleDeleteClick = (wa: WorkAuthorization) => {
    setWorkAuthToDelete(wa);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!workAuthToDelete) return;
    try {
      await workAuthorizationsApi.delete(workAuthToDelete.id);
      setWorkAuths((prev) => prev.filter((wa) => wa.id !== workAuthToDelete.id));
      setDeleteModalOpen(false);
      setWorkAuthToDelete(null);
      addToast('Work authorization deleted', 'success');
    } catch {
      addToast('Failed to delete work authorization', 'error');
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto">
        <PageHeader title="Profile" subtitle="Manage your personal and professional information" />
        <div className="space-y-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-surface rounded-[var(--radius-lg)] shadow-sm border border-border p-6">
              <Skeleton className="h-6 w-40 mb-4" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <PageHeader
        title="Profile"
        subtitle={`Manage your personal and professional information${profile?.updated_at ? ` · Last updated ${formatDate(profile.updated_at)}` : ''}`}
      />

      <Form onSubmit={handleSubmit}>
        <div className="space-y-8">
          {/* ============================================
              BASIC INFORMATION
              ============================================ */}
          <section className="bg-surface rounded-[var(--radius-lg)] shadow-sm border border-border p-6">
            <h2 className="text-lg font-semibold text-text mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-text-muted" />
              Basic Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Full Name"
                value={form.fullName}
                onChange={(e) => updateField('fullName', e.target.value)}
                placeholder="John Doe"
              />
              <Input
                label="Phone"
                value={form.phone}
                onChange={(e) => updateField('phone', e.target.value)}
                placeholder="+1 234 567 8900"
              />
              <Input
                label="Location"
                value={form.location}
                onChange={(e) => updateField('location', e.target.value)}
                placeholder="Amsterdam, Netherlands"
              />
              <Input
                label="Nationality"
                value={form.nationality}
                onChange={(e) => updateField('nationality', e.target.value)}
                placeholder="Dutch"
              />
            </div>
          </section>

          {/* ============================================
              ONLINE PRESENCE
              ============================================ */}
          <section className="bg-surface rounded-[var(--radius-lg)] shadow-sm border border-border p-6">
            <h2 className="text-lg font-semibold text-text mb-4 flex items-center gap-2">
              <Link className="w-5 h-5 text-text-muted" />
              Online Presence
            </h2>
            <div className="space-y-4">
              <Input
                label="LinkedIn URL"
                value={form.linkedinUrl}
                onChange={(e) => updateField('linkedinUrl', e.target.value)}
                placeholder="https://linkedin.com/in/johndoe"
              />
              <Input
                label="GitHub URL"
                value={form.githubUrl}
                onChange={(e) => updateField('githubUrl', e.target.value)}
                placeholder="https://github.com/johndoe"
              />
              <Input
                label="Portfolio URL"
                value={form.portfolioUrl}
                onChange={(e) => updateField('portfolioUrl', e.target.value)}
                placeholder="https://johndoe.dev"
              />
            </div>
          </section>

          {/* ============================================
              PROFESSIONAL SUMMARY
              ============================================ */}
          <section className="bg-surface rounded-[var(--radius-lg)] shadow-sm border border-border p-6">
            <h2 className="text-lg font-semibold text-text mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-text-muted" />
              Professional Summary
            </h2>
            <div className="space-y-4">
              <Textarea
                label="Summary"
                value={form.summary}
                onChange={(e) => updateField('summary', e.target.value)}
                placeholder="A brief professional summary..."
                rows={4}
              />
            </div>
          </section>

          {/* ============================================
              SALARY EXPECTATIONS
              ============================================ */}
          <section className="bg-surface rounded-[var(--radius-lg)] shadow-sm border border-border p-6">
            <h2 className="text-lg font-semibold text-text mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-text-muted" />
              Salary Expectations
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Select
                label="Currency"
                options={CURRENCY_OPTIONS}
                value={form.baseCurrency}
                onChange={(e) => updateField('baseCurrency', e.target.value)}
              />
              <Input
                label="Minimum (Annual)"
                type="number"
                value={form.salaryMin}
                onChange={(e) => updateField('salaryMin', e.target.value)}
                placeholder="50000"
              />
              <Input
                label="Maximum (Annual)"
                type="number"
                value={form.salaryMax}
                onChange={(e) => updateField('salaryMax', e.target.value)}
                placeholder="80000"
              />
            </div>
          </section>

          {/* ============================================
              SAVE BUTTON
              ============================================ */}
          {saveError && <Alert variant="danger">{saveError}</Alert>}
          <div className="flex justify-end">
            <Button type="submit" loading={saving}>
              Save Profile
            </Button>
          </div>
        </div>
      </Form>

      {/* ============================================
          WORK AUTHORIZATIONS (separate from profile form)
          ============================================ */}
      <section className="mt-8 bg-surface rounded-[var(--radius-lg)] shadow-sm border border-border p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-text flex items-center gap-2">
            <Shield className="w-5 h-5 text-text-muted" />
            Work Authorizations
          </h2>
          {!showAddWorkAuth && (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => { resetWorkAuthForm(); setShowAddWorkAuth(true); }}
              icon={<Plus className="w-4 h-4" />}
            >
              Add
            </Button>
          )}
        </div>

        {workAuthFormError && (
          <Alert variant="danger" className="mb-4">{workAuthFormError}</Alert>
        )}

        {/* Existing work authorizations */}
        {workAuths.length === 0 && !showAddWorkAuth && (
          <p className="text-sm text-text-muted">
            No work authorizations added yet. Add your visa or work permit details to track eligibility.
          </p>
        )}

        {workAuths.length > 0 && (
          <div className="space-y-3 mb-4">
            {workAuths.map((wa) => (
              <div
                key={wa.id}
                className="flex items-center justify-between p-3 bg-surface-alt rounded-[var(--radius-md)]"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm text-text">
                      {wa.country_code}
                    </span>
                    <Badge variant="info">
                      {WORK_AUTH_STATUSES.find((s) => s.value === wa.status)?.label || wa.status}
                    </Badge>
                    {wa.expiry_date && new Date(wa.expiry_date) < new Date() && (
                      <Badge variant="danger">Expired</Badge>
                    )}
                    {wa.expiry_date && (
                      <span className={`text-xs ${wa.expiry_date && new Date(wa.expiry_date) < new Date() ? 'text-danger font-medium' : 'text-text-muted'}`}>
                        {new Date(wa.expiry_date) < new Date() ? 'Expired' : 'Expires'}: {formatDate(wa.expiry_date)}
                      </span>
                    )}
                  </div>
                  {wa.notes && (
                    <p className="text-xs text-text-muted mt-1 truncate">
                      {wa.notes}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1 ml-2">
                  <Tooltip content="Edit">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditWorkAuth(wa)}
                      aria-label="Edit"
                      className="text-text-placeholder hover:text-primary"
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                  </Tooltip>
                  <Tooltip content="Delete">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteClick(wa)}
                      aria-label="Delete"
                      className="text-text-placeholder hover:text-danger"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </Tooltip>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add/Edit form */}
        {showAddWorkAuth && (
          <div className="border border-border rounded-[var(--radius-md)] p-4 space-y-3">
            <h3 className="text-sm font-medium text-text">
              {editingWorkAuthId ? 'Edit Work Authorization' : 'Add Work Authorization'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input
                label="Country Code (ISO 3166-1 alpha-3)"
                value={workAuthForm.country_code}
                onChange={(e) => setWorkAuthForm((f) => ({ ...f, country_code: e.target.value.toUpperCase() }))}
                placeholder="NLD"
                maxLength={3}
              />
              <Select
                label="Status"
                options={WORK_AUTH_STATUSES}
                value={workAuthForm.status}
                onChange={(e) => setWorkAuthForm((f) => ({ ...f, status: e.target.value as any }))}
              />
              <DateInput
                label="Expiry Date"
                value={workAuthForm.expiry_date || ''}
                onChange={(e) => setWorkAuthForm((f) => ({ ...f, expiry_date: e.target.value || undefined }))}
                showRelative
                warnPast
              />
              <Input
                label="Notes"
                value={workAuthForm.notes || ''}
                onChange={(e) => setWorkAuthForm((f) => ({ ...f, notes: e.target.value }))}
                placeholder="Optional notes..."
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="secondary" size="sm" onClick={resetWorkAuthForm}>
                Cancel
              </Button>
              <Button type="button" size="sm" loading={addingWorkAuth} onClick={handleAddWorkAuth}>
                {editingWorkAuthId ? 'Update' : 'Add'}
              </Button>
            </div>
          </div>
        )}
      </section>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete Work Authorization"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-text-secondary">
            Are you sure you want to delete this work authorization?
          </p>
          {workAuthToDelete && (
            <div className="bg-surface-alt p-3 rounded-[var(--radius-md)] text-sm">
              <p className="font-medium text-text">{workAuthToDelete.country_code}</p>
              <p className="text-text-muted mt-1">
                {WORK_AUTH_STATUSES.find((s) => s.value === workAuthToDelete.status)?.label || workAuthToDelete.status}
                {workAuthToDelete.expiry_date && ` · Expires ${formatDate(workAuthToDelete.expiry_date)}`}
              </p>
            </div>
          )}
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="secondary" onClick={() => setDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleConfirmDelete}>
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
