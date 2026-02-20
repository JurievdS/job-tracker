import { Link } from 'react-router-dom';
import { ROUTES } from '@/routes/routes';

/**
 * NotFoundPage - 404 error page
 */
export function NotFoundPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="text-center">
        <h1 className="text-9xl font-bold text-text-placeholder">404</h1>
        <h2 className="text-2xl font-bold text-text mt-4">Page Not Found</h2>
        <p className="text-text-secondary mt-2 mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link
          to={ROUTES.HOME}
          className="inline-block px-6 py-3 bg-primary text-primary-foreground font-medium rounded-[var(--radius-md)] hover:bg-primary-hover transition-colors"
        >
          Go Home
        </Link>
      </div>
    </div>
  );
}
