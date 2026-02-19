import { apiClient } from './client';
import type {
  Application,
  ApplicationStatus,
  CreateApplicationDto,
  QuickCreateApplicationDto,
  UpdateApplicationDto,
  SourceMetric,
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
  list: async (status?: ApplicationStatus, companyId?: number): Promise<Application[]> => {
    const params: Record<string, string | number> = {};
    if (status) params.status = status;
    if (companyId) params.company_id = companyId;
    const response = await apiClient.get<Application[]>('/applications', {
      params: Object.keys(params).length > 0 ? params : undefined,
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

  /**
   * Get application counts by status
   * GET /applications/status-counts
   */
  getCountsByStatus: async (): Promise<Record<ApplicationStatus, number>> => {
    const response = await apiClient.get<Record<ApplicationStatus, number>>('/applications/status-counts');
    return response.data;
  },

  /**
   * Get source metrics
   * GET /applications/source-metrics
   */
  getSourceMetrics: async (): Promise<SourceMetric[]> => {
    const response = await apiClient.get<SourceMetric[]>('/applications/source-metrics');
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
   * Quick create an application with company name
   * POST /applications/quick
   *
   * Creates company if it doesn't exist, then creates the application.
   * Use this when you have company_name instead of company_id.
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
   * Get status history for an application
   * GET /applications/:id/status-history
   */
  getStatusHistory: async (id: number): Promise<{ from_status: string | null; to_status: string; changed_at: string }[]> => {
    const response = await apiClient.get(`/applications/${id}/status-history`);
    return response.data;
  },

  /**
   * Delete an application
   * DELETE /applications/:id
   */
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/applications/${id}`);
  },

  // === Tags ===

  /**
   * Get tags for an application
   * GET /applications/:id/tags
   */
  getTags: async (id: number): Promise<{ id: number; name: string; color: string | null }[]> => {
    const response = await apiClient.get(`/applications/${id}/tags`);
    return response.data;
  },

  /**
   * Add tags to an application
   * POST /applications/:id/tags
   */
  addTags: async (id: number, tagIds: number[]): Promise<void> => {
    await apiClient.post(`/applications/${id}/tags`, { tag_ids: tagIds });
  },

  /**
   * Set tags for an application (replaces existing)
   * PUT /applications/:id/tags
   */
  setTags: async (id: number, tagIds: number[]): Promise<void> => {
    await apiClient.put(`/applications/${id}/tags`, { tag_ids: tagIds });
  },

  /**
   * Remove tags from an application
   * DELETE /applications/:id/tags
   */
  removeTags: async (id: number, tagIds: number[]): Promise<void> => {
    await apiClient.delete(`/applications/${id}/tags`, { data: { tag_ids: tagIds } });
  },

  // === Documents ===

  /**
   * Get documents for an application
   * GET /applications/:id/documents
   */
  getDocuments: async (id: number): Promise<{ id: number; doc_type: string; label: string; file_path: string | null; doc_role: string | null; attached_at: string }[]> => {
    const response = await apiClient.get(`/applications/${id}/documents`);
    return response.data;
  },

  /**
   * Add documents to an application
   * POST /applications/:id/documents
   */
  addDocuments: async (id: number, documentIds: number[], docRole?: string): Promise<void> => {
    await apiClient.post(`/applications/${id}/documents`, {
      document_ids: documentIds,
      doc_role: docRole,
    });
  },

  /**
   * Set documents for an application (replaces existing)
   * PUT /applications/:id/documents
   */
  setDocuments: async (id: number, documentIds: number[], docRole?: string): Promise<void> => {
    await apiClient.put(`/applications/${id}/documents`, {
      document_ids: documentIds,
      doc_role: docRole,
    });
  },

  /**
   * Remove a document from an application
   * DELETE /applications/:id/documents/:docId
   */
  removeDocument: async (id: number, documentId: number): Promise<void> => {
    await apiClient.delete(`/applications/${id}/documents/${documentId}`);
  },
};
