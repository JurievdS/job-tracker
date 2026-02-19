import { apiClient } from './client';

export interface Tag {
  id: number;
  name: string;
  color: string | null;
  application_count: number;
}

/**
 * Tags API Service
 *
 * Handles CRUD operations for user-defined tags.
 */
export const tagsApi = {
  /** List all tags for the current user (with application counts) */
  list: async (): Promise<Tag[]> => {
    const response = await apiClient.get<Tag[]>('/tags');
    return response.data;
  },

  /** Create a new tag */
  create: async (data: { name: string; color?: string }): Promise<Tag> => {
    const response = await apiClient.post<Tag>('/tags', data);
    return response.data;
  },

  /** Update an existing tag */
  update: async (id: number, data: { name?: string; color?: string }): Promise<Tag> => {
    const response = await apiClient.put<Tag>(`/tags/${id}`, data);
    return response.data;
  },

  /** Delete a tag */
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/tags/${id}`);
  },
};
