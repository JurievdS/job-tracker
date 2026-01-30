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
  | 'rejected';

/** Application as returned from GET /applications */
export interface Application {
  id: number;
  position_id: number;
  status: ApplicationStatus;
  date_applied?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  position_title: string;
  company_name: string;
}

/** Payload for POST /applications */
export interface CreateApplicationDto {
  position_id: number;
  status?: ApplicationStatus;
  date_applied?: string;
  notes?: string;
}

/** Payload for POST /applications/quick */
export interface QuickCreateApplicationDto {
  company_name: string;
  position_title: string;
  status: ApplicationStatus;
  date_applied?: string;
  notes?: string;
}

/** Payload for PUT /applications/:id */
export interface UpdateApplicationDto {
  position_id?: number;
  status?: ApplicationStatus;
  date_applied?: string;
  notes?: string;
}

export interface ApplicationCountsByStatus {
  [key: string]: number;
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
];
