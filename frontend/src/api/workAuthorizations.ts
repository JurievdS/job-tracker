import { apiClient } from './client';
import type {
  WorkAuthorization,
  CreateWorkAuthorizationDto,
  UpdateWorkAuthorizationDto,
} from '@/types/workAuthorization';

/**
 * Work Authorizations API Service
 *
 * Handles CRUD operations for user work authorizations (visa status per country).
 * All endpoints are user-scoped (filtered by authenticated user).
 */
export const workAuthorizationsApi = {
  /**
   * List all work authorizations for the current user
   * GET /work-authorizations
   */
  list: async (): Promise<WorkAuthorization[]> => {
    const response = await apiClient.get<WorkAuthorization[]>('/work-authorizations');
    return response.data;
  },

  /**
   * Get a single work authorization by ID
   * GET /work-authorizations/:id
   */
  get: async (id: number): Promise<WorkAuthorization> => {
    const response = await apiClient.get<WorkAuthorization>(`/work-authorizations/${id}`);
    return response.data;
  },

  /**
   * Create a new work authorization
   * POST /work-authorizations
   */
  create: async (data: CreateWorkAuthorizationDto): Promise<WorkAuthorization> => {
    const response = await apiClient.post<WorkAuthorization>('/work-authorizations', data);
    return response.data;
  },

  /**
   * Update an existing work authorization
   * PUT /work-authorizations/:id
   */
  update: async (id: number, data: UpdateWorkAuthorizationDto): Promise<WorkAuthorization> => {
    const response = await apiClient.put<WorkAuthorization>(`/work-authorizations/${id}`, data);
    return response.data;
  },

  /**
   * Delete a work authorization
   * DELETE /work-authorizations/:id
   */
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/work-authorizations/${id}`);
  },
};
