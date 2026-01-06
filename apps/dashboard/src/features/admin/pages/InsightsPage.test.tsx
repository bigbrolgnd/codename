import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { InsightsPage } from './InsightsPage';
import { trpc } from '@/lib/trpc';

// Mock tRPC
vi.mock('@/lib/trpc', () => ({
  trpc: {
    admin: {
      getPlainEnglishSummary: {
        useQuery: vi.fn(),
      },
      getBuyerHeatmap: {
        useQuery: vi.fn(),
      },
    },
  },
}));

describe('InsightsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (trpc.admin.getPlainEnglishSummary.useQuery as any).mockReturnValue({
      data: [
        { message: "You're popular!", trend: 'positive' },
        { message: "Conversion is steady", trend: 'neutral' }
      ],
      isLoading: false,
    });
    (trpc.admin.getBuyerHeatmap.useQuery as any).mockReturnValue({
      data: [
        { location: 'Atlanta', count: 50, percentage: 70, type: 'city' },
      ],
      isLoading: false,
    });
  });

  it('renders insights summaries', () => {
    render(<InsightsPage />);
    
    expect(screen.getByText('Plain English Insights')).toBeInTheDocument();
    expect(screen.getByText(/You're popular!/)).toBeInTheDocument();
    expect(screen.getByText(/Conversion is steady/)).toBeInTheDocument();
  });

  it('renders pixel verification status', () => {
    render(<InsightsPage />);
    expect(screen.getByText('Pixel Verification')).toBeInTheDocument();
    expect(screen.getByText('Google Tag')).toBeInTheDocument();
    expect(screen.getByText('Meta Pixel')).toBeInTheDocument();
  });
});
