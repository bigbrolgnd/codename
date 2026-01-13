import { render, screen } from '@testing-library/react';
import { AnalyticsDashboard } from './AnalyticsDashboard';
import { describe, it, expect, vi } from 'vitest';
import React from 'react';

// Mock TRPC
vi.mock('@/lib/trpc', () => ({
  trpc: {
    analytics: {
      getGrowthMetrics: { useQuery: vi.fn().mockReturnValue({ data: {}, isLoading: false }) },
      getViralMetrics: { useQuery: vi.fn().mockReturnValue({ data: {}, isLoading: false }) },
      getFunnelMetrics: { useQuery: vi.fn().mockReturnValue({ data: {}, isLoading: false }) },
      getFinancialMetrics: { useQuery: vi.fn().mockReturnValue({ data: {}, isLoading: false }) },
    }
  }
}));

// Mock components
vi.mock('@/components/ui/tabs', () => ({
  Tabs: ({ children, defaultValue }: any) => <div data-testid="tabs">{children}</div>,
  TabsList: ({ children }: any) => <div>{children}</div>,
  TabsTrigger: ({ children, value }: any) => <button>{children}</button>,
  TabsContent: ({ children, value }: any) => <div>{children}</div>,
}));

describe('AnalyticsDashboard', () => {
  it('renders all four tabs', () => {
    render(<AnalyticsDashboard />);
    expect(screen.getByText('Growth')).toBeInTheDocument();
    expect(screen.getByText('Viral')).toBeInTheDocument();
    expect(screen.getByText('Funnel')).toBeInTheDocument();
    expect(screen.getByText('Financial')).toBeInTheDocument();
  });

  it('shows growth metrics by default', () => {
    render(<AnalyticsDashboard />);
    expect(screen.getByText('Growth Metrics')).toBeInTheDocument();
  });
});
