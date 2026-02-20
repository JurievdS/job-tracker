import { describe, it, expect, vi, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { render, screen, waitFor } from '@/test/test-utils';
import { ResetPasswordPage } from '../ResetPasswordPage';

vi.mock('@/api/auth', () => ({
  authApi: {
    resetPassword: vi.fn(),
  },
}));

import { authApi } from '@/api/auth';
const mockResetPassword = vi.mocked(authApi.resetPassword);

describe('ResetPasswordPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows invalid link error when no token in URL', () => {
    render(<ResetPasswordPage />, { initialEntries: ['/reset-password'] });

    expect(screen.getByText(/invalid reset link/i)).toBeInTheDocument();
    expect(screen.getByText(/request a new password reset link/i)).toBeInTheDocument();
  });

  it('renders password fields when token is present', () => {
    render(<ResetPasswordPage />, { initialEntries: ['/reset-password?token=abc'] });

    expect(screen.getByLabelText(/new password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reset password/i })).toBeInTheDocument();
  });

  it('shows validation error for short password on blur', async () => {
    const user = userEvent.setup();

    render(<ResetPasswordPage />, { initialEntries: ['/reset-password?token=abc'] });

    const passwordInput = screen.getByLabelText(/new password/i);
    await user.type(passwordInput, 'short');
    await user.tab(); // trigger blur

    await waitFor(() => {
      expect(screen.getByText(/at least 8 characters/i)).toBeInTheDocument();
    });
  });

  // Values chosen deliberately: confirmPassword must be >= password.length for
  // the blur-time validateConfirm guard to trigger (it skips shorter partial input).
  it('shows validation error for mismatched passwords on blur', async () => {
    const user = userEvent.setup();

    render(<ResetPasswordPage />, { initialEntries: ['/reset-password?token=abc'] });

    await user.type(screen.getByLabelText(/new password/i), 'password123');
    await user.type(screen.getByLabelText(/confirm password/i), 'different123');
    await user.tab(); // trigger blur

    await waitFor(() => {
      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
    });
  });

  it('shows validation error for mismatched passwords on submit', async () => {
    const user = userEvent.setup();

    render(<ResetPasswordPage />, { initialEntries: ['/reset-password?token=abc'] });

    // Use a short confirm value that wouldn't trigger the blur guard
    await user.type(screen.getByLabelText(/new password/i), 'password123');
    await user.type(screen.getByLabelText(/confirm password/i), 'diff');
    await user.click(screen.getByRole('button', { name: /reset password/i }));

    await waitFor(() => {
      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
    });
    // Should NOT call the API
    expect(mockResetPassword).not.toHaveBeenCalled();
  });

  it('calls resetPassword with token and password on valid submit', async () => {
    mockResetPassword.mockResolvedValueOnce({ message: 'ok' });
    const user = userEvent.setup();

    render(<ResetPasswordPage />, { initialEntries: ['/reset-password?token=test-token-123'] });

    await user.type(screen.getByLabelText(/new password/i), 'new-secure-pass');
    await user.type(screen.getByLabelText(/confirm password/i), 'new-secure-pass');
    await user.click(screen.getByRole('button', { name: /reset password/i }));

    await waitFor(() => {
      expect(mockResetPassword).toHaveBeenCalledWith('test-token-123', 'new-secure-pass');
    });
  });

  it('shows success with "Sign In" link after reset', async () => {
    mockResetPassword.mockResolvedValueOnce({ message: 'ok' });
    const user = userEvent.setup();

    render(<ResetPasswordPage />, { initialEntries: ['/reset-password?token=abc'] });

    await user.type(screen.getByLabelText(/new password/i), 'new-secure-pass');
    await user.type(screen.getByLabelText(/confirm password/i), 'new-secure-pass');
    await user.click(screen.getByRole('button', { name: /reset password/i }));

    await waitFor(() => {
      expect(screen.getByText(/password reset$/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    });
  });

  it('shows API error message on failure', async () => {
    mockResetPassword.mockRejectedValueOnce({
      response: { data: { error: 'Invalid or expired reset link. Please request a new one.' } },
    });
    const user = userEvent.setup();

    render(<ResetPasswordPage />, { initialEntries: ['/reset-password?token=bad-token'] });

    await user.type(screen.getByLabelText(/new password/i), 'new-secure-pass');
    await user.type(screen.getByLabelText(/confirm password/i), 'new-secure-pass');
    await user.click(screen.getByRole('button', { name: /reset password/i }));

    await waitFor(() => {
      expect(screen.getByText(/invalid or expired/i)).toBeInTheDocument();
    });
  });
});
