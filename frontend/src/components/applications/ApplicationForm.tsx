import { useState, useEffect } from 'react';
import {
  Input,
  Textarea,
  Select,
  DateInput,
  ComboBox,
  Button,
  CollapsibleSection,
  type ComboBoxOption,
} from '@/components/common';
import { companiesApi } from '@/api/companies';
import { sourcesApi } from '@/api/sources';
import { visaTypesApi } from '@/api/visaTypes';
import { today } from '@/utils/date';
import { normalizeUrl } from '@/utils/url';
import {
  APPLICATION_STATUSES,
  REMOTE_TYPES,
  SALARY_PERIODS,
  type Application,
  type ApplicationStatus,
} from '@/types/application';

interface ApplicationFormProps {
  /** Existing application for edit mode; null for create mode */
  application?: Application | null;
  /** Called with form data when saving */
  onSubmit: (data: ApplicationFormData) => Promise<void>;
  /** Only shown in create mode */
  onSaveAndContinue?: (data: ApplicationFormData) => Promise<void>;
  /** Cancel editing */
  onCancel: () => void;
  /** Loading state for save button */
  isSaving: boolean;
}

export interface ApplicationFormData {
  company_name: string;
  job_title: string;
  source: string;
  job_url?: string;
  job_description?: string;
  requirements?: string;
  location?: string;
  remote_type?: string;
  salary_advertised_min?: number;
  salary_advertised_max?: number;
  salary_offered?: number;
  salary_currency?: string;
  salary_period?: string;
  visa_sponsorship?: string;
  role_country_code?: string;
  visa_type_id?: number;
  status: ApplicationStatus;
  date_applied?: string;
  date_responded?: string;
  notes?: string;
}

const VISA_OPTIONS = [
  { value: '', label: 'Not specified' },
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
  { value: 'unknown', label: 'Unknown' },
];

const REMOTE_OPTIONS = [
  { value: '', label: 'Not specified' },
  ...REMOTE_TYPES,
];

const SALARY_PERIOD_OPTIONS = [
  { value: '', label: 'Not specified' },
  ...SALARY_PERIODS,
];

/**
 * ApplicationForm - Shared form for creating and editing applications
 *
 * Organized into collapsible sections. In create mode, only "Essentials"
 * is expanded. In edit mode, sections with data are expanded.
 */
export function ApplicationForm({
  application,
  onSubmit,
  onSaveAndContinue,
  onCancel,
  isSaving,
}: ApplicationFormProps) {
  const isCreate = !application;

  // ComboBox state
  const [company, setCompany] = useState<ComboBoxOption | null>(null);
  const [companies, setCompanies] = useState<ComboBoxOption[]>([]);
  const [source, setSource] = useState<ComboBoxOption | null>(null);
  const [sources, setSources] = useState<ComboBoxOption[]>([]);

  // Form fields
  const [jobTitle, setJobTitle] = useState('');
  const [jobUrl, setJobUrl] = useState('');
  const [status, setStatus] = useState<ApplicationStatus>('bookmarked');
  const [dateApplied, setDateApplied] = useState(isCreate ? today() : '');

  // Location & Remote
  const [location, setLocation] = useState('');
  const [remoteType, setRemoteType] = useState('');

  // Description
  const [jobDescription, setJobDescription] = useState('');
  const [requirements, setRequirements] = useState('');

  // Compensation
  const [salaryMin, setSalaryMin] = useState('');
  const [salaryMax, setSalaryMax] = useState('');
  const [salaryOffered, setSalaryOffered] = useState('');
  const [salaryCurrency, setSalaryCurrency] = useState('');
  const [salaryPeriod, setSalaryPeriod] = useState('');

  // Visa & Eligibility
  const [visaSponsorship, setVisaSponsorship] = useState('');
  const [roleCountryCode, setRoleCountryCode] = useState('');
  const [visaType, setVisaType] = useState<ComboBoxOption | null>(null);
  const [visaTypeOptions, setVisaTypeOptions] = useState<ComboBoxOption[]>([]);

  // Application meta
  const [dateResponded, setDateResponded] = useState('');
  const [notes, setNotes] = useState('');

  // Validation
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Populate form in edit mode
  useEffect(() => {
    if (application) {
      setCompany(
        application.company_name
          ? { value: application.company_name, label: application.company_name }
          : null
      );
      setSource(
        application.source_name
          ? { value: application.source_name, label: application.source_name }
          : null
      );
      setJobTitle(application.job_title || '');
      setJobUrl(application.job_url || '');
      setStatus(application.status || 'bookmarked');
      setDateApplied(application.date_applied || '');
      setLocation(application.location || '');
      setRemoteType(application.remote_type || '');
      setJobDescription(application.job_description || '');
      setRequirements(application.requirements || '');
      setSalaryMin(application.salary_advertised_min?.toString() || '');
      setSalaryMax(application.salary_advertised_max?.toString() || '');
      setSalaryOffered(application.salary_offered?.toString() || '');
      setSalaryCurrency(application.salary_currency || '');
      setSalaryPeriod(application.salary_period || '');
      setVisaSponsorship(application.visa_sponsorship || '');
      setRoleCountryCode(application.role_country_code || '');
      setVisaType(
        application.visa_type_id && application.visa_type_name
          ? { value: String(application.visa_type_id), label: application.visa_type_name }
          : null
      );
      setDateResponded(application.date_responded || '');
      setNotes(application.notes || '');
    }
  }, [application]);

  const collectFormData = (): ApplicationFormData | null => {
    const newErrors: Record<string, string> = {};

    if (!company) newErrors.company = 'Please select a company';
    if (!jobTitle.trim()) newErrors.jobTitle = 'Please enter a job title';
    if (!source) newErrors.source = 'Please select a source';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return null;
    }

    setErrors({});

    return {
      company_name: company!.label,
      job_title: jobTitle.trim(),
      source: source!.label,
      job_url: normalizeUrl(jobUrl),
      job_description: jobDescription || undefined,
      requirements: requirements || undefined,
      location: location || undefined,
      remote_type: remoteType || undefined,
      salary_advertised_min: salaryMin ? Number(salaryMin) : undefined,
      salary_advertised_max: salaryMax ? Number(salaryMax) : undefined,
      salary_offered: salaryOffered ? Number(salaryOffered) : undefined,
      salary_currency: salaryCurrency || undefined,
      salary_period: salaryPeriod || undefined,
      visa_sponsorship: visaSponsorship || undefined,
      role_country_code: roleCountryCode || undefined,
      visa_type_id: visaType ? Number(visaType.value) : undefined,
      status,
      date_applied: dateApplied || undefined,
      date_responded: dateResponded || undefined,
      notes: notes || undefined,
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = collectFormData();
    if (data) await onSubmit(data);
  };

  const handleSaveAndContinue = async () => {
    const data = collectFormData();
    if (data && onSaveAndContinue) await onSaveAndContinue(data);
  };

  const handleCompanySearch = async (term: string) => {
    const results = await companiesApi.search(term);
    setCompanies(results.map((c: { name: string }) => ({ value: c.name, label: c.name })));
  };

  const handleSourceSearch = async (term: string) => {
    const results = await sourcesApi.search(term);
    setSources(results.map((s: { name: string }) => ({ value: s.name, label: s.name })));
  };

  const handleVisaTypeSearch = async () => {
    const country = roleCountryCode.trim().toUpperCase();
    const results = await visaTypesApi.list(country || undefined);
    setVisaTypeOptions(
      results.map((vt) => ({ value: String(vt.id), label: `${vt.name} (${vt.country_code})` }))
    );
  };

  // Determine which sections have data (for default-open in edit mode)
  const hasLocationData = !!(application?.location || application?.remote_type);
  const hasDescriptionData = !!(application?.job_description || application?.requirements);
  const hasCompensationData = !!(
    application?.salary_advertised_min ||
    application?.salary_advertised_max ||
    application?.salary_offered
  );
  const hasVisaData = !!(application?.visa_sponsorship || application?.role_country_code || application?.visa_type_id);

  return (
    <form onSubmit={handleSubmit} className="space-y-1">
      {/* Essentials — always open */}
      <CollapsibleSection title="Essentials" defaultOpen>
        <div className="space-y-3">
          <ComboBox
            label="Company"
            value={company}
            onChange={setCompany}
            onSearch={handleCompanySearch}
            options={companies}
            error={errors.company}
            allowCreate
            onCreateNew={(name) => {
              const opt = { value: name, label: name };
              setCompanies((prev) => [...prev, opt]);
              setCompany(opt);
            }}
          />
          <Input
            label="Job Title"
            value={jobTitle}
            onChange={(e) => setJobTitle(e.target.value)}
            placeholder="Enter job title"
            error={errors.jobTitle}
          />
          <ComboBox
            label="Source"
            value={source}
            onChange={setSource}
            onSearch={handleSourceSearch}
            options={sources}
            error={errors.source}
            allowCreate
            onCreateNew={(name) => {
              const opt = { value: name, label: name };
              setSources((prev) => [...prev, opt]);
              setSource(opt);
            }}
          />
          <Input
            label="Job URL"
            value={jobUrl}
            onChange={(e) => setJobUrl(e.target.value)}
            placeholder="https://..."
          />
          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Status"
              value={status}
              onChange={(e) => setStatus(e.target.value as ApplicationStatus)}
              options={APPLICATION_STATUSES}
            />
            <DateInput
              label="Date Applied"
              value={dateApplied}
              onChange={(e) => setDateApplied(e.target.value)}
            />
          </div>
        </div>
      </CollapsibleSection>

      {/* Location & Remote */}
      <CollapsibleSection title="Location & Remote" defaultOpen={!isCreate && hasLocationData}>
        <div className="space-y-3">
          <Input
            label="Location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g. Amsterdam, NL"
          />
          <Select
            label="Remote Type"
            value={remoteType}
            onChange={(e) => setRemoteType(e.target.value)}
            options={REMOTE_OPTIONS}
          />
        </div>
      </CollapsibleSection>

      {/* Description */}
      <CollapsibleSection title="Description" defaultOpen={!isCreate && hasDescriptionData}>
        <div className="space-y-3">
          <Textarea
            label="Job Description"
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            placeholder="Paste or type job description..."
            rows={4}
          />
          <Textarea
            label="Requirements"
            value={requirements}
            onChange={(e) => setRequirements(e.target.value)}
            placeholder="Key requirements for the role..."
            rows={4}
          />
        </div>
      </CollapsibleSection>

      {/* Compensation */}
      <CollapsibleSection title="Compensation" defaultOpen={!isCreate && hasCompensationData}>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Currency"
              value={salaryCurrency}
              onChange={(e) => setSalaryCurrency(e.target.value)}
              placeholder="e.g. EUR"
            />
            <Select
              label="Period"
              value={salaryPeriod}
              onChange={(e) => setSalaryPeriod(e.target.value)}
              options={SALARY_PERIOD_OPTIONS}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label={`Salary Min${salaryCurrency ? ` (${salaryCurrency.toUpperCase()})` : ''}`}
              type="number"
              value={salaryMin}
              onChange={(e) => setSalaryMin(e.target.value)}
              placeholder="e.g. 80000"
            />
            <Input
              label={`Salary Max${salaryCurrency ? ` (${salaryCurrency.toUpperCase()})` : ''}`}
              type="number"
              value={salaryMax}
              onChange={(e) => setSalaryMax(e.target.value)}
              placeholder="e.g. 120000"
            />
          </div>
          {!isCreate && (
            <Input
              label={`Salary Offered${salaryCurrency ? ` (${salaryCurrency.toUpperCase()})` : ''}`}
              type="number"
              value={salaryOffered}
              onChange={(e) => setSalaryOffered(e.target.value)}
            />
          )}
        </div>
      </CollapsibleSection>

      {/* Visa & Eligibility */}
      <CollapsibleSection title="Visa & Eligibility" defaultOpen={!isCreate && hasVisaData}>
        <div className="space-y-3">
          <Select
            label="Visa Sponsorship"
            value={visaSponsorship}
            onChange={(e) => setVisaSponsorship(e.target.value)}
            options={VISA_OPTIONS}
          />
          <Input
            label="Country Code"
            value={roleCountryCode}
            onChange={(e) => {
              setRoleCountryCode(e.target.value);
              setVisaType(null);
              setVisaTypeOptions([]);
            }}
            placeholder="e.g. NLD"
            maxLength={3}
          />
          <ComboBox
            label="Target Visa Type"
            value={visaType}
            onChange={setVisaType}
            onSearch={handleVisaTypeSearch}
            options={visaTypeOptions}
            placeholder={roleCountryCode ? `Search visa types for ${roleCountryCode.toUpperCase()}...` : 'Set country code first'}
          />
        </div>
      </CollapsibleSection>

      {/* Notes */}
      <CollapsibleSection title="Notes" defaultOpen={!isCreate && !!application?.notes}>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Additional notes about this application..."
          rows={4}
        />
      </CollapsibleSection>

      {/* Date Responded (edit only) */}
      {!isCreate && (
        <CollapsibleSection title="Response" defaultOpen={!!application?.date_responded}>
          <DateInput
            label="Date Responded"
            value={dateResponded}
            onChange={(e) => setDateResponded(e.target.value)}
          />
        </CollapsibleSection>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 pt-4 border-t border-border sticky bottom-0 bg-surface">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <div className="ml-auto flex items-center gap-2">
          {isCreate && onSaveAndContinue && (
            <Button
              type="button"
              variant="secondary"
              onClick={handleSaveAndContinue}
              loading={isSaving}
            >
              Save & Continue Editing
            </Button>
          )}
          <Button type="submit" loading={isSaving}>
            {isCreate ? 'Save' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </form>
  );
}
