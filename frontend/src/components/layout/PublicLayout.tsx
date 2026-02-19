import { Link, Outlet } from 'react-router-dom';
import { Briefcase } from 'lucide-react';
import { Button, ThemeToggle } from '@/components/common';
import { ROUTES } from '@/routes/routes';

export function PublicLayout() {
  return (
    <div className="min-h-screen bg-surface-alt flex flex-col">
      {/* Skip to content */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-[var(--radius-md)]"
      >
        Skip to content
      </a>

      <nav className="sticky top-0 z-30 bg-[oklch(from_var(--color-surface-alt)_l_c_h_/_0.8)] backdrop-blur-sm border-b border-border/50">
        <div className="w-full px-6 py-3 flex items-center justify-between max-w-5xl mx-auto">
          <Link
            to={ROUTES.HOME}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <div className="w-8 h-8 bg-primary rounded-[var(--radius-lg)] flex items-center justify-center">
              <Briefcase className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-text">
              Job Tracker
            </span>
          </Link>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link to={ROUTES.LOGIN}>
              <Button variant="ghost" size="sm">Sign In</Button>
            </Link>
            <Link to={ROUTES.REGISTER}>
              <Button size="sm">Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      <div id="main-content" className="flex-1 flex flex-col">
        <Outlet />
      </div>
    </div>
  );
}
