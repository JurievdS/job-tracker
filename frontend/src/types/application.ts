/**
 * Application Types
 *
 * These types match the backend API response shapes.
 * See: backend/src/routes/applications.ts
 */

/** Valid application status values */
export type ApplicationStatus =
  | 'bookmarked'
  | 'applied'
  | 'phone_screen'
  | 'technical'
  | 'final_round'
  | 'offer'
  | 'rejected'
  | 'withdrawn'
  | 'ghosted';

/** Remote work type */
export type RemoteType = 'onsite' | 'hybrid' | 'remote';

/** Salary period */
export type SalaryPeriod = 'hourly' | 'monthly' | 'annual';

/** Eligibility status computed server-side from work authorizations */
export type EligibilityStatus = 'authorized' | 'sponsorship_available' | 'not_authorized' | 'expired' | 'unknown';

/** Eligibility info attached to an application */
export interface Eligibility {
  status: EligibilityStatus;
  auth_type?: string;
  expiry_date?: string;
}

/** Tag attached to an application */
export interface ApplicationTag {
  id: number;
  name: string;
  color: string | null;
}

/** Application as returned from GET /applications */
export interface Application {
  id: number;
  company_id: number | null;
  company_name: string | null;

  // Job info
  job_title: string;
  job_url: string | null;
  job_description: string | null;
  requirements: string | null;
  location: string | null;
  remote_type: RemoteType | null;

  // Salary tracking
  salary_advertised_min: number | null;
  salary_advertised_max: number | null;
  salary_offered: number | null;
  salary_currency: string | null;
  salary_period: SalaryPeriod | null;

  // Visa/Eligibility
  visa_sponsorship: 'yes' | 'no' | 'unknown' | null;
  role_country_code: string | null;
  visa_type_id: number | null;
  visa_type_name: string | null;

  // Application meta
  status: ApplicationStatus | null;
  source_id: number | null;
  source_name: string | null;
  source_url: string | null;
  date_applied: string | null;
  date_responded: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;

  // Relations
  tags?: ApplicationTag[];

  // Eligibility (computed server-side)
  eligibility: Eligibility | null;
}

/** Payload for POST /applications */
export interface CreateApplicationDto {
  company_id?: number;
  company_name?: string;

  // Job info
  job_title: string;
  job_url?: string;
  job_description?: string;
  requirements?: string;
  location?: string;
  remote_type?: RemoteType;

  // Salary tracking
  salary_advertised_min?: number;
  salary_advertised_max?: number;
  salary_currency?: string;
  salary_period?: SalaryPeriod;

  // Visa/Eligibility
  visa_sponsorship?: 'yes' | 'no' | 'unknown';
  role_country_code?: string;
  visa_type_id?: number;

  // Application meta
  status?: ApplicationStatus;
  source: string; // source name - will be found/created on backend
  source_url?: string;
  date_applied?: string;
  notes?: string;
}

/** Payload for POST /applications/quick */
export interface QuickCreateApplicationDto {
  company_name: string;
  job_title: string;
  source: string; // source name - will be found/created on backend
  status?: ApplicationStatus;
  job_url?: string;
  date_applied?: string;
  notes?: string;
}

/** Payload for PUT /applications/:id */
export interface UpdateApplicationDto {
  company_id?: number;

  // Job info
  job_title?: string;
  job_url?: string;
  job_description?: string;
  requirements?: string;
  location?: string;
  remote_type?: RemoteType;

  // Salary tracking
  salary_advertised_min?: number;
  salary_advertised_max?: number;
  salary_offered?: number;
  salary_currency?: string;
  salary_period?: SalaryPeriod;

  // Visa/Eligibility
  visa_sponsorship?: 'yes' | 'no' | 'unknown';
  role_country_code?: string;
  visa_type_id?: number | null;

  // Application meta
  status?: ApplicationStatus;
  source?: string; // source name - will be found/created on backend
  source_url?: string;
  date_applied?: string;
  date_responded?: string;
  notes?: string;
}

export interface ApplicationCountsByStatus {
  [key: string]: number;
}

/** Source metrics from GET /applications/source-metrics */
export interface SourceMetric {
  source_id: number | null;
  source_name: string | null;
  total: number;
  applied: number;
  responded: number;
  interviews: number;
  offers: number;
}

/** Status options for filters and dropdowns */
export const APPLICATION_STATUSES: { value: ApplicationStatus; label: string }[] = [
  { value: 'bookmarked', label: 'Bookmarked' },
  { value: 'applied', label: 'Applied' },
  { value: 'phone_screen', label: 'Phone Screen' },
  { value: 'technical', label: 'Technical' },
  { value: 'final_round', label: 'Final Round' },
  { value: 'offer', label: 'Offer' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'withdrawn', label: 'Withdrawn' },
  { value: 'ghosted', label: 'Ghosted' },
];

/** Remote type options for dropdowns */
export const REMOTE_TYPES: { value: RemoteType; label: string }[] = [
  { value: 'onsite', label: 'On-site' },
  { value: 'hybrid', label: 'Hybrid' },
  { value: 'remote', label: 'Remote' },
];

/** Salary period options for dropdowns */
export const SALARY_PERIODS: { value: SalaryPeriod; label: string }[] = [
  { value: 'hourly', label: 'Hourly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'annual', label: 'Annual' },
];
