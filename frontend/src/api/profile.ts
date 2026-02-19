import { apiClient } from './client';
import type { UserProfile, UpdateProfileDto } from '@/types/profile';

/**
 * Profile API Service
 *
 * User profile is unique per user - there's only one profile per user.
 */
export const profileApi = {
  /**
   * Get the current user's profile
   * GET /profile
   */
  get: async (): Promise<UserProfile> => {
    const response = await apiClient.get<UserProfile>('/profile');
    return response.data;
  },

  /**
   * Update the current user's profile (upsert)
   * PUT /profile
   */
  update: async (data: UpdateProfileDto): Promise<UserProfile> => {
    const response = await apiClient.put<UserProfile>('/profile', data);
    return response.data;
  },

  /**
   * Delete the current user's profile
   * DELETE /profile
   */
  delete: async (): Promise<void> => {
    await apiClient.delete('/profile');
  },
};
