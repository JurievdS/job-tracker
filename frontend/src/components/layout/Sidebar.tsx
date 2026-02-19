import { useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { PanelLeftClose, PanelLeftOpen, LogOut, X } from 'lucide-react';
import { mainNavGroups, accountNavItems } from '@/config/navigation';
import type { NavItem } from '@/config/navigation';
import type { User } from '@/types/auth';
import { ThemeToggle } from '@/components/common/ThemeToggle';

interface SidebarProps {
  isCollapsed: boolean;
  isMobile: boolean;
  isMobileOpen: boolean;
  onToggleCollapsed: () => void;
  onCloseMobile: () => void;
  onLogout: () => void;
  user: User | null;
}

function NavItemLink({
  item,
  collapsed,
  onClick,
}: {
  item: NavItem;
  collapsed: boolean;
  onClick?: () => void;
}) {
  const Icon = item.icon;

  return (
    <li>
      <NavLink
        to={item.path}
        title={collapsed ? item.label : undefined}
        onClick={onClick}
        className={({ isActive }) =>
          `flex items-center gap-3 px-3 py-2 rounded-[var(--radius-md)] text-sm transition-colors ${
            collapsed ? 'justify-center' : ''
          } ${
            isActive
              ? 'bg-primary-light text-primary font-medium'
              : 'text-text-secondary hover:bg-surface-alt'
          }`
        }
      >
        <Icon className="w-5 h-5 flex-shrink-0" />
        {!collapsed && <span>{item.label}</span>}
      </NavLink>
    </li>
  );
}

function SidebarContent({
  collapsed,
  onToggleCollapsed,
  onCloseMobile,
  onLogout,
  user,
  isMobile,
}: {
  collapsed: boolean;
  onToggleCollapsed: () => void;
  onCloseMobile: () => void;
  onLogout: () => void;
  user: User | null;
  isMobile: boolean;
}) {
  return (
    <div className="flex flex-col h-full">
      {/* Branding */}
      {isMobile ? (
        <div className="flex items-center justify-between px-4 py-4 border-b border-border">
          <span className="text-lg font-bold text-text">
            Job Tracker
          </span>
          <button
            onClick={onCloseMobile}
            className="p-1.5 rounded-[var(--radius-md)] text-text-muted hover:bg-surface-alt transition-colors"
            aria-label="Close navigation"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      ) : (
        <div className={`px-4 py-4 border-b border-border ${collapsed ? 'text-center' : ''}`}>
          {collapsed ? (
            <span className="text-sm font-bold text-text">JT</span>
          ) : (
            <span className="text-lg font-bold text-text">Job Tracker</span>
          )}
        </div>
      )}

      {/* Main nav — grouped */}
      <nav className="flex-1 p-3 overflow-y-auto" aria-label="Main navigation">
        <div className="space-y-4">
          {mainNavGroups.map((group, groupIdx) => (
            <div key={group.label}>
              {/* Group separator: label when expanded/mobile, thin divider when collapsed */}
              {groupIdx > 0 && collapsed && !isMobile && (
                <div className="border-t border-border my-2" />
              )}
              {(!collapsed || isMobile) && (
                <h3 className="px-3 mb-1 text-xs font-semibold uppercase tracking-wider text-text-placeholder">
                  {group.label}
                </h3>
              )}
              <ul className="space-y-1">
                {group.items.map((item) => (
                  <NavItemLink
                    key={item.path}
                    item={item}
                    collapsed={collapsed && !isMobile}
                    onClick={isMobile ? onCloseMobile : undefined}
                  />
                ))}
              </ul>
            </div>
          ))}
        </div>
      </nav>

      {/* Bottom section: account nav + theme + collapse + user/logout */}
      <div className="border-t border-border p-3">
        {/* Account nav items */}
        <ul className="space-y-1">
          {accountNavItems.map((item) => (
            <NavItemLink
              key={item.path}
              item={item}
              collapsed={collapsed && !isMobile}
              onClick={isMobile ? onCloseMobile : undefined}
            />
          ))}
        </ul>

        {/* Theme toggle + Collapse toggle */}
        <div className={`flex items-center mt-1 ${collapsed && !isMobile ? 'flex-col gap-1' : 'gap-1'}`}>
          {/* Theme toggle */}
          <div className={collapsed && !isMobile ? '' : 'flex-shrink-0'}>
            <ThemeToggle />
          </div>

          {/* Collapse toggle (desktop only) */}
          {!isMobile && (
            <button
              onClick={onToggleCollapsed}
              className={`flex items-center gap-3 px-3 py-2 rounded-[var(--radius-md)] text-sm text-text-muted hover:bg-surface-alt transition-colors ${
                collapsed ? '' : 'flex-1'
              }`}
              title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {collapsed ? (
                <PanelLeftOpen className="w-5 h-5 flex-shrink-0" />
              ) : (
                <>
                  <PanelLeftClose className="w-5 h-5 flex-shrink-0" />
                  <span>Collapse</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* User info + logout */}
        <div className={`mt-3 pt-3 border-t border-border ${collapsed && !isMobile ? 'flex justify-center' : ''}`}>
          {collapsed && !isMobile ? (
            <div className="flex flex-col items-center gap-2">
              {user?.avatar_url ? (
                <img src={user.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-primary-light flex items-center justify-center">
                  <span className="text-xs font-semibold text-primary">
                    {(user?.name || user?.email || '?')[0].toUpperCase()}
                  </span>
                </div>
              )}
              <button
                onClick={onLogout}
                className="p-2 rounded-[var(--radius-md)] text-danger hover:bg-danger-light transition-colors"
                title="Logout"
                aria-label="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3 px-1">
              <div className="flex-shrink-0">
                {user?.avatar_url ? (
                  <img src={user.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-primary-light flex items-center justify-center">
                    <span className="text-xs font-semibold text-primary">
                      {(user?.name || user?.email || '?')[0].toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text truncate">
                  {user?.name || 'User'}
                </p>
                <p className="text-xs text-text-muted truncate">
                  {user?.email}
                </p>
              </div>
              <button
                onClick={() => {
                  if (isMobile) onCloseMobile();
                  onLogout();
                }}
                className="p-1.5 rounded-[var(--radius-md)] text-danger hover:bg-danger-light transition-colors flex-shrink-0"
                title="Logout"
                aria-label="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function Sidebar({
  isCollapsed,
  isMobile,
  isMobileOpen,
  onToggleCollapsed,
  onCloseMobile,
  onLogout,
  user,
}: SidebarProps) {
  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (isMobile && isMobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobile, isMobileOpen]);

  // Close on Escape
  useEffect(() => {
    if (!isMobile || !isMobileOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCloseMobile();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isMobile, isMobileOpen, onCloseMobile]);

  // Mobile drawer
  if (isMobile) {
    return (
      <>
        {/* Backdrop */}
        <div
          className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ${
            isMobileOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
          onClick={onCloseMobile}
          aria-hidden="true"
        />

        {/* Drawer */}
        <aside
          className={`fixed inset-y-0 left-0 w-64 bg-surface border-r border-border z-50 transform transition-transform duration-300 ease-in-out ${
            isMobileOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
          role="dialog"
          aria-modal="true"
          aria-label="Navigation menu"
        >
          <SidebarContent
            collapsed={false}
            onToggleCollapsed={onToggleCollapsed}
            onCloseMobile={onCloseMobile}
            onLogout={onLogout}
            user={user}
            isMobile={true}
          />
        </aside>
      </>
    );
  }

  // Desktop sidebar
  return (
    <aside
      className={`${
        isCollapsed ? 'w-16' : 'w-64'
      } bg-surface border-r border-border min-h-screen transition-all duration-300 ease-in-out`}
    >
      <SidebarContent
        collapsed={isCollapsed}
        onToggleCollapsed={onToggleCollapsed}
        onCloseMobile={onCloseMobile}
        onLogout={onLogout}
        user={user}
        isMobile={false}
      />
    </aside>
  );
}
