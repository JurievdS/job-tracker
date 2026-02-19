import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@/test/test-utils';
import { OAuthCallbackPage } from '../OAuthCallbackPage';

// Mock token storage
const mockSetTokens = vi.fn();
const mockClearTokens = vi.fn();
vi.mock('@/utils/storage', () => ({
  tokenStorage: {
    setTokens: (...args: unknown[]) => mockSetTokens(...args),
    clearTokens: () => mockClearTokens(),
    getAccessToken: () => null,
    getRefreshToken: () => null,
    hasTokens: () => false,
  },
}));

const mockRefreshAuth = vi.fn();
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    refreshAuth: mockRefreshAuth,
    user: null,
    isAuthenticated: false,
    isLoading: false,
  }),
}));

describe('OAuthCallbackPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows "Missing authentication tokens" when no params provided', async () => {
    render(<OAuthCallbackPage />, { initialEntries: ['/auth/callback'] });

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/missing authentication tokens/i);
    });
  });

  it('shows friendly error for ?error=access_denied', async () => {
    render(<OAuthCallbackPage />, {
      initialEntries: ['/auth/callback?error=access_denied'],
    });

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/declined the sign-in/i);
    });
  });

  it('shows generic error for unknown ?error=xyz', async () => {
    render(<OAuthCallbackPage />, {
      initialEntries: ['/auth/callback?error=xyz'],
    });

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/something went wrong/i);
    });
  });

  it('shows "Missing authentication tokens" when only refreshToken provided', async () => {
    render(<OAuthCallbackPage />, {
      initialEntries: ['/auth/callback?refreshToken=abc'],
    });

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/missing authentication tokens/i);
    });
  });

  it('stores tokens and calls refreshAuth on valid callback', async () => {
    mockRefreshAuth.mockResolvedValueOnce(undefined);

    render(<OAuthCallbackPage />, {
      initialEntries: ['/auth/callback?accessToken=at123&refreshToken=rt456'],
    });

    await waitFor(() => {
      expect(mockSetTokens).toHaveBeenCalledWith('at123', 'rt456');
      expect(mockRefreshAuth).toHaveBeenCalled();
    });
  });

  it('shows "Back to login" link on error', async () => {
    render(<OAuthCallbackPage />, {
      initialEntries: ['/auth/callback?error=access_denied'],
    });

    await waitFor(() => {
      expect(screen.getByRole('link', { name: /back to login/i })).toBeInTheDocument();
    });
  });
});
