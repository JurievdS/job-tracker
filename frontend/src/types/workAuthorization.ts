/**
 * Work Authorization Types
 *
 * These types match the backend API response shapes.
 * See: backend/src/routes/workAuthorizations.ts
 */

/** Valid work authorization status values */
export type WorkAuthorizationStatus =
  | 'citizen'
  | 'permanent_resident'
  | 'work_permit'
  | 'schengen_visa'
  | 'student_visa'
  | 'dependent_visa';

/** Work authorization as returned from GET /work-authorizations */
export interface WorkAuthorization {
  id: number;
  user_id: number;
  country_code: string;
  status: WorkAuthorizationStatus;
  expiry_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

/** Payload for POST /work-authorizations */
export interface CreateWorkAuthorizationDto {
  country_code: string;
  status: WorkAuthorizationStatus;
  expiry_date?: string;
  notes?: string;
}

/** Payload for PUT /work-authorizations/:id */
export interface UpdateWorkAuthorizationDto {
  country_code?: string;
  status?: WorkAuthorizationStatus;
  expiry_date?: string | null;
  notes?: string;
}

/** Status options for dropdowns */
export const WORK_AUTH_STATUSES: { value: WorkAuthorizationStatus; label: string }[] = [
  { value: 'citizen', label: 'Citizen' },
  { value: 'permanent_resident', label: 'Permanent Resident' },
  { value: 'work_permit', label: 'Work Permit' },
  { value: 'schengen_visa', label: 'Schengen Visa' },
  { value: 'student_visa', label: 'Student Visa' },
  { value: 'dependent_visa', label: 'Dependent Visa' },
];
