import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { ROUTES } from './routes';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

/**
 * PublicRoute - Guard for public routes
 */
export function PublicRoute() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <LoadingSpinner />
      </div>
    );
  }

  // Redirect to dashboard if authenticated
  if (user) {
    return <Navigate to={ROUTES.DASHBOARD} replace />;
  }

  // Show public content when not authenticated
  return <Outlet />;
}
