import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { PublicRoute } from './PublicRoute';
import { ROUTES } from './routes';

// Layouts
import { MainLayout } from '@/components/layout/MainLayout';
import { AuthLayout } from '@/components/layout/AuthLayout';

// Pages
import { LoginPage, RegisterPage, OAuthCallbackPage } from '@/pages/auth';
import { DashboardPage } from '@/pages/dashboard';
import { ApplicationsPage } from '@/pages/applications';
import { CompaniesPage } from '@/pages/companies';
import { PositionsPage } from '@/pages/positions';
import { InteractionsPage } from '@/pages/interactions';
import { RemindersPage } from '@/pages/reminders';
import { NotFoundPage } from '@/pages/NotFoundPage';

/**
 * Router Configuration
 */
const router = createBrowserRouter([
  // ============================================
  // PUBLIC ROUTES - Only accessible when NOT logged in
  // ============================================
  {
    element: <PublicRoute />,
    children: [
      {
        element: <AuthLayout />,
        children: [
          {
            path: ROUTES.LOGIN,
            element: <LoginPage />,
          },
          {
            path: ROUTES.REGISTER,
            element: <RegisterPage />,
          },
        ],
      },
    ],
  },

  // ============================================
  // OAUTH CALLBACK - Special case
  // ============================================
  {
    path: ROUTES.AUTH_CALLBACK,
    element: <OAuthCallbackPage />,
  },

  // ============================================
  // PROTECTED ROUTES - Requires authentication
  // ============================================
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <MainLayout />,
        children: [
          // Redirect root to dashboard when authenticated
          {
            path: ROUTES.HOME,
            element: <Navigate to={ROUTES.DASHBOARD} replace />,
          },
          {
            path: ROUTES.DASHBOARD,
            element: <DashboardPage />,
          },
          {
            path: ROUTES.APPLICATIONS,
            element: <ApplicationsPage />,
          },
          {
            path: ROUTES.COMPANIES,
            element: <CompaniesPage />,
          },
          {
            path: ROUTES.POSITIONS,
            element: <PositionsPage />,
          },
          {
            path: ROUTES.INTERACTIONS,
            element: <InteractionsPage />,
          },
          {
            path: ROUTES.REMINDERS,
            element: <RemindersPage />,
          }
        ],
      },
    ],
  },

  // ============================================
  // 404 - Catch all unmatched routes
  // ============================================
  {
    path: '*',
    element: <NotFoundPage />,
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
