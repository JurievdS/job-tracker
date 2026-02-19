/**
 * Type Definitions for Authentication
 *
 * These types match the backend API responses from:
 * - POST /auth/login
 * - POST /auth/register
 * - POST /auth/refresh
 * - GET /auth/me
 */

export interface User {
  id: number;
  email: string | null;
  name: string | null;
  avatar_url: string | null;
  created_at?: string;
  has_password?: boolean;
  google_connected?: boolean;
  github_connected?: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  name?: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface RefreshResponse {
  accessToken: string;
  refreshToken: string;
}
