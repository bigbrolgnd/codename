import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ActionFeed } from './ActionFeed';
import { trpc } from '@/lib/trpc';

// Mock tRPC
vi.mock('@/lib/trpc', () => ({
  trpc: {
    admin: {
      getActionFeed: {
        useQuery: vi.fn(),
      },
    },
  },
}));

describe('ActionFeed', () => {
  const tenantId = 'tenant_test';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state', () => {
    (trpc.admin.getActionFeed.useQuery as any).mockReturnValue({
      isLoading: true,
    });

    render(<ActionFeed tenantId={tenantId} />);
    expect(screen.getByText(/Scanning Feed/i)).toBeInTheDocument();
  });

  it('renders empty state when no items exist', () => {
    (trpc.admin.getActionFeed.useQuery as any).mockReturnValue({
      data: { items: [], totalCount: 0 },
      isLoading: false,
    });

    render(<ActionFeed tenantId={tenantId} />);
    expect(screen.getByText('All caught up.')).toBeInTheDocument();
  });

  it('renders action items when data is available', () => {
    (trpc.admin.getActionFeed.useQuery as any).mockReturnValue({
      data: {
        items: [
          {
            id: '1',
            type: 'booking',
            title: 'New Booking',
            description: 'John Doe booked Haircut',
            timestamp: new Date().toISOString(),
            priority: 'high',
            isRead: false,
          }
        ],
        totalCount: 1,
      },
      isLoading: false,
    });

    render(<ActionFeed tenantId={tenantId} />);
    expect(screen.getByText('New Booking')).toBeInTheDocument();
    expect(screen.getByText('John Doe booked Haircut')).toBeInTheDocument();
  });
});
