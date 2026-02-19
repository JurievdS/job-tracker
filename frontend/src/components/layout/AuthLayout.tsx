import { Link, Outlet, useLocation } from 'react-router-dom';
import { Briefcase } from 'lucide-react';
import { ErrorBoundary, ThemeToggle } from '@/components/common';
import { ROUTES } from '@/routes/routes';

export function AuthLayout() {
  const { pathname } = useLocation();
  const isLogin = pathname === ROUTES.LOGIN;

  return (
    <div
      className="min-h-screen bg-surface-alt flex flex-col"
      style={{
        backgroundImage:
          'radial-gradient(ellipse at 20% 50%, oklch(from var(--color-primary) l c h / 0.12), transparent 50%), radial-gradient(ellipse at 80% 20%, oklch(from var(--color-primary) l c h / 0.09), transparent 50%)',
      }}
    >
      {/* Skip to content */}
      <a
        href="#auth-form"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-[var(--radius-md)]"
      >
        Skip to form
      </a>

      {/* Nav bar */}
      <nav className="px-6 py-3 flex items-center justify-between max-w-5xl mx-auto w-full">
        <Link
          to={ROUTES.HOME}
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          <div className="w-8 h-8 bg-primary rounded-[var(--radius-lg)] flex items-center justify-center">
            <Briefcase className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold text-text">
            Job Tracker
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <div className="inline-flex rounded-full bg-border/70 p-1">
            <Link
              to={ROUTES.LOGIN}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-colors ${
                isLogin
                  ? 'bg-surface text-text shadow-sm'
                  : 'text-text-muted hover:text-text'
              }`}
            >
              Sign In
            </Link>
            <Link
              to={ROUTES.REGISTER}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-colors ${
                !isLogin
                  ? 'bg-surface text-text shadow-sm'
                  : 'text-text-muted hover:text-text'
              }`}
            >
              Sign Up
            </Link>
          </div>
        </div>
      </nav>

      {/* Centered form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-8">
        <div id="auth-form" className="w-full max-w-md">
          <div className="bg-surface rounded-[var(--radius-lg)] shadow-md border border-border p-8">
            <ErrorBoundary>
              <Outlet />
            </ErrorBoundary>
          </div>
        </div>
      </div>
    </div>
  );
}
