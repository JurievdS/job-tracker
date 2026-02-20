import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { ROUTES } from '@/routes/routes';
import { Input, Button, PasswordInput, Alert } from '@/components/common';
import { OAuthButtons } from './OAuthButtons';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from =
    (location.state as { from?: { pathname: string } })?.from?.pathname ||
    ROUTES.DASHBOARD;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login({ email, password });
      navigate(from, { replace: true });
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      setError(error.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-text">Welcome back</h2>
      <p className="mt-1 text-sm text-text-muted mb-6">
        Sign in to continue to your dashboard
      </p>

      {error && (
        <Alert variant="danger" className="mb-4">{error}</Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => { setEmail(e.target.value); if (error) setError(''); }}
          required
          autoComplete="email"
          placeholder="you@example.com"
          autoFocus
        />

        <PasswordInput
          label="Password"
          value={password}
          onChange={(e) => { setPassword(e.target.value); if (error) setError(''); }}
          required
          autoComplete="current-password"
          placeholder="••••••••"
        />

        <div className="flex justify-end">
          <Link to={ROUTES.FORGOT_PASSWORD} className="text-sm text-primary hover:underline">
            Forgot password?
          </Link>
        </div>

        <Button type="submit" loading={isLoading} className="w-full">
          Sign In
        </Button>
      </form>

      <OAuthButtons />
    </div>
  );
}
