import { Outlet, NavLink } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { ROUTES } from '@/routes/routes';

export function MainLayout() {
  const { user, logout } = useAuth();

  const navItems = [
    { path: ROUTES.DASHBOARD, label: 'Dashboard', icon: '📊' },
    { path: ROUTES.APPLICATIONS, label: 'Applications', icon: '📝' },
    { path: ROUTES.COMPANIES, label: 'Companies', icon: '🏢' },
    { path: ROUTES.CONTACTS, label: 'Contacts', icon: '👥' },
    { path: ROUTES.POSITIONS, label: 'Positions', icon: '💼' },
    { path: ROUTES.INTERACTIONS, label: 'Interactions', icon: '💬' },
    { path: ROUTES.REMINDERS, label: 'Reminders', icon: '⏰' },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* ============================================
          HEADER
          ============================================ */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-900">Job Tracker</h1>

          {/* User info and logout */}
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              {user?.email || user?.name || 'User'}
            </span>
            <button
              onClick={logout}
              className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* ============================================
            SIDEBAR NAVIGATION
            ============================================ */}
        <nav className="w-64 bg-white shadow-sm min-h-[calc(100vh-64px)] p-4">
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-2 rounded-md text-sm transition-colors ${
                      isActive
                        ? 'bg-blue-50 text-blue-700 font-medium'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`
                  }
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* ============================================
            MAIN CONTENT AREA
            ============================================ */}
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
