/**
 * Contact - A person at a company
 */
export interface Contact {
  id: number;
  company_id: number | null;
  name: string;
  role: string | null;
  email: string | null;
  linkedin: string | null;
  notes: string | null;
  created_at: string;
  company_name: string | null; // Joined from companies table
}

/**
 * CreateContactDto - Data for creating a new contact
 */
export interface CreateContactDto {
  name: string;
  company_id: number;
  role?: string;
  email?: string;
  linkedin?: string;
  notes?: string;
}

/**
 * UpdateContactDto - Data for updating a contact
 */
export interface UpdateContactDto {
  name?: string;
  company_id?: number;
  role?: string;
  email?: string;
  linkedin?: string;
  notes?: string;
}
