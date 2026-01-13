import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AddonCard } from './AddonCard';
import type { PricingConfig } from '@codename/api';

const mockAddon: PricingConfig = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  addon_id: 'smart-calendar',
  name: 'Smart Calendar',
  category: 'premium',
  price_cents: 1499,
  billing_interval: 'monthly',
  token_multiplier: 5,
  requires_base_plan: true,
  requires_ai_plan: false,
  description: 'Appointment scheduling',
  is_active: true,
  created_at: '2026-01-10T00:00:00.000Z',
  updated_at: '2026-01-10T00:00:00.000Z',
};

describe('AddonCard', () => {
  it('renders add-on name, description, and category badge', () => {
    render(
      <AddonCard
        addon={mockAddon}
        isSubscribed={false}
        userPlan="standard"
      />
    );

    expect(screen.getByText('Smart Calendar')).toBeInTheDocument();
    expect(screen.getByText('Appointment scheduling')).toBeInTheDocument();
    expect(screen.getByText('PREMIUM')).toBeInTheDocument();
  });

  it('shows "Included (FREE)" for AI-Powered plan users', () => {
    render(
      <AddonCard
        addon={mockAddon}
        isSubscribed={false}
        userPlan="ai_powered"
      />
    );

    expect(screen.getByText('Included (FREE)')).toBeInTheDocument();
    expect(screen.getByText('Add to Site')).toBeInTheDocument();
  });

  it('shows price for Standard plan users', () => {
    render(
      <AddonCard
        addon={mockAddon}
        isSubscribed={false}
        userPlan="standard"
      />
    );

    expect(screen.getByText('$14.99/mo')).toBeInTheDocument();
    expect(screen.getByText('Subscribe')).toBeInTheDocument();
  });

  it('shows "Requires Standard Plan" for free plan users on premium add-ons', () => {
    render(
      <AddonCard
        addon={mockAddon}
        isSubscribed={false}
        userPlan="free"
      />
    );

    expect(screen.getByText('Requires Standard Plan')).toBeInTheDocument();
    expect(screen.getByText('Upgrade to Subscribe')).toBeInTheDocument();
  });

  it('shows "Subscribed" badge when subscribed', () => {
    render(
      <AddonCard
        addon={mockAddon}
        isSubscribed={true}
        userPlan="standard"
      />
    );

    expect(screen.getByText('Subscribed')).toBeInTheDocument();
    expect(screen.getByText('Unsubscribe')).toBeInTheDocument();
  });

  it('shows "FREE" for zero-price add-ons', () => {
    const freeAddon = { ...mockAddon, price_cents: 0, category: 'free' as const };
    render(
      <AddonCard
        addon={freeAddon}
        isSubscribed={false}
        userPlan="free"
      />
    );

    expect(screen.getByText('FREE')).toBeInTheDocument();
  });

  it('formats annual billing as monthly equivalent', () => {
    const annualAddon = { ...mockAddon, billing_interval: 'annual' as const, price_cents: 12000 };
    render(
      <AddonCard
        addon={annualAddon}
        isSubscribed={false}
        userPlan="standard"
      />
    );

    expect(screen.getByText('$10.00/mo')).toBeInTheDocument();
    expect(screen.getByText('(billed annually)')).toBeInTheDocument();
  });

  it('formats quarterly billing as monthly equivalent', () => {
    const quarterlyAddon = { ...mockAddon, billing_interval: 'quarterly' as const, price_cents: 3000 };
    render(
      <AddonCard
        addon={quarterlyAddon}
        isSubscribed={false}
        userPlan="standard"
      />
    );

    expect(screen.getByText('$10.00/mo')).toBeInTheDocument();
    expect(screen.getByText('(billed quarterly)')).toBeInTheDocument();
  });

  it('calls onSubscribe when Subscribe button clicked', () => {
    const onSubscribe = vi.fn();
    render(
      <AddonCard
        addon={mockAddon}
        isSubscribed={false}
        userPlan="standard"
        onSubscribe={onSubscribe}
      />
    );

    const subscribeBtn = screen.getByText('Subscribe');
    fireEvent.click(subscribeBtn);

    expect(onSubscribe).toHaveBeenCalledWith('smart-calendar');
  });

  it('calls onUnsubscribe when Unsubscribe button clicked', () => {
    const onUnsubscribe = vi.fn();
    render(
      <AddonCard
        addon={mockAddon}
        isSubscribed={true}
        userPlan="standard"
        onUnsubscribe={onUnsubscribe}
      />
    );

    const unsubscribeBtn = screen.getByText('Unsubscribe');
    fireEvent.click(unsubscribeBtn);

    expect(onUnsubscribe).toHaveBeenCalledWith('smart-calendar');
  });

  it('shows loading spinner when isLoading is true', () => {
    render(
      <AddonCard
        addon={mockAddon}
        isSubscribed={false}
        userPlan="standard"
        onSubscribe={vi.fn()}
        isLoading={true}
      />
    );

    // Check for the loading spinner (Lucide Loader2 icon)
    const loader = document.querySelector('.animate-spin');
    expect(loader).toBeInTheDocument();
  });

  it('hides Unsubscribe button for AI-Powered plan subscribed add-ons', () => {
    render(
      <AddonCard
        addon={mockAddon}
        isSubscribed={true}
        userPlan="ai_powered"
      />
    );

    expect(screen.getByText('Subscribed')).toBeInTheDocument();
    expect(screen.queryByText('Unsubscribe')).not.toBeInTheDocument();
  });

  it('disables Subscribe button during loading', () => {
    render(
      <AddonCard
        addon={mockAddon}
        isSubscribed={false}
        userPlan="standard"
        onSubscribe={vi.fn()}
        isLoading={true}
      />
    );

    const subscribeBtn = screen.getByRole('button');
    expect(subscribeBtn).toBeDisabled();
  });

  it('shows correct category colors for each category', () => {
    const { rerender } = render(
      <AddonCard
        addon={{ ...mockAddon, category: 'free' as const }}
        isSubscribed={false}
        userPlan="free"
      />
    );
    expect(screen.getByText('FREE')).toBeInTheDocument();

    rerender(
      <AddonCard
        addon={{ ...mockAddon, category: 'ai' as const }}
        isSubscribed={false}
        userPlan="free"
      />
    );
    expect(screen.getByText('AI')).toBeInTheDocument();

    rerender(
      <AddonCard
        addon={{ ...mockAddon, category: 'infrastructure' as const }}
        isSubscribed={false}
        userPlan="free"
      />
    );
    expect(screen.getByText('INFRASTRUCTURE')).toBeInTheDocument();
  });
});
