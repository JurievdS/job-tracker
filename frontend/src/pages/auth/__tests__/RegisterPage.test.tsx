import { describe, it, expect, vi, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { render, screen, waitFor } from '@/test/test-utils';
import { RegisterPage } from '../RegisterPage';

vi.mock('../OAuthButtons', () => ({ OAuthButtons: () => null }));

const mockRegister = vi.fn();
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    register: mockRegister,
    user: null,
    isAuthenticated: false,
    isLoading: false,
  }),
}));

describe('RegisterPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders name, email, password, confirm fields and submit button', () => {
    render(<RegisterPage />, { initialEntries: ['/register'] });

    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
  });

  it('shows short password error on blur when < 8 chars', async () => {
    const user = userEvent.setup();
    render(<RegisterPage />, { initialEntries: ['/register'] });

    const passwordField = screen.getByLabelText(/^password$/i);
    await user.type(passwordField, 'short');
    await user.tab(); // blur

    await waitFor(() => {
      expect(screen.getByText(/at least 8 characters/i)).toBeInTheDocument();
    });
  });

  it('shows mismatch error on blur (confirm >= password length, different values)', async () => {
    const user = userEvent.setup();
    render(<RegisterPage />, { initialEntries: ['/register'] });

    await user.type(screen.getByLabelText(/^password$/i), 'password123');
    await user.type(screen.getByLabelText(/confirm password/i), 'password456');
    await user.tab(); // blur confirm

    await waitFor(() => {
      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
    });
  });

  it('prevents submit when password < 8 chars', async () => {
    const user = userEvent.setup();
    render(<RegisterPage />, { initialEntries: ['/register'] });

    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/^password$/i), 'short');
    await user.type(screen.getByLabelText(/confirm password/i), 'short');
    await user.click(screen.getByRole('button', { name: /create account/i }));

    expect(mockRegister).not.toHaveBeenCalled();
    await waitFor(() => {
      expect(screen.getByText(/at least 8 characters/i)).toBeInTheDocument();
    });
  });

  it('prevents submit when passwords differ', async () => {
    const user = userEvent.setup();
    render(<RegisterPage />, { initialEntries: ['/register'] });

    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/^password$/i), 'password123');
    await user.type(screen.getByLabelText(/confirm password/i), 'pass');
    await user.click(screen.getByRole('button', { name: /create account/i }));

    expect(mockRegister).not.toHaveBeenCalled();
  });

  it('submitting calls register with email, password, and name', async () => {
    mockRegister.mockResolvedValueOnce(undefined);
    const user = userEvent.setup();

    render(<RegisterPage />, { initialEntries: ['/register'] });

    await user.type(screen.getByLabelText(/name/i), 'John');
    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/^password$/i), 'password123');
    await user.type(screen.getByLabelText(/confirm password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
        name: 'John',
      });
    });
  });

  it('submitting with empty name passes name as undefined', async () => {
    mockRegister.mockResolvedValueOnce(undefined);
    const user = userEvent.setup();

    render(<RegisterPage />, { initialEntries: ['/register'] });

    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/^password$/i), 'password123');
    await user.type(screen.getByLabelText(/confirm password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
        name: undefined,
      });
    });
  });

  it('displays API error message on registration failure', async () => {
    mockRegister.mockRejectedValueOnce({
      response: { data: { error: 'Email already registered' } },
    });
    const user = userEvent.setup();

    render(<RegisterPage />, { initialEntries: ['/register'] });

    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/^password$/i), 'password123');
    await user.type(screen.getByLabelText(/confirm password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByText('Email already registered')).toBeInTheDocument();
    });
  });

  it('clears password error when user types in password field', async () => {
    const user = userEvent.setup();
    render(<RegisterPage />, { initialEntries: ['/register'] });

    const passwordField = screen.getByLabelText('Password');
    await user.type(passwordField, 'short');
    await user.tab(); // blur

    // Error state: aria-invalid=true and error text in danger color
    await waitFor(() => {
      expect(passwordField).toHaveAttribute('aria-invalid', 'true');
    });

    await user.type(passwordField, 'x');

    // Error cleared: aria-invalid back to false
    await waitFor(() => {
      expect(passwordField).toHaveAttribute('aria-invalid', 'false');
    });
  });
});
