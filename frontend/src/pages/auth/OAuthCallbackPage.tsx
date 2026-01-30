import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { tokenStorage } from '@/utils/storage';
import { useAuth } from '@/hooks/useAuth';
import { ROUTES } from '@/routes/routes';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

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
        setError(`Authentication failed: ${errorParam}`);
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
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-md text-center max-w-md">
          <div className="text-red-500 text-5xl mb-4">!</div>
          <p className="text-red-600 mb-4">{error}</p>
          <p className="text-gray-500 text-sm">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  // Loading state
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md text-center">
        <LoadingSpinner />
        <p className="mt-4 text-gray-600">Completing authentication...</p>
      </div>
    </div>
  );
}
