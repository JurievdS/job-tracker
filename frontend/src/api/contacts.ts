import { apiClient } from './client';
import type { Contact, CreateContactDto, UpdateContactDto } from '@/types/contact';

/**
 * Contacts API Service
 *
 * Contacts are user-specific - each user has their own contacts at companies.
 */
export const contactsApi = {
  /**
   * List contacts, optionally filtered by company
   * GET /contacts
   * GET /contacts?company_id=123
   */
  list: async (companyId?: number): Promise<Contact[]> => {
    const response = await apiClient.get<Contact[]>('/contacts', {
      params: companyId ? { company_id: companyId } : undefined,
    });
    return response.data;
  },

  /**
   * Get a single contact by ID
   * GET /contacts/:id
   */
  get: async (id: number): Promise<Contact> => {
    const response = await apiClient.get<Contact>(`/contacts/${id}`);
    return response.data;
  },

  /**
   * Create a new contact
   * POST /contacts
   */
  create: async (data: CreateContactDto): Promise<Contact> => {
    const response = await apiClient.post<Contact>('/contacts', data);
    return response.data;
  },

  /**
   * Update an existing contact
   * PUT /contacts/:id
   */
  update: async (id: number, data: UpdateContactDto): Promise<Contact> => {
    const response = await apiClient.put<Contact>(`/contacts/${id}`, data);
    return response.data;
  },

  /**
   * Delete a contact
   * DELETE /contacts/:id
   */
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/contacts/${id}`);
  },
};
