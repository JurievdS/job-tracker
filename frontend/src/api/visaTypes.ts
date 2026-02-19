import { apiClient } from './client';
import type {
  VisaType,
  CreateVisaTypeDto,
  UpdateVisaTypeDto,
  VisaRequirement,
  CreateVisaRequirementDto,
  UpdateVisaRequirementDto,
} from '@/types/visaType';

/**
 * Visa Types & Requirements API Service
 *
 * Handles CRUD operations for global visa type reference data
 * and their associated requirements.
 */
export const visaTypesApi = {
  // ==================== Visa Types ====================

  /**
   * List all visa types, optionally filtered by country
   * GET /visa-types?country=...
   */
  list: async (country?: string): Promise<VisaType[]> => {
    const params = country ? { country } : undefined;
    const response = await apiClient.get<VisaType[]>('/visa-types', { params });
    return response.data;
  },

  /**
   * Get a single visa type by ID
   * GET /visa-types/:id
   */
  get: async (id: number): Promise<VisaType> => {
    const response = await apiClient.get<VisaType>(`/visa-types/${id}`);
    return response.data;
  },

  /**
   * Create a new visa type
   * POST /visa-types
   */
  create: async (data: CreateVisaTypeDto): Promise<VisaType> => {
    const response = await apiClient.post<VisaType>('/visa-types', data);
    return response.data;
  },

  /**
   * Update an existing visa type
   * PUT /visa-types/:id
   */
  update: async (id: number, data: UpdateVisaTypeDto): Promise<VisaType> => {
    const response = await apiClient.put<VisaType>(`/visa-types/${id}`, data);
    return response.data;
  },

  /**
   * Delete a visa type (cascades to requirements)
   * DELETE /visa-types/:id
   */
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/visa-types/${id}`);
  },

  // ==================== Requirements ====================

  /**
   * List requirements for a visa type
   * GET /visa-types/:id/requirements
   */
  listRequirements: async (visaTypeId: number): Promise<VisaRequirement[]> => {
    const response = await apiClient.get<VisaRequirement[]>(`/visa-types/${visaTypeId}/requirements`);
    return response.data;
  },

  /**
   * Create a requirement for a visa type
   * POST /visa-types/:id/requirements
   */
  createRequirement: async (visaTypeId: number, data: CreateVisaRequirementDto): Promise<VisaRequirement> => {
    const response = await apiClient.post<VisaRequirement>(`/visa-types/${visaTypeId}/requirements`, data);
    return response.data;
  },

  /**
   * Update an existing requirement
   * PUT /visa-requirements/:id
   */
  updateRequirement: async (id: number, data: UpdateVisaRequirementDto): Promise<VisaRequirement> => {
    const response = await apiClient.put<VisaRequirement>(`/visa-requirements/${id}`, data);
    return response.data;
  },

  /**
   * Delete a requirement
   * DELETE /visa-requirements/:id
   */
  deleteRequirement: async (id: number): Promise<void> => {
    await apiClient.delete(`/visa-requirements/${id}`);
  },
};
