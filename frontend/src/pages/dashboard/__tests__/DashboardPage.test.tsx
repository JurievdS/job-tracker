import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@/test/test-utils';
import { DashboardPage } from '../DashboardPage';

// ── Mocks ────────────────────────────────────────────────
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 1, name: 'Test User', email: 'test@example.com' },
    isAuthenticated: true,
    isLoading: false,
  }),
}));

const mockAddToast = vi.fn();
vi.mock('@/contexts/ToastContext', () => ({
  useToast: () => ({ addToast: mockAddToast }),
}));

const mockGetCountsByStatus = vi.fn();
const mockList = vi.fn();
const mockGetSourceMetrics = vi.fn();
vi.mock('@/api/applications', () => ({
  applicationsApi: {
    getCountsByStatus: (...args: unknown[]) => mockGetCountsByStatus(...args),
    list: (...args: unknown[]) => mockList(...args),
    getSourceMetrics: (...args: unknown[]) => mockGetSourceMetrics(...args),
  },
}));

const mockRemindersList = vi.fn();
vi.mock('@/api/reminders', () => ({
  remindersApi: {
    list: (...args: unknown[]) => mockRemindersList(...args),
    markComplete: vi.fn(),
  },
}));

const mockInteractionsList = vi.fn();
vi.mock('@/api/interactions', () => ({
  interactionsApi: {
    list: (...args: unknown[]) => mockInteractionsList(...args),
  },
}));

// Helper: resolve all API calls with empty/zero data (empty state)
function mockEmptyData() {
  mockGetCountsByStatus.mockResolvedValue({});
  mockList.mockResolvedValue([]);
  mockRemindersList.mockResolvedValue([]);
  mockInteractionsList.mockResolvedValue([]);
  mockGetSourceMetrics.mockResolvedValue([]);
}

// Helper: resolve all API calls with sample data
function mockPopulatedData() {
  mockGetCountsByStatus.mockResolvedValue({
    bookmarked: 3,
    applied: 5,
    phone_screen: 2,
    technical: 1,
    offer: 1,
  });
  mockList.mockResolvedValue([
    {
      id: 1,
      job_title: 'Engineer',
      company_name: 'Acme',
      status: 'applied',
      date_applied: '2025-01-15',
      created_at: '2025-01-15T00:00:00Z',
    },
    {
      id: 2,
      job_title: 'Designer',
      company_name: 'Beta',
      status: 'bookmarked',
      date_applied: null,
      created_at: '2025-01-14T00:00:00Z',
    },
  ]);
  mockRemindersList.mockResolvedValue([]);
  mockInteractionsList.mockResolvedValue([]);
  mockGetSourceMetrics.mockResolvedValue([]);
}

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading skeleton while fetching', () => {
    // Never resolve — stays in loading state
    mockGetCountsByStatus.mockReturnValue(new Promise(() => {}));
    mockList.mockReturnValue(new Promise(() => {}));
    mockRemindersList.mockReturnValue(new Promise(() => {}));
    mockInteractionsList.mockReturnValue(new Promise(() => {}));
    mockGetSourceMetrics.mockReturnValue(new Promise(() => {}));

    render(<DashboardPage />, { initialEntries: ['/dashboard'] });

    // Loading skeleton renders the Dashboard title and animate-pulse elements
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    const pulseElements = document.querySelectorAll('.animate-pulse');
    expect(pulseElements.length).toBeGreaterThan(0);
  });

  it('shows empty state with "Add Application" when total=0', async () => {
    mockEmptyData();

    render(<DashboardPage />, { initialEntries: ['/dashboard'] });

    await waitFor(() => {
      expect(screen.getByText(/no applications yet/i)).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: /add application/i })).toBeInTheDocument();
  });

  it('shows error state with retry button on fetch failure', async () => {
    mockGetCountsByStatus.mockRejectedValue(new Error('Network error'));
    mockList.mockRejectedValue(new Error('Network error'));
    mockRemindersList.mockRejectedValue(new Error('Network error'));
    mockInteractionsList.mockRejectedValue(new Error('Network error'));
    mockGetSourceMetrics.mockRejectedValue(new Error('Network error'));

    render(<DashboardPage />, { initialEntries: ['/dashboard'] });

    await waitFor(() => {
      expect(screen.getByText(/unable to load dashboard/i)).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
  });

  it('calls addToast on fetch failure', async () => {
    mockGetCountsByStatus.mockRejectedValue(new Error('fail'));
    mockList.mockRejectedValue(new Error('fail'));
    mockRemindersList.mockRejectedValue(new Error('fail'));
    mockInteractionsList.mockRejectedValue(new Error('fail'));
    mockGetSourceMetrics.mockRejectedValue(new Error('fail'));

    render(<DashboardPage />, { initialEntries: ['/dashboard'] });

    await waitFor(() => {
      expect(mockAddToast).toHaveBeenCalledWith(
        'Failed to load dashboard data',
        'error'
      );
    });
  });

  it('displays stat cards with correct computed values', async () => {
    mockPopulatedData();

    render(<DashboardPage />, { initialEntries: ['/dashboard'] });

    await waitFor(() => {
      // Total = 3+5+2+1+1 = 12
      expect(screen.getByText('Total Applications')).toBeInTheDocument();
    });

    // Verify stat card values by their associated labels
    const statCards = document.querySelectorAll('.grid.grid-cols-2 > div');
    const statTexts = Array.from(statCards).map((card) => {
      const label = card.querySelector('p:first-child')?.textContent;
      const value = card.querySelector('p:nth-child(2)')?.textContent;
      return { label, value };
    });

    expect(statTexts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: 'Total Applications', value: '12' }),
        expect.objectContaining({ label: 'Active', value: '8' }),
        expect.objectContaining({ label: 'Interviewing', value: '3' }),
        expect.objectContaining({ label: 'Offers', value: '1' }),
      ])
    );
  });

  it('displays recent applications sorted by created_at desc', async () => {
    mockPopulatedData();

    render(<DashboardPage />, { initialEntries: ['/dashboard'] });

    await waitFor(() => {
      expect(screen.getByText('Engineer')).toBeInTheDocument();
    });

    const engineer = screen.getByText('Engineer');
    const designer = screen.getByText('Designer');
    // Engineer (2025-01-15) should appear before Designer (2025-01-14) in DOM
    expect(engineer.compareDocumentPosition(designer) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('retry button re-fetches data', async () => {
    // First call fails
    mockGetCountsByStatus.mockRejectedValueOnce(new Error('fail'));
    mockList.mockRejectedValueOnce(new Error('fail'));
    mockRemindersList.mockRejectedValueOnce(new Error('fail'));
    mockInteractionsList.mockRejectedValueOnce(new Error('fail'));
    mockGetSourceMetrics.mockRejectedValueOnce(new Error('fail'));

    const { getByRole } = render(<DashboardPage />, { initialEntries: ['/dashboard'] });

    await waitFor(() => {
      expect(screen.getByText(/unable to load dashboard/i)).toBeInTheDocument();
    });

    // Setup success for retry
    mockEmptyData();

    const retryBtn = getByRole('button', { name: /retry/i });
    retryBtn.click();

    await waitFor(() => {
      // After retry with empty data, should show empty state
      expect(screen.getByText(/no applications yet/i)).toBeInTheDocument();
    });
  });
});
