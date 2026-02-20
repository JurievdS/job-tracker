import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';
import { authApi } from '@/api/auth';
import { ROUTES } from '@/routes/routes';
import { Button, PasswordInput, Alert } from '@/components/common';

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmError, setConfirmError] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // No token in URL
  if (!token) {
    return (
      <div>
        <h2 className="text-2xl font-bold text-text">Invalid reset link</h2>
        <p className="mt-1 text-sm text-text-muted mb-6">
          This password reset link is invalid or incomplete.
        </p>
        <Alert variant="danger" className="mb-6">
          Please request a new password reset link.
        </Alert>
        <Link to={ROUTES.FORGOT_PASSWORD}>
          <Button className="w-full">Request New Link</Button>
        </Link>
      </div>
    );
  }

  const validatePassword = () => {
    if (password && password.length < 8) {
      setPasswordError('Must be at least 8 characters');
    } else {
      setPasswordError('');
    }
  };

  const validateConfirm = () => {
    if (confirmPassword && confirmPassword.length >= password.length && password !== confirmPassword) {
      setConfirmError('Passwords do not match');
    } else {
      setConfirmError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setPasswordError('Must be at least 8 characters');
      return;
    }

    if (password !== confirmPassword) {
      setConfirmError('Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      await authApi.resetPassword(token, password);
      setSuccess(true);
    } catch (err: unknown) {
      const apiError = err as { response?: { data?: { error?: string } } };
      setError(apiError.response?.data?.error || 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="text-center">
        <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-success-light flex items-center justify-center">
          <CheckCircle className="w-6 h-6 text-success" />
        </div>
        <h2 className="text-2xl font-bold text-text">Password reset</h2>
        <p className="mt-1 text-sm text-text-muted mb-6">
          Your password has been reset successfully.
        </p>
        <Link to={ROUTES.LOGIN}>
          <Button className="w-full">Sign In</Button>
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-text">Set new password</h2>
      <p className="mt-1 text-sm text-text-muted mb-6">
        Choose a new password for your account.
      </p>

      {error && (
        <Alert variant="danger" className="mb-4">{error}</Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <PasswordInput
          label="New Password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            if (passwordError) setPasswordError('');
          }}
          onBlur={validatePassword}
          required
          autoComplete="new-password"
          placeholder="••••••••"
          helperText={passwordError ? undefined : 'Must be at least 8 characters'}
          error={passwordError}
          autoFocus
        />

        <PasswordInput
          label="Confirm Password"
          value={confirmPassword}
          onChange={(e) => {
            setConfirmPassword(e.target.value);
            if (confirmError) setConfirmError('');
          }}
          onBlur={validateConfirm}
          required
          autoComplete="new-password"
          placeholder="••••••••"
          error={confirmError}
        />

        <Button type="submit" loading={isLoading} className="w-full">
          Reset Password
        </Button>
      </form>
    </div>
  );
}
