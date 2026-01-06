import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BuyerHeatmap } from './BuyerHeatmap';
import { trpc } from '@/lib/trpc';

// Mock tRPC
vi.mock('@/lib/trpc', () => ({
  trpc: {
    admin: {
      getBuyerHeatmap: {
        useQuery: vi.fn(),
      },
    },
  },
}));

describe('BuyerHeatmap', () => {
  const tenantId = 'tenant_test';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders hotspots ranked by count', () => {
    (trpc.admin.getBuyerHeatmap.useQuery as any).mockReturnValue({
      data: [
        { location: 'Atlanta', count: 50, percentage: 70, type: 'city' },
        { location: 'Decatur', count: 20, percentage: 30, type: 'city' },
      ],
      isLoading: false,
    });

    render(<BuyerHeatmap tenantId={tenantId} />);
    expect(screen.getByText('Atlanta')).toBeInTheDocument();
    expect(screen.getByText('Decatur')).toBeInTheDocument();
    expect(screen.getByText('Primary')).toBeInTheDocument(); // Badge for top item
  });

  it('shows empty state message', () => {
    (trpc.admin.getBuyerHeatmap.useQuery as any).mockReturnValue({
      data: [],
      isLoading: false,
    });

    render(<BuyerHeatmap tenantId={tenantId} />);
    expect(screen.getByText(/Insufficient location data/i)).toBeInTheDocument();
  });
});
