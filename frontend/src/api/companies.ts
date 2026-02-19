import { apiClient } from "./client";
import type {
  Company,
  CompanyWithNotes,
  CreateCompanyDto,
  UpdateCompanyDto,
  UserCompanyNotes,
  UserCompanyNotesDto,
} from "@/types/company";

/**
 * Companies API Service
 *
 * Companies are GLOBAL reference data - shared across all users.
 * Users can add personal notes/ratings via separate endpoints.
 */
export const companiesApi = {
  /**
   * List all companies
   * GET /companies
   */
  list: async (): Promise<CompanyWithNotes[]> => {
    const response = await apiClient.get<CompanyWithNotes[]>("/companies");
    return response.data;
  },

  /**
   * Search companies by name
   * GET /companies/search?term=...
   */
  search: async (term: string): Promise<Company[]> => {
    const response = await apiClient.get<Company[]>("/companies/search", {
      params: { term },
    });
    return response.data;
  },

  /**
   * Get a single company by ID (with user's notes if authenticated)
   * GET /companies/:id
   */
  get: async (id: number): Promise<CompanyWithNotes> => {
    const response = await apiClient.get<CompanyWithNotes>(`/companies/${id}`);
    return response.data;
  },

  /**
   * Create a new company (global)
   * POST /companies
   */
  create: async (data: CreateCompanyDto): Promise<Company> => {
    const response = await apiClient.post<Company>("/companies", data);
    return response.data;
  },

  /**
   * Update a company (global)
   * PUT /companies/:id
   */
  update: async (id: number, data: UpdateCompanyDto): Promise<Company> => {
    const response = await apiClient.put<Company>(`/companies/${id}`, data);
    return response.data;
  },

  /**
   * Delete a company (global)
   * DELETE /companies/:id
   */
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/companies/${id}`);
  },

  // ==================== User Notes ====================

  /**
   * Get user's personal notes for a company
   * GET /companies/:id/notes
   */
  getNotes: async (companyId: number): Promise<UserCompanyNotes | null> => {
    const response = await apiClient.get<UserCompanyNotes | null>(
      `/companies/${companyId}/notes`
    );
    return response.data;
  },

  /**
   * Set user's personal notes/rating for a company
   * PUT /companies/:id/notes
   */
  setNotes: async (
    companyId: number,
    data: UserCompanyNotesDto
  ): Promise<UserCompanyNotes> => {
    const response = await apiClient.put<UserCompanyNotes>(
      `/companies/${companyId}/notes`,
      data
    );
    return response.data;
  },

  /**
   * Delete user's personal notes for a company
   * DELETE /companies/:id/notes
   */
  deleteNotes: async (companyId: number): Promise<void> => {
    await apiClient.delete(`/companies/${companyId}/notes`);
  },
};
