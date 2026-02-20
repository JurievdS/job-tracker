import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { authApi } from '@/api/auth';
import { ROUTES } from '@/routes/routes';
import { Input, Button, Alert } from '@/components/common';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await authApi.forgotPassword(email);
      setSubmitted(true);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (submitted) {
    return (
      <div>
        <h2 className="text-2xl font-bold text-text">Check your email</h2>
        <p className="mt-1 text-sm text-text-muted mb-6">
          We sent a password reset link to <strong className="text-text">{email}</strong>
        </p>

        <Alert variant="info" className="mb-6">
          The link will expire in 1 hour. If you don't see the email, check your spam folder.
        </Alert>

        <Link
          to={ROUTES.LOGIN}
          className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-text">Forgot your password?</h2>
      <p className="mt-1 text-sm text-text-muted mb-6">
        Enter your email and we'll send you a reset link.
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

        <Button type="submit" loading={isLoading} className="w-full">
          Send Reset Link
        </Button>
      </form>

      <div className="mt-4">
        <Link
          to={ROUTES.LOGIN}
          className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to sign in
        </Link>
      </div>
    </div>
  );
}
