/**
 * Source Types
 *
 * These types match the backend API response shapes.
 * See: backend/src/routes/sources.ts
 */

/** Valid source category values */
export type SourceCategory =
  | 'job_board'
  | 'aggregator'
  | 'company_site'
  | 'government'
  | 'recruiter'
  | 'referral'
  | 'community'
  | 'other';

/** Source as returned from GET /sources */
export interface Source {
  id: number;
  name: string;
  normalized_name: string | null;
  url: string | null;
  logo_url: string | null;
  category: SourceCategory | null;
  region: string | null;
  description: string | null;
  is_active: boolean;
  usage_count: number;
  created_at: string;
  updated_at: string | null;
}

/** Payload for POST /sources */
export interface CreateSourceDto {
  name: string;
  url?: string;
  logo_url?: string;
  category?: SourceCategory;
  region?: string;
  description?: string;
}

/** Payload for PUT /sources/:id */
export interface UpdateSourceDto {
  name?: string;
  url?: string;
  logo_url?: string;
  category?: SourceCategory;
  region?: string;
  description?: string;
}

/** User's personal notes/rating for a source */
export interface UserSourceNotes {
  id: number;
  user_id: number;
  source_id: number;
  notes: string | null;
  rating: number | null;
  created_at: string;
  updated_at: string;
}

/** Payload for PUT /sources/:id/notes */
export interface SetUserSourceNotesDto {
  notes?: string;
  rating?: number;
}

/** Source category options for dropdowns */
export const SOURCE_CATEGORIES: { value: SourceCategory; label: string }[] = [
  { value: 'job_board', label: 'Job Board' },
  { value: 'aggregator', label: 'Aggregator' },
  { value: 'company_site', label: 'Company Website' },
  { value: 'government', label: 'Government' },
  { value: 'recruiter', label: 'Recruiter' },
  { value: 'referral', label: 'Referral' },
  { value: 'community', label: 'Community' },
  { value: 'other', label: 'Other' },
];
