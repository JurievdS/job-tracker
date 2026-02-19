import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { PublicRoute } from './PublicRoute';
import { ROUTES } from './routes';

// Layouts
import { MainLayout } from '@/components/layout/MainLayout';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { AuthLayout } from '@/components/layout/AuthLayout';

// Pages
import { LandingPage } from '@/pages/LandingPage';
import { LoginPage, RegisterPage, OAuthCallbackPage, ForgotPasswordPage, ResetPasswordPage } from '@/pages/auth';
import { DashboardPage } from '@/pages/dashboard';
import { ApplicationsPage } from '@/pages/applications';
import { CompaniesPage } from '@/pages/companies';
import { ContactsPage } from '@/pages/contacts';
import { InteractionsPage } from '@/pages/interactions';
import { RemindersPage } from '@/pages/reminders';
import { SourcesPage } from '@/pages/sources';
import { VisaTypesPage } from '@/pages/visaTypes';
import { ProfilePage } from '@/pages/profile';
import { SettingsPage } from '@/pages/settings';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { RouteErrorFallback } from '@/components/common';

/**
 * Router Configuration
 */
const router = createBrowserRouter([
  // ============================================
  // PUBLIC ROUTES - Only accessible when NOT logged in
  // ============================================
  {
    element: <PublicRoute />,
    errorElement: <RouteErrorFallback />,
    children: [
      {
        element: <PublicLayout />,
        children: [
          {
            path: ROUTES.HOME,
            element: <LandingPage />,
          },
        ],
      },
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
          {
            path: ROUTES.FORGOT_PASSWORD,
            element: <ForgotPasswordPage />,
          },
          {
            path: ROUTES.RESET_PASSWORD,
            element: <ResetPasswordPage />,
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
    errorElement: <RouteErrorFallback />,
  },

  // ============================================
  // PROTECTED ROUTES - Requires authentication
  // ============================================
  {
    element: <ProtectedRoute />,
    errorElement: <RouteErrorFallback />,
    children: [
      {
        element: <MainLayout />,
        children: [
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
            path: ROUTES.CONTACTS,
            element: <ContactsPage />,
          },
          {
            path: ROUTES.INTERACTIONS,
            element: <InteractionsPage />,
          },
          {
            path: ROUTES.REMINDERS,
            element: <RemindersPage />,
          },
          {
            path: ROUTES.SOURCES,
            element: <SourcesPage />,
          },
          {
            path: ROUTES.VISA_TYPES,
            element: <VisaTypesPage />,
          },
          {
            path: ROUTES.PROFILE,
            element: <ProfilePage />,
          },
          {
            path: ROUTES.SETTINGS,
            element: <SettingsPage />,
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
