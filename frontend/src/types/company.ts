/**
 * Company - Global reference data
 * Companies are shared across all users
 */
export interface Company {
  id: number;
  name: string;
  website?: string;
  location?: string;
  industry?: string;
  created_at: string;
}

/**
 * Company with user's personal notes attached
 */
export interface CompanyWithNotes extends Company {
  user_notes?: string | null;
  user_rating?: number | null;
}

/**
 * Payload for creating a company
 */
export interface CreateCompanyDto {
  name: string;
  website?: string;
  location?: string;
  industry?: string;
}

/**
 * Payload for updating a company
 */
export type UpdateCompanyDto = Partial<CreateCompanyDto>;

/**
 * Payload for setting user's notes on a company
 */
export interface UserCompanyNotesDto {
  notes?: string;
  rating?: number;
}

/**
 * User's notes for a company
 */
export interface UserCompanyNotes {
  id: number;
  user_id: number;
  company_id: number;
  notes?: string | null;
  rating?: number | null;
  created_at: string;
  updated_at: string;
}

/**
 * Generic autocomplete option for dropdowns
 */
export interface AutocompleteOption {
  value: string;
  label: string;
}
