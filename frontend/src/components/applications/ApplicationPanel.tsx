import { useState, useEffect, useCallback } from 'react';
import { ExternalLink } from 'lucide-react';
import { SlideOver, Button, Modal, StatusBadge, STATUS_VARIANTS, TagBadge } from '@/components/common';
import { applicationsApi } from '@/api/applications';
import { useToast } from '@/contexts/ToastContext';
import { formatDate } from '@/utils/date';
import { parseApiError } from '@/utils/errors';
import { REMOTE_TYPES, SALARY_PERIODS } from '@/types/application';
import type { Application, RemoteType, SalaryPeriod } from '@/types/application';
import { ApplicationForm, type ApplicationFormData } from './ApplicationForm';
import { EligibilityBadge } from './EligibilityBadge';
import { TagPicker } from './TagPicker';

type PanelMode = 'create' | 'view' | 'edit';

interface StatusHistoryEntry {
  from_status: string | null;
  to_status: string;
  changed_at: string;
}

interface ApplicationPanelProps {
  mode: PanelMode;
  application: Application | null;
  isOpen: boolean;
  onClose: () => void;
  onCreated: (app: Application) => void;
  onUpdated: (app: Application) => void;
  onDeleted: (id: number) => void;
}

const STATUS_VARIANT_COLORS: Record<string, string> = {
  default: 'bg-text-muted',
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
  info: 'bg-info',
};

/**
 * ApplicationPanel - Unified slide-over for creating, viewing, and editing applications
 *
 * Replaces both the quick-create modal and the ApplicationDetailModal.
 */
export function ApplicationPanel({
  mode: initialMode,
  application: initialApplication,
  isOpen,
  onClose,
  onCreated,
  onUpdated,
  onDeleted,
}: ApplicationPanelProps) {
  const { addToast } = useToast();
  const [mode, setMode] = useState<PanelMode>(initialMode);
  const [application, setApplication] = useState<Application | null>(initialApplication);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [statusHistory, setStatusHistory] = useState<StatusHistoryEntry[]>([]);

  // Sync with external props
  useEffect(() => {
    setMode(initialMode);
    setApplication(initialApplication);
    setIsDeleteConfirmOpen(false);
  }, [initialMode, initialApplication, isOpen]);

  // Fetch status history when viewing an application
  useEffect(() => {
    if (application && (mode === 'view' || mode === 'edit')) {
      applicationsApi.getStatusHistory(application.id)
        .then(setStatusHistory)
        .catch(() => setStatusHistory([]));
    } else {
      setStatusHistory([]);
    }
  }, [application?.id, mode]);

  const handleClose = useCallback(() => {
    setIsDeleteConfirmOpen(false);
    onClose();
  }, [onClose]);

  // Determine if form data uses only quick-create fields
  const isQuickCreateData = (data: ApplicationFormData): boolean => {
    return !(
      data.job_description ||
      data.requirements ||
      data.location ||
      data.remote_type ||
      data.salary_advertised_min ||
      data.salary_advertised_max ||
      data.salary_currency ||
      data.salary_period ||
      data.visa_sponsorship ||
      data.role_country_code ||
      data.visa_type_id
    );
  };

  const handleCreate = async (data: ApplicationFormData): Promise<Application> => {
    if (isQuickCreateData(data)) {
      return applicationsApi.quickCreate({
        company_name: data.company_name,
        job_title: data.job_title,
        source: data.source,
        status: data.status,
        job_url: data.job_url,
        date_applied: data.date_applied,
        notes: data.notes,
      });
    }
    return applicationsApi.create({
      company_name: data.company_name,
      job_title: data.job_title,
      source: data.source,
      status: data.status,
      job_url: data.job_url,
      job_description: data.job_description,
      requirements: data.requirements,
      location: data.location,
      remote_type: data.remote_type as RemoteType,
      salary_advertised_min: data.salary_advertised_min,
      salary_advertised_max: data.salary_advertised_max,
      salary_currency: data.salary_currency,
      salary_period: data.salary_period as SalaryPeriod,
      visa_sponsorship: data.visa_sponsorship as 'yes' | 'no' | 'unknown',
      role_country_code: data.role_country_code,
      visa_type_id: data.visa_type_id,
      date_applied: data.date_applied,
      notes: data.notes,
    });
  };

  const handleSave = async (data: ApplicationFormData) => {
    setIsSaving(true);
    try {
      if (mode === 'create') {
        const newApp = await handleCreate(data);
        onCreated(newApp);
        addToast('Application created');
        handleClose();
      } else {
        // Edit mode
        const updated = await applicationsApi.update(application!.id, {
          job_title: data.job_title || undefined,
          job_url: data.job_url || undefined,
          job_description: data.job_description || undefined,
          requirements: data.requirements || undefined,
          location: data.location || undefined,
          remote_type: (data.remote_type as RemoteType) || undefined,
          salary_advertised_min: data.salary_advertised_min,
          salary_advertised_max: data.salary_advertised_max,
          salary_offered: data.salary_offered,
          salary_currency: data.salary_currency || undefined,
          salary_period: (data.salary_period as SalaryPeriod) || undefined,
          visa_sponsorship: (data.visa_sponsorship as 'yes' | 'no' | 'unknown') || undefined,
          role_country_code: data.role_country_code || undefined,
          visa_type_id: data.visa_type_id ?? null,
          status: data.status,
          date_applied: data.date_applied || undefined,
          date_responded: data.date_responded || undefined,
          notes: data.notes || undefined,
        });
        const mergedApp = { ...application!, ...updated };
        setApplication(mergedApp);
        onUpdated(mergedApp);
        setMode('view');
        addToast('Application updated');
      }
    } catch (err) {
      addToast(parseApiError(err, mode === 'create' ? 'Failed to create application' : 'Failed to save changes'), 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAndContinue = async (data: ApplicationFormData) => {
    setIsSaving(true);
    try {
      const newApp = await handleCreate(data);
      onCreated(newApp);
      setApplication(newApp);
      setMode('edit');
      addToast('Application created — continue editing');
    } catch (err) {
      addToast(parseApiError(err, 'Failed to create application'), 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!application) return;
    setIsDeleting(true);
    try {
      await applicationsApi.delete(application.id);
      onDeleted(application.id);
      addToast('Application deleted');
      handleClose();
    } catch (err) {
      addToast('Failed to delete application', 'error');
      console.error('Failed to delete application:', err);
    } finally {
      setIsDeleting(false);
      setIsDeleteConfirmOpen(false);
    }
  };

  // Panel title
  const panelTitle =
    mode === 'create'
      ? 'New Application'
      : application
        ? `${application.company_name || 'Unknown'} — ${application.job_title}`
        : 'Application Details';

  // Header actions for view mode
  const headerActions =
    mode === 'view' ? (
      <div className="flex items-center gap-1">
        <Button
          variant="danger"
          size="sm"
          onClick={() => setIsDeleteConfirmOpen(true)}
        >
          Delete
        </Button>
        <Button size="sm" onClick={() => setMode('edit')}>
          Edit
        </Button>
      </div>
    ) : undefined;

  return (
    <>
      <SlideOver
        isOpen={isOpen}
        onClose={handleClose}
        title={panelTitle}
        headerActions={headerActions}
      >
        {mode === 'view' && application ? (
          <ApplicationViewMode
            application={application}
            statusHistory={statusHistory}
            onApplicationChange={(updated) => {
              setApplication(updated);
              onUpdated(updated);
            }}
          />
        ) : (
          <ApplicationForm
            application={mode === 'edit' ? application : null}
            onSubmit={handleSave}
            onSaveAndContinue={mode === 'create' ? handleSaveAndContinue : undefined}
            onCancel={mode === 'edit' ? () => setMode('view') : handleClose}
            isSaving={isSaving}
          />
        )}
      </SlideOver>

      {/* Delete Confirmation Modal */}
      {application && (
        <Modal
          isOpen={isDeleteConfirmOpen}
          onClose={() => setIsDeleteConfirmOpen(false)}
          title="Delete Application"
          size="sm"
        >
          <div className="space-y-4">
            <p className="text-sm text-text-secondary">
              Are you sure you want to delete the application for{' '}
              <span className="font-medium text-text">
                {application.job_title}
              </span>{' '}
              at{' '}
              <span className="font-medium text-text">
                {application.company_name || 'Unknown'}
              </span>
              ? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <Button
                variant="secondary"
                onClick={() => setIsDeleteConfirmOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleDelete}
                loading={isDeleting}
              >
                Delete Application
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}

// ────────────────────────────────────────────────────────────
// View Mode Component
// ────────────────────────────────────────────────────────────

function ApplicationViewMode({
  application,
  statusHistory,
  onApplicationChange,
}: {
  application: Application;
  statusHistory: StatusHistoryEntry[];
  onApplicationChange: (updated: Application) => void;
}) {
  const hasJobInfo = application.job_url || application.location || application.remote_type;
  const hasDescription = application.job_description || application.requirements;
  const hasSalaryData =
    application.salary_advertised_min ||
    application.salary_advertised_max ||
    application.salary_offered;
  const hasVisaData =
    application.visa_sponsorship ||
    application.role_country_code ||
    application.visa_type_name ||
    application.eligibility;
  const hasApplicationMeta =
    application.source_name ||
    application.date_applied ||
    application.date_responded;

  const remoteLabel = REMOTE_TYPES.find((r) => r.value === application.remote_type)?.label;
  const salaryPeriodLabel = SALARY_PERIODS.find((p) => p.value === application.salary_period)?.label;

  const formatSalary = (amount: number | null) => {
    if (!amount) return null;
    if (application.salary_currency) {
      try {
        return new Intl.NumberFormat(undefined, {
          style: 'currency',
          currency: application.salary_currency,
          maximumFractionDigits: 0,
        }).format(amount);
      } catch {
        return amount.toLocaleString();
      }
    }
    return amount.toLocaleString();
  };

  const formatStatusLabel = (s: string) =>
    s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-surface-alt p-4 rounded-[var(--radius-lg)]">
        <h3 className="font-semibold text-lg text-text">
          {application.company_name || 'Unknown Company'}
        </h3>
        <p className="text-text-secondary">{application.job_title}</p>
        <div className="mt-2">
          <StatusBadge status={application.status || 'bookmarked'} />
        </div>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap items-center gap-1.5">
        {(application.tags || []).map((tag) => (
          <TagBadge key={tag.id} name={tag.name} color={tag.color} />
        ))}
        <TagPicker
          applicationId={application.id}
          currentTags={application.tags || []}
          onTagsChange={(newTags) => {
            onApplicationChange({ ...application, tags: newTags });
          }}
        />
      </div>

      {/* Job Info */}
      {hasJobInfo && (
        <div className="space-y-2">
          <SectionLabel>Job Info</SectionLabel>
          {application.job_url && (
            <Field label="URL">
              <a
                href={application.job_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline inline-flex items-center gap-1 text-sm break-all"
              >
                {application.job_url}
                <ExternalLink className="w-3 h-3 flex-shrink-0" />
              </a>
            </Field>
          )}
          {application.location && (
            <Field label="Location" value={application.location} />
          )}
          {remoteLabel && <Field label="Remote" value={remoteLabel} />}
        </div>
      )}

      {/* Description & Requirements */}
      {hasDescription && (
        <div className="space-y-2">
          <SectionLabel>Description</SectionLabel>
          {application.job_description && (
            <div>
              <span className="text-xs font-medium text-text-muted">
                Job Description
              </span>
              <p className="text-sm text-text whitespace-pre-wrap mt-1">
                {application.job_description}
              </p>
            </div>
          )}
          {application.requirements && (
            <div>
              <span className="text-xs font-medium text-text-muted">
                Requirements
              </span>
              <p className="text-sm text-text whitespace-pre-wrap mt-1">
                {application.requirements}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Compensation */}
      {hasSalaryData && (
        <div className="space-y-2">
          <SectionLabel>Compensation</SectionLabel>
          {(application.salary_advertised_min || application.salary_advertised_max) && (
            <Field label="Range">
              <span className="text-sm text-text">
                {formatSalary(application.salary_advertised_min)}
                {application.salary_advertised_min && application.salary_advertised_max && ' – '}
                {formatSalary(application.salary_advertised_max)}
                {salaryPeriodLabel && ` / ${salaryPeriodLabel}`}
              </span>
            </Field>
          )}
          {application.salary_offered && (
            <Field
              label="Offered"
              value={`${formatSalary(application.salary_offered)}${salaryPeriodLabel ? ` / ${salaryPeriodLabel}` : ''}`}
            />
          )}
        </div>
      )}

      {/* Application Meta */}
      {hasApplicationMeta && (
        <div className="space-y-2">
          <SectionLabel>Application</SectionLabel>
          {application.source_name && (
            <Field label="Source">
              {application.source_url ? (
                <a
                  href={application.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline inline-flex items-center gap-1 text-sm"
                >
                  {application.source_name}
                  <ExternalLink className="w-3 h-3 flex-shrink-0" />
                </a>
              ) : (
                <span className="text-sm text-text">
                  {application.source_name}
                </span>
              )}
            </Field>
          )}
          {application.date_applied && (
            <Field label="Applied" value={formatDate(application.date_applied)} />
          )}
          {application.date_responded && (
            <Field label="Responded" value={formatDate(application.date_responded)} />
          )}
        </div>
      )}

      {/* Visa & Eligibility */}
      {hasVisaData && (
        <div className="space-y-2">
          <SectionLabel>Visa & Eligibility</SectionLabel>
          {application.visa_sponsorship && (
            <Field
              label="Sponsorship"
              value={
                application.visa_sponsorship.charAt(0).toUpperCase() +
                application.visa_sponsorship.slice(1)
              }
            />
          )}
          {application.role_country_code && (
            <Field label="Country" value={application.role_country_code} />
          )}
          {application.visa_type_name && (
            <Field label="Visa Type" value={application.visa_type_name} />
          )}
          {application.eligibility && (
            <Field label="Eligibility">
              <EligibilityBadge eligibility={application.eligibility} mode="badge" />
            </Field>
          )}
          {application.eligibility?.status === 'authorized' && application.eligibility.expiry_date && (() => {
            const daysUntil = Math.ceil(
              (new Date(application.eligibility!.expiry_date!).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
            );
            if (daysUntil <= 90 && daysUntil > 0) {
              return (
                <p className="text-xs text-warning-text bg-warning-light px-2 py-1 rounded-[var(--radius-sm)]">
                  Authorization expires in {daysUntil} days ({application.eligibility!.expiry_date})
                </p>
              );
            }
            return null;
          })()}
        </div>
      )}

      {/* Notes */}
      {application.notes && (
        <div className="space-y-2">
          <SectionLabel>Notes</SectionLabel>
          <p className="text-sm text-text whitespace-pre-wrap">
            {application.notes}
          </p>
        </div>
      )}

      {/* Status History */}
      {statusHistory.length > 1 && (
        <div className="space-y-2">
          <SectionLabel>Status History</SectionLabel>
          <div className="space-y-2">
            {statusHistory.map((entry, i) => {
              const dotColor =
                STATUS_VARIANT_COLORS[STATUS_VARIANTS[entry.to_status] || 'default'];
              return (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${dotColor}`} />
                  <span className="text-text-secondary">
                    {entry.from_status
                      ? `${formatStatusLabel(entry.from_status)} → ${formatStatusLabel(entry.to_status)}`
                      : formatStatusLabel(entry.to_status)}
                  </span>
                  <span className="text-text-placeholder text-xs ml-auto whitespace-nowrap">
                    {formatDate(entry.changed_at)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Timestamps */}
      <div className="text-xs text-text-placeholder pt-4 border-t border-border space-y-1">
        <p>Created: {formatDate(application.created_at)}</p>
        <p>Updated: {formatDate(application.updated_at)}</p>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Helper Components
// ────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h4 className="text-xs font-medium uppercase tracking-wider text-text-muted pt-2 first:pt-0">
      {children}
    </h4>
  );
}

function Field({
  label,
  value,
  children,
}: {
  label: string;
  value?: string | null;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:items-start sm:gap-3">
      <span className="text-xs sm:text-sm text-text-muted sm:w-24 sm:flex-shrink-0">
        {label}
      </span>
      {children || (
        <span className="text-sm text-text">{value || '—'}</span>
      )}
    </div>
  );
}
