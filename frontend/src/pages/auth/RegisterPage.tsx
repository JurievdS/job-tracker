import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { ROUTES } from '@/routes/routes';
import { Input, Button, PasswordInput, Alert } from '@/components/common';
import { OAuthButtons } from './OAuthButtons';

export function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmError, setConfirmError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

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
      await register({ email, password, name: name || undefined });
      navigate(ROUTES.DASHBOARD, { replace: true });
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      setError(error.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-text">Create your account</h2>
      <p className="mt-1 text-sm text-text-muted mb-6">
        Start organizing your job search in seconds
      </p>

      {error && (
        <Alert variant="danger" className="mb-4">{error}</Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Name (optional)"
          type="text"
          value={name}
          onChange={(e) => { setName(e.target.value); if (error) setError(''); }}
          autoComplete="name"
          placeholder="John Doe"
          autoFocus
        />

        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => { setEmail(e.target.value); if (error) setError(''); }}
          required
          autoComplete="email"
          placeholder="you@example.com"
        />

        <PasswordInput
          label="Password"
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
          Create Account
        </Button>
      </form>

      <OAuthButtons />
    </div>
  );
}
