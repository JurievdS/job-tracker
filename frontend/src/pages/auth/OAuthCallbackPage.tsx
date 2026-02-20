import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { tokenStorage } from '@/utils/storage';
import { useAuth } from '@/hooks/useAuth';
import { ROUTES } from '@/routes/routes';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

const friendlyErrors: Record<string, string> = {
  access_denied: 'You declined the sign-in request.',
  invalid_grant: 'The sign-in session expired. Please try again.',
};

/**
 * OAuthCallbackPage - Handles OAuth redirect from backend
 */
export function OAuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { refreshAuth } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      // Check for error from OAuth provider
      const errorParam = searchParams.get('error');
      if (errorParam) {
        setError(friendlyErrors[errorParam] || 'Something went wrong during sign-in. Please try again.');
        // Redirect to login after showing error
        setTimeout(() => navigate(ROUTES.LOGIN), 3000);
        return;
      }

      // Extract tokens from URL
      const accessToken = searchParams.get('accessToken');
      const refreshToken = searchParams.get('refreshToken');

      if (!accessToken || !refreshToken) {
        setError('Missing authentication tokens');
        setTimeout(() => navigate(ROUTES.LOGIN), 3000);
        return;
      }

      try {
        // Store tokens in localStorage
        tokenStorage.setTokens(accessToken, refreshToken);

        await refreshAuth();
        navigate(ROUTES.DASHBOARD, { replace: true });
      } catch {
        setError('Failed to complete authentication');
        tokenStorage.clearTokens();
        setTimeout(() => navigate(ROUTES.LOGIN), 3000);
      }
    };

    handleCallback();
  }, [searchParams, navigate, refreshAuth]);

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <div className="bg-surface p-8 rounded-[var(--radius-lg)] shadow-md border border-border text-center max-w-md">
          <div className="text-danger text-5xl mb-4">!</div>
          <p role="alert" className="text-danger mb-4">{error}</p>
          <Link
            to={ROUTES.LOGIN}
            className="inline-block text-sm font-medium text-primary hover:underline mb-3"
          >
            Back to login
          </Link>
          <p className="text-text-muted text-sm">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  // Loading state
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <div className="bg-surface p-8 rounded-[var(--radius-lg)] shadow-md border border-border text-center">
        <LoadingSpinner />
        <p className="mt-4 text-text-secondary">Completing authentication...</p>
      </div>
    </div>
  );
}
