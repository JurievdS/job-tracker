/**
 * Route Path Constants
 */
export const ROUTES = {
  // Public routes
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  AUTH_CALLBACK: '/auth/callback', // OAuth callback handler
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',

  // Protected routes
  DASHBOARD: '/dashboard',
  APPLICATIONS: '/applications',
  APPLICATION_DETAIL: '/applications/:id',
  COMPANIES: '/companies',
  COMPANY_DETAIL: '/companies/:id',
  CONTACTS: '/contacts',
  INTERACTIONS: '/interactions',
  REMINDERS: '/reminders',
  SOURCES: '/sources',
  VISA_TYPES: '/visa-types',
  PROFILE: '/profile',
  SETTINGS: '/settings',
} as const;

/**
 * Dynamic Route Builder
 */
export function buildRoute(
  route: string,
  params: Record<string, string | number>
): string {
  let result = route;
  for (const [key, value] of Object.entries(params)) {
    result = result.replace(`:${key}`, String(value));
  }
  return result;
}
