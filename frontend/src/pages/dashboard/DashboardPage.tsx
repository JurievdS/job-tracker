import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { applicationsApi } from '@/api/applications';
import { StatusBadge } from '@/components/common/Badge';
import type { ApplicationStatus } from '@/types/application';

// Order for displaying statuses in breakdown
const STATUS_ORDER: ApplicationStatus[] = [
  'bookmarked',
  'applied',
  'phone_screen',
  'technical',
  'final_round',
  'offer',
  'rejected',
];

export function DashboardPage() {
  const { user } = useAuth();
  const [counts, setCounts] = useState<Partial<Record<ApplicationStatus, number>>>({});
  const [isBreakdownOpen, setIsBreakdownOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        setIsLoading(true);
        const data = await applicationsApi.getCountsByStatus();
        setCounts(data);
      } catch (error) {
        console.error('Error fetching application counts:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCounts();
  }, []);

  // Calculate aggregated stats
  const total = Object.values(counts).reduce((sum, n) => sum + (n || 0), 0);
  const active = (counts.bookmarked || 0) + (counts.applied || 0);
  const interviewing = (counts.phone_screen || 0) + (counts.technical || 0) + (counts.final_round || 0);
  const offers = counts.offer || 0;

  return (
    <div>
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">
          Welcome back, {user?.name || user?.email || 'User'}!
        </p>
      </div>

      {/* Summary stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <StatCard
          title="Total Applications"
          value={isLoading ? '...' : total.toString()}
          color="blue"
        />
        <StatCard
          title="Active"
          value={isLoading ? '...' : active.toString()}
          subtitle="Bookmarked + Applied"
          color="green"
        />
        <StatCard
          title="Interviewing"
          value={isLoading ? '...' : interviewing.toString()}
          subtitle="Phone → Final Round"
          color="purple"
        />
        <StatCard
          title="Offers"
          value={isLoading ? '...' : offers.toString()}
          color="yellow"
        />
      </div>

      {/* Collapsible breakdown */}
      <div className="bg-white rounded-lg shadow mb-8">
        <button
          onClick={() => setIsBreakdownOpen(!isBreakdownOpen)}
          className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
        >
          <span className="text-sm font-medium text-gray-700">
            View breakdown by status
          </span>
          <svg
            className={`w-5 h-5 text-gray-400 transition-transform ${isBreakdownOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {isBreakdownOpen && (
          <div className="px-6 pb-4 border-t border-gray-100">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 pt-4">
              {STATUS_ORDER.map((status) => (
                <div key={status} className="text-center">
                  <div className="text-2xl font-bold text-gray-900 mb-1">
                    {counts[status] || 0}
                  </div>
                  <StatusBadge status={status} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Info card */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Lorem Ipsum
        </h2>
        <p className="text-gray-600 mb-4">
          Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
          Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
        </p>
      </div>
    </div>
  );
}

/**
 * StatCard - Summary stat display component
 */
function StatCard({
  title,
  value,
  subtitle,
  color,
}: {
  title: string;
  value: string;
  subtitle?: string;
  color: 'blue' | 'green' | 'purple' | 'yellow';
}) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-700',
    green: 'bg-green-50 text-green-700',
    purple: 'bg-purple-50 text-purple-700',
    yellow: 'bg-yellow-50 text-yellow-700',
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <p className="text-sm text-gray-500">{title}</p>
      <p className={`text-3xl font-bold mt-1 ${colorClasses[color]}`}>{value}</p>
      {subtitle && (
        <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
      )}
    </div>
  );
}
