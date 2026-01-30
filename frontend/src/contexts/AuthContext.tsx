import {
  createContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import { authApi } from '@/api/auth';
import { tokenStorage } from '@/utils/storage';
import type { User, LoginCredentials, RegisterCredentials } from '@/types/auth';

/**
 * Auth Context Types
 */
export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Refresh authentication using refresh token
   */
  const refreshAuth = useCallback(async () => {
    const refreshToken = tokenStorage.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token');
    }

    const { accessToken, refreshToken: newRefreshToken } =
      await authApi.refresh(refreshToken);

    tokenStorage.setTokens(accessToken, newRefreshToken);

    const userData = await authApi.getCurrentUser();
    setUser(userData);
  }, []);

  useEffect(() => {
    const initializeAuth = async () => {
      if (!tokenStorage.hasTokens()) {
        setIsLoading(false);
        return;
      }

      try {
        // Try to get current user with stored access token
        const userData = await authApi.getCurrentUser();
        setUser(userData);
      } catch {
        // Access token might be expired, try refresh
        try {
          await refreshAuth();
        } catch {
          // Refresh failed, clear tokens
          tokenStorage.clearTokens();
        }
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, [refreshAuth]);

  /**
   * Login with email/password
   */
  const login = useCallback(async (credentials: LoginCredentials) => {
    const { user: userData, accessToken, refreshToken } =
      await authApi.login(credentials);

    tokenStorage.setTokens(accessToken, refreshToken);
    setUser(userData);
  }, []);

  /**
   * Register new account
   */
  const register = useCallback(async (credentials: RegisterCredentials) => {
    const { user: userData, accessToken, refreshToken } =
      await authApi.register(credentials);

    tokenStorage.setTokens(accessToken, refreshToken);
    setUser(userData);
  }, []);

  /**
   * Logout - invalidate tokens
   */
  const logout = useCallback(async () => {
    const refreshToken = tokenStorage.getRefreshToken();

    if (refreshToken) {
      try {
        await authApi.logout(refreshToken);
      } catch {
        // Logout should succeed even if API call fails
      }
    }

    tokenStorage.clearTokens();
    setUser(null);
  }, []);

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    refreshAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
