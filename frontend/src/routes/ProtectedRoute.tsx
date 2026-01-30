import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { ROUTES } from './routes';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

/**
 * ProtectedRoute - Authentication guard for protected routes
 */
export function ProtectedRoute() {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  // Render spinner while auth
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  // Redirect to login
  if (!user) {
    // Store url for post login redirect
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
  }

  // Render child routes
  return <Outlet />;
}
