import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DashboardLayout } from './DashboardLayout';
import { trpc } from '@/lib/trpc';

// Mock tRPC
vi.mock('@/lib/trpc', () => ({
  trpc: {
    admin: {
      getActionFeed: {
        useQuery: vi.fn(),
      },
      sendAgentMessage: {
        useMutation: vi.fn(),
      },
      getUsageStatus: {
        useQuery: vi.fn(),
      },
      getSubscriptionStatus: {
        useQuery: vi.fn(),
      },
    },
  },
}));

describe('DashboardLayout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (trpc.admin.getActionFeed.useQuery as any).mockReturnValue({
      data: { items: [], totalCount: 0 },
      isLoading: false,
    });
    (trpc.admin.sendAgentMessage.useMutation as any).mockReturnValue({
      mutateAsync: vi.fn(),
      isLoading: false,
    });
    (trpc.admin.getUsageStatus.useQuery as any).mockReturnValue({
      data: { aiPercentage: 0, visitsTotal: 0, isCapped: false },
      isLoading: false,
    });
    (trpc.admin.getSubscriptionStatus.useQuery as any).mockReturnValue({
      data: { canAccessDesignStudio: true },
      isLoading: false,
    });
  });

  it('renders the sidebar and header', () => {
    render(<DashboardLayout />);
    
    // Header/Sidebar branding
    expect(screen.getAllByText('COMMAND').length).toBeGreaterThan(0);
    expect(screen.getByText('System Armed')).toBeInTheDocument();
    expect(screen.getByText('Revenue')).toBeInTheDocument();
  });

  it('renders overview page by default', () => {
    render(<DashboardLayout />);
    expect(screen.getByText('Welcome back, Boss.')).toBeInTheDocument();
  });

  it('navigates to coming soon pages', () => {
    render(<DashboardLayout />);
    
    // Click Calendar in Sidebar (using button role to be specific)
    const calendarBtn = screen.getByRole('button', { name: /Calendar/i });
    fireEvent.click(calendarBtn);
    
    // Expect heading in ComingSoon component
    expect(screen.getByRole('heading', { name: 'Calendar' })).toBeInTheDocument();
    expect(screen.getByText(/We're polishing this part/)).toBeInTheDocument();
    
    // Click Return to Overview
    fireEvent.click(screen.getByText('Return to Overview'));
    expect(screen.getByText('Welcome back, Boss.')).toBeInTheDocument();
  });
});
