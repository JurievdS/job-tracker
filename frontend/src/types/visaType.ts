/**
 * Visa Type & Requirement Types
 *
 * These types match the backend API response shapes.
 * See: backend/src/routes/visaTypes.ts, backend/src/routes/visaRequirements.ts
 */

/** Visa type as returned from GET /visa-types */
export interface VisaType {
  id: number;
  country_code: string;
  name: string;
  description: string | null;
  source_url: string | null;
  valid_from: string;
  valid_until: string | null;
  created_at: string;
  updated_at: string;
}

/** Payload for POST /visa-types */
export interface CreateVisaTypeDto {
  country_code: string;
  name: string;
  description?: string;
  source_url?: string;
  valid_from: string;
  valid_until?: string;
}

/** Payload for PUT /visa-types/:id */
export interface UpdateVisaTypeDto {
  country_code?: string;
  name?: string;
  description?: string;
  source_url?: string;
  valid_from?: string;
  valid_until?: string | null;
}

/** Valid visa requirement type values */
export type VisaRequirementType =
  | 'salary_min'
  | 'employer_condition'
  | 'language'
  | 'qualification'
  | 'other';

/** Visa requirement as returned from GET /visa-types/:id/requirements */
export interface VisaRequirement {
  id: number;
  visa_type_id: number;
  requirement_type: VisaRequirementType;
  condition_label: string | null;
  min_value: number | null;
  currency: string | null;
  period: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
}

/** Payload for POST /visa-types/:id/requirements */
export interface CreateVisaRequirementDto {
  visa_type_id: number;
  requirement_type: VisaRequirementType;
  condition_label?: string;
  min_value?: number;
  currency?: string;
  period?: string;
  description?: string;
}

/** Payload for PUT /visa-requirements/:id */
export interface UpdateVisaRequirementDto {
  requirement_type?: VisaRequirementType;
  condition_label?: string;
  min_value?: number | null;
  currency?: string;
  period?: string;
  description?: string;
}

/** Requirement type options for dropdowns */
export const REQUIREMENT_TYPES: { value: VisaRequirementType; label: string }[] = [
  { value: 'salary_min', label: 'Minimum Salary' },
  { value: 'employer_condition', label: 'Employer Condition' },
  { value: 'language', label: 'Language' },
  { value: 'qualification', label: 'Qualification' },
  { value: 'other', label: 'Other' },
];
