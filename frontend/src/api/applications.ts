import { apiClient } from './client';
import type {
  Application,
  ApplicationStatus,
  CreateApplicationDto,
  QuickCreateApplicationDto,
  UpdateApplicationDto,
} from '@/types/application';

/**
 * Applications API Service
 *
 * Handles all CRUD operations for job applications.
 * All endpoints require authentication (handled by apiClient interceptors).
 */
export const applicationsApi = {
  /**
   * List all applications for the current user
   * GET /applications
   *
   * @param status - Optional filter by status
   */
  list: async (status?: ApplicationStatus): Promise<Application[]> => {
    const response = await apiClient.get<Application[]>('/applications', {
      params: status ? { status } : undefined,
    });
    return response.data;
  },

  /**
   * Get a single application by ID
   * GET /applications/:id
   */
  get: async (id: number): Promise<Application> => {
    const response = await apiClient.get<Application>(`/applications/${id}`);
    return response.data;
  },

  getCountsByStatus: async (): Promise<Record<ApplicationStatus, number>> => {
    const response = await apiClient.get<Record<ApplicationStatus, number>>('/applications/status-counts');
    return response.data;
  },

  /**
   * Create a new application
   * POST /applications
   */
  create: async (data: CreateApplicationDto): Promise<Application> => {
    const response = await apiClient.post<Application>('/applications', data);
    return response.data;
  },

  /**
   * Quick create an application with company and position names
   * POST /applications/quick
   *
   * Creates company and position if they don't exist, then creates the application.
   * Use this when you have company_name and position_title instead of position_id.
   */
  quickCreate: async (data: QuickCreateApplicationDto): Promise<Application> => {
    const response = await apiClient.post<Application>('/applications/quick', data);
    return response.data;
  },

  /**
   * Update an existing application
   * PUT /applications/:id
   */
  update: async (id: number, data: UpdateApplicationDto): Promise<Application> => {
    const response = await apiClient.put<Application>(`/applications/${id}`, data);
    return response.data;
  },

  /**
   * Update only the status of an application
   * PATCH /applications/:id/status
   *
   * Use this for quick status changes (e.g., drag-and-drop in Kanban)
   */
  updateStatus: async (id: number, status: ApplicationStatus): Promise<Application> => {
    const response = await apiClient.patch<Application>(`/applications/${id}/status`, {
      status,
    });
    return response.data;
  },

  /**
   * Delete an application
   * DELETE /applications/:id
   */
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/applications/${id}`);
  },
};
