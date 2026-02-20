import { apiClient } from './client';
import type { Source, CreateSourceDto, UpdateSourceDto, UserSourceNotes, SetUserSourceNotesDto } from '@/types/source';

/**
 * Sources API Service
 *
 * Handles all CRUD operations for job sources (job boards, recruiters, etc.).
 * Sources are global/shared across all users.
 */
export const sourcesApi = {
  /**
   * List all active sources
   * GET /sources
   */
  list: async (): Promise<Source[]> => {
    const response = await apiClient.get<Source[]>('/sources');
    return response.data;
  },

  /**
   * Search sources by name
   * GET /sources/search?q=...
   */
  search: async (query: string): Promise<Source[]> => {
    const response = await apiClient.get<Source[]>(`/sources/search?q=${encodeURIComponent(query)}`);
    return response.data;
  },

  /**
   * Get a single source by ID
   * GET /sources/:id
   */
  get: async (id: number): Promise<Source> => {
    const response = await apiClient.get<Source>(`/sources/${id}`);
    return response.data;
  },

  /**
   * Create a new source
   * POST /sources
   */
  create: async (data: CreateSourceDto): Promise<Source> => {
    const response = await apiClient.post<Source>('/sources', data);
    return response.data;
  },

  /**
   * Find or create a source by name
   * POST /sources/find-or-create
   */
  findOrCreate: async (name: string): Promise<Source> => {
    const response = await apiClient.post<Source>('/sources/find-or-create', { name });
    return response.data;
  },

  /**
   * Update an existing source
   * PUT /sources/:id
   */
  update: async (id: number, data: UpdateSourceDto): Promise<Source> => {
    const response = await apiClient.put<Source>(`/sources/${id}`, data);
    return response.data;
  },

  /**
   * Delete a source (soft delete)
   * DELETE /sources/:id
   */
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/sources/${id}`);
  },

  // ==================== User Notes ====================

  /**
   * Get user's personal notes/rating for a source
   * GET /sources/:id/notes
   */
  getUserNotes: async (sourceId: number): Promise<UserSourceNotes | null> => {
    const response = await apiClient.get<UserSourceNotes | null>(`/sources/${sourceId}/notes`);
    return response.data;
  },

  /**
   * Set user's personal notes/rating for a source (upsert)
   * PUT /sources/:id/notes
   */
  setUserNotes: async (sourceId: number, data: SetUserSourceNotesDto): Promise<UserSourceNotes> => {
    const response = await apiClient.put<UserSourceNotes>(`/sources/${sourceId}/notes`, data);
    return response.data;
  },

  /**
   * Delete user's personal notes for a source
   * DELETE /sources/:id/notes
   */
  deleteUserNotes: async (sourceId: number): Promise<void> => {
    await apiClient.delete(`/sources/${sourceId}/notes`);
  },
};
