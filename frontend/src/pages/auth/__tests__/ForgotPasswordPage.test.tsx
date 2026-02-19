import { describe, it, expect, vi, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { render, screen, waitFor } from '@/test/test-utils';
import { ForgotPasswordPage } from '../ForgotPasswordPage';

// Mock the auth API module
vi.mock('@/api/auth', () => ({
  authApi: {
    forgotPassword: vi.fn(),
  },
}));

// Import mock after vi.mock so we can control it per-test
import { authApi } from '@/api/auth';
const mockForgotPassword = vi.mocked(authApi.forgotPassword);

describe('ForgotPasswordPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders email input and submit button', () => {
    render(<ForgotPasswordPage />, { initialEntries: ['/forgot-password'] });

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send reset link/i })).toBeInTheDocument();
  });

  it('submitting calls forgotPassword with the entered email', async () => {
    mockForgotPassword.mockResolvedValueOnce({ message: 'ok' });
    const user = userEvent.setup();

    render(<ForgotPasswordPage />, { initialEntries: ['/forgot-password'] });

    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.click(screen.getByRole('button', { name: /send reset link/i }));

    await waitFor(() => {
      expect(mockForgotPassword).toHaveBeenCalledWith('test@example.com');
    });
  });

  it('shows success message after successful submit', async () => {
    mockForgotPassword.mockResolvedValueOnce({ message: 'ok' });
    const user = userEvent.setup();

    render(<ForgotPasswordPage />, { initialEntries: ['/forgot-password'] });

    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.click(screen.getByRole('button', { name: /send reset link/i }));

    await waitFor(() => {
      expect(screen.getByText(/check your email/i)).toBeInTheDocument();
    });
  });

  it('shows error message on API failure', async () => {
    mockForgotPassword.mockRejectedValueOnce(new Error('Network error'));
    const user = userEvent.setup();

    render(<ForgotPasswordPage />, { initialEntries: ['/forgot-password'] });

    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.click(screen.getByRole('button', { name: /send reset link/i }));

    await waitFor(() => {
      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    });
  });
});
