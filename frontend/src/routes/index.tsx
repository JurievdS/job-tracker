import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { PublicRoute } from './PublicRoute';
import { ROUTES } from './routes';

// Layouts
import { MainLayout } from '@/components/layout/MainLayout';
import { AuthLayout } from '@/components/layout/AuthLayout';

// Pages
import { LoginPage } from '@/pages/auth/LoginPage';
import { RegisterPage } from '@/pages/auth/RegisterPage';
import { OAuthCallbackPage } from '@/pages/auth/OAuthCallbackPage';
import { DashboardPage } from '@/pages/dashboard/DashboardPage';
import { ApplicationsPage } from '@/pages/applications/ApplicationsPage';
import { CompaniesPage } from '@/pages/companies/CompaniesPage';
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
