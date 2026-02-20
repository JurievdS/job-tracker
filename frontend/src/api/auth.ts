import { apiClient } from './client';
import type {
  User,
  LoginCredentials,
  RegisterCredentials,
  AuthResponse,
  RefreshResponse,
} from '@/types/auth';

/**
 * Auth API Service
 */
export const authApi = {
  /**
   * Login with email/password
   * POST /auth/login
   */
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>(
      '/auth/login',
      credentials
    );
    return response.data;
  },

  /**
   * Register new user
   * POST /auth/register
   */
  register: async (credentials: RegisterCredentials): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>(
      '/auth/register',
      credentials
    );
    return response.data;
  },

  /**
   * Refresh access token
   * POST /auth/refresh
   */
  refresh: async (refreshToken: string): Promise<RefreshResponse> => {
    const response = await apiClient.post<RefreshResponse>('/auth/refresh', {
      refreshToken,
    });
    return response.data;
  },

  /**
   * Logout - invalidate refresh token
   * POST /auth/logout
   */
  logout: async (refreshToken: string): Promise<void> => {
    await apiClient.post('/auth/logout', { refreshToken });
  },

  /**
   * Get current user
   * GET /auth/me
   */
  getCurrentUser: async (): Promise<User> => {
    const response = await apiClient.get<User>('/auth/me');
    return response.data;
  },

  /**
   * Get OAuth URL 
   * Returns the URL to initiate OAuth authentication with Google or GitHub
   */
  getGoogleAuthUrl: (): string => {
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
    return `${baseUrl}/auth/google`;
  },

  getGitHubAuthUrl: (): string => {
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
    return `${baseUrl}/auth/github`;
  },

  /**
   * Request password reset email
   * POST /auth/forgot-password
   */
  forgotPassword: async (email: string): Promise<{ message: string }> => {
    const response = await apiClient.post<{ message: string }>(
      '/auth/forgot-password',
      { email }
    );
    return response.data;
  },

  /**
   * Reset password with token
   * POST /auth/reset-password
   */
  resetPassword: async (token: string, password: string): Promise<{ message: string }> => {
    const response = await apiClient.post<{ message: string }>(
      '/auth/reset-password',
      { token, password }
    );
    return response.data;
  },
};
