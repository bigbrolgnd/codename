import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { AddonsPage } from './AddonsPage';
import { trpc } from '@/lib/trpc';
import { TenantProvider } from '@/contexts/TenantContext';

// Mock tRPC
vi.mock('@/lib/trpc', () => ({
  trpc: {
    admin: {
      getPricingConfig: {
        useQuery: vi.fn(),
      },
      getTenantAddons: {
        useQuery: vi.fn(),
      },
      getTenantPlan: {
        useQuery: vi.fn(),
      },
      subscribeToAddon: {
        useMutation: vi.fn(() => ({
          mutateAsync: vi.fn(),
        })),
      },
      unsubscribeFromAddon: {
        useMutation: vi.fn(() => ({
          mutateAsync: vi.fn(),
        })),
      },
    },
  },
}));

const mockPricingData = {
  pricing: [
    {
      id: '123e4567-e89b-12d3-a456-426614174000',
      addon_id: 'contact-form',
      name: 'Contact Form',
      category: 'free' as const,
      price_cents: 0,
      billing_interval: null,
      token_multiplier: 5,
      requires_base_plan: true,
      requires_ai_plan: false,
      description: 'Send messages',
      is_active: true,
      created_at: '2026-01-10T00:00:00.000Z',
      updated_at: '2026-01-10T00:00:00.000Z',
    },
    {
      id: '223e4567-e89b-12d3-a456-426614174001',
      addon_id: 'smart-calendar',
      name: 'Smart Calendar',
      category: 'premium' as const,
      price_cents: 1499,
      billing_interval: 'monthly' as const,
      token_multiplier: 5,
      requires_base_plan: true,
      requires_ai_plan: false,
      description: 'Appointments',
      is_active: true,
      created_at: '2026-01-10T00:00:00.000Z',
      updated_at: '2026-01-10T00:00:00.000Z',
    },
  ],
};

const mockTenantPlan = {
  base_plan_type: 'standard' as const,
  billing_interval: 'monthly' as const,
};

describe('AddonsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (trpc.admin.getPricingConfig.useQuery as any).mockReturnValue({
      data: mockPricingData,
      isLoading: false,
    });
    (trpc.admin.getTenantAddons.useQuery as any).mockReturnValue({
      data: { addons: [] },
      isLoading: false,
    });
    (trpc.admin.getTenantPlan.useQuery as any).mockReturnValue({
      data: mockTenantPlan,
      isLoading: false,
    });
  });

  // Helper function to render with TenantProvider
  const renderWithProvider = (component: React.ReactElement) => {
    return render(<TenantProvider>{component}</TenantProvider>);
  };

  it('renders page header and title', async () => {
    renderWithProvider(<AddonsPage />);

    expect(screen.getByText('Add-ons')).toBeInTheDocument();
    expect(screen.getByText('Manage your subscription and add-ons')).toBeInTheDocument();
  });

  it('shows current plan badge', () => {
    renderWithProvider(<AddonsPage />);

    expect(screen.getByText('Standard Plan')).toBeInTheDocument();
  });

  it('shows "AI-Powered Plan" badge for ai_powered users', () => {
    (trpc.admin.getTenantPlan.useQuery as any).mockReturnValue({
      data: { base_plan_type: 'ai_powered', billing_interval: 'monthly' },
      isLoading: false,
    });

    renderWithProvider(<AddonsPage />);

    expect(screen.getByText('AI-Powered Plan')).toBeInTheDocument();
  });

  it('shows loading state while fetching pricing data', () => {
    (trpc.admin.getPricingConfig.useQuery as any).mockReturnValue({
      data: undefined,
      isLoading: true,
    });

    renderWithProvider(<AddonsPage />);

    expect(screen.getByText('Loading add-ons...')).toBeInTheDocument();
  });

  it('displays add-on cards for each category', () => {
    renderWithProvider(<AddonsPage />);

    expect(screen.getByText('Contact Form')).toBeInTheDocument();
    expect(screen.getByText('Smart Calendar')).toBeInTheDocument();
  });

  it('filters add-ons by search query', async () => {
    renderWithProvider(<AddonsPage />);

    const searchInput = screen.getByPlaceholderText('Search add-ons...');
    fireEvent.change(searchInput, { target: { value: 'calendar' } });

    await waitFor(() => {
      expect(screen.getByText('Smart Calendar')).toBeInTheDocument();
      expect(screen.queryByText('Contact Form')).not.toBeInTheDocument();
    });
  });

  it('filters add-ons by category', async () => {
    renderWithProvider(<AddonsPage />);

    const premiumFilter = screen.getByText('premium');
    fireEvent.click(premiumFilter);

    await waitFor(() => {
      expect(screen.getByText('Smart Calendar')).toBeInTheDocument();
      expect(screen.queryByText('Contact Form')).not.toBeInTheDocument();
    });
  });

  it('shows "No add-ons found" when search has no results', async () => {
    renderWithProvider(<AddonsPage />);

    const searchInput = screen.getByPlaceholderText('Search add-ons...');
    fireEvent.change(searchInput, { target: { value: 'nonexistent' } });

    await waitFor(() => {
      expect(screen.getByText('No add-ons found matching your search')).toBeInTheDocument();
    });
  });

  it('displays summary bar with active add-ons count', () => {
    (trpc.admin.getTenantAddons.useQuery as any).mockReturnValue({
      data: {
        addons: [
          {
            id: '123',
            tenant_id: 'tenant_default',
            addon_id: 'smart-calendar',
            stripe_subscription_item_id: null,
            subscribed_at: '2026-01-10T00:00:00.000Z',
            cancelled_at: null,
            is_active: true,
          },
        ],
      },
      isLoading: false,
    });

    renderWithProvider(<AddonsPage />);

    expect(screen.getByText('Active Add-ons')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('calculates monthly total correctly for Standard plan', () => {
    (trpc.admin.getTenantAddons.useQuery as any).mockReturnValue({
      data: {
        addons: [
          {
            id: '123',
            tenant_id: 'tenant_default',
            addon_id: 'smart-calendar',
            stripe_subscription_item_id: null,
            subscribed_at: '2026-01-10T00:00:00.000Z',
            cancelled_at: null,
            is_active: true,
          },
        ],
      },
      isLoading: false,
    });

    renderWithProvider(<AddonsPage />);

    expect(screen.getByText('Monthly Total')).toBeInTheDocument();
    expect(screen.getByText('$14.99/mo')).toBeInTheDocument();
  });

  it('shows "Included" for monthly total when AI-Powered plan', () => {
    (trpc.admin.getTenantPlan.useQuery as any).mockReturnValue({
      data: { base_plan_type: 'ai_powered', billing_interval: 'monthly' },
      isLoading: false,
    });

    renderWithProvider(<AddonsPage />);

    expect(screen.getByText('Monthly Total')).toBeInTheDocument();
    expect(screen.getByText('Included')).toBeInTheDocument();
  });

  it('shows "View Invoices" button', () => {
    renderWithProvider(<AddonsPage />);

    expect(screen.getByText('View Invoices')).toBeInTheDocument();
  });

  it('groups add-ons by category with section headers', () => {
    renderWithProvider(<AddonsPage />);

    expect(screen.getByText('free Add-ons')).toBeInTheDocument();
    expect(screen.getByText('premium Add-ons')).toBeInTheDocument();
  });
});
