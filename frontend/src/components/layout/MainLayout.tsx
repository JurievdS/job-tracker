import { useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useSidebarState } from '@/hooks/useSidebarState';
import { ROUTES } from '@/routes/routes';
import { ErrorBoundary } from '@/components/common';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import { useTheme } from '@/contexts/ThemeContext';
import { Sidebar } from './Sidebar';

export function MainLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { sidebarPosition } = useTheme();

  const {
    isCollapsed,
    isMobileOpen,
    isMobile,
    toggleCollapsed,
    toggleMobile,
    closeMobile,
  } = useSidebarState();

  // Close mobile drawer on route change
  useEffect(() => {
    closeMobile();
  }, [location.pathname, closeMobile]);

  const handleLogout = async () => {
    await logout();
    navigate(ROUTES.LOGIN);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Skip-to-content link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[60] focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-[var(--radius-md)] focus:text-sm focus:font-medium"
      >
        Skip to content
      </a>

      {/* Mobile-only top bar */}
      <header className="lg:hidden bg-surface border-b border-border relative z-30">
        <div className="px-4 py-3 flex items-center justify-between">
          <button
            onClick={toggleMobile}
            className="p-1.5 rounded-[var(--radius-md)] text-text-muted hover:bg-surface-alt transition-colors"
            aria-label="Open navigation"
          >
            <Menu className="w-5 h-5" />
          </button>
          <span className="text-lg font-bold text-text">
            Job Tracker
          </span>
          <ThemeToggle />
        </div>
      </header>

      <div className={`flex ${sidebarPosition === 'right' ? 'flex-row-reverse' : ''}`} inert={isMobile && isMobileOpen ? true : undefined}>
        {/* Desktop sidebar */}
        <div className="hidden lg:block">
          <Sidebar
            isCollapsed={isCollapsed}
            isMobile={false}
            isMobileOpen={false}
            onToggleCollapsed={toggleCollapsed}
            onCloseMobile={closeMobile}
            onLogout={handleLogout}
            user={user}
          />
        </div>

        {/* Main content */}
        <main id="main-content" className="flex-1 min-w-0 p-6">
          <div className="max-w-7xl mx-auto">
            <ErrorBoundary>
              <Outlet />
            </ErrorBoundary>
          </div>
        </main>
      </div>

      {/* Mobile sidebar (rendered outside flex to overlay) */}
      {isMobile && (
        <Sidebar
          isCollapsed={false}
          isMobile={true}
          isMobileOpen={isMobileOpen}
          onToggleCollapsed={toggleCollapsed}
          onCloseMobile={closeMobile}
          onLogout={handleLogout}
          user={user}
        />
      )}
    </div>
  );
}
