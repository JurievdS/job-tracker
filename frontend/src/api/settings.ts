import { apiClient } from './client';
import type { User } from '@/types/auth';

export interface ChangePasswordDto {
  current_password?: string;
  new_password: string;
}

export interface UpdateAccountDto {
  name?: string;
}

export const settingsApi = {
  updateAccount: async (data: UpdateAccountDto): Promise<User> => {
    const response = await apiClient.put<User>('/auth/account', data);
    return response.data;
  },

  changePassword: async (data: ChangePasswordDto): Promise<void> => {
    await apiClient.put('/auth/password', data);
  },

  deleteAccount: async (): Promise<void> => {
    await apiClient.delete('/auth/account');
  },
};
