/**
 * ComponentPicker Component Tests
 *
 * Testing pricing display, plan validation, billing intervals, and user interactions.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ComponentPicker } from './ComponentPicker';

const mockPricingData = {
  updatedAt: '2026-01-10T00:00:00.000Z',
  basePlans: {
    free: { price: 0, display: 'FREE', features: ['5,000 visits/month'] },
    standard: { price: 3900, display: '$39', features: ['Unlimited visits'] },
    ai_powered: { price: 7900, display: '$79', features: ['All add-ons included'] },
  },
  components: {
    free: [
      { id: 'contact-form', name: 'Contact Form', description: 'Send messages', icon: '✉️', category: 'free', price: null, defaultEnabled: true },
      { id: 'social-feed', name: 'Social Feed', description: 'Instagram posts', icon: '📸', category: 'free', price: null, defaultEnabled: false },
    ],
    premium: [
      { id: 'smart-calendar', name: 'Smart Calendar', description: 'Appointments', icon: '📅', category: 'premium', price: 1499, priceDisplay: '$14.99/mo', defaultEnabled: true },
      { id: 'review-gallery', name: 'Review Gallery', description: 'Google reviews', icon: '⭐', category: 'premium', price: 699, priceDisplay: '$6.99/mo', defaultEnabled: true },
      { id: 'payment-links', name: 'Payment Links', description: 'Stripe payments', icon: '💳', category: 'premium', price: 799, priceDisplay: '$7.99/mo', defaultEnabled: false },
      { id: 'blog', name: 'Blog', description: 'Articles', icon: '📝', category: 'premium', price: 899, priceDisplay: '$8.99/mo', defaultEnabled: false },
    ],
    ai: [
      { id: 'ai-content-writer', name: 'AI Content Writer', description: 'Generate posts', icon: '🤖', category: 'ai', price: 2500, priceDisplay: '$0.25/article', defaultEnabled: false },
      { id: 'ai-seo-optimizer', name: 'AI SEO Optimizer', description: 'Meta tags', icon: '🔍', category: 'ai', price: 300, priceDisplay: '$0.03/page', defaultEnabled: false },
    ],
    infrastructure: [],
  },
  billingIntervals: {
    monthly: { multiplier: 1, discount: 0 },
    quarterly: { multiplier: 3, discount: 0.1 },
    annual: { multiplier: 12, discount: 0.2 },
  },
};

describe('ComponentPicker', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: async () => mockPricingData,
      } as Response))
    );
  });

  it('loads pricing data on mount', async () => {
    const onContinue = vi.fn();
    render(<ComponentPicker onContinue={onContinue} />);

    await waitFor(() => {
      expect(screen.queryByText('Loading pricing...')).not.toBeInTheDocument();
    });

    expect(screen.getByText('Contact Form')).toBeInTheDocument();
    expect(screen.getByText('Smart Calendar')).toBeInTheDocument();
  });

  it('shows standard plan banner when premium components selected', async () => {
    const onContinue = vi.fn();
    render(<ComponentPicker onContinue={onContinue} />);

    await waitFor(() => {
      expect(screen.getByText(/Requires Standard Plan/)).toBeInTheDocument();
    });
  });

  it('shows Billing Interval selector', async () => {
    const onContinue = vi.fn();
    render(<ComponentPicker onContinue={onContinue} />);

    await waitFor(() => {
      expect(screen.getByText('Billing Interval')).toBeInTheDocument();
    });

    const quarterlyBtn = screen.getByText('quarterly');
    fireEvent.click(quarterlyBtn);

    expect(screen.getByText('Save 10%')).toBeInTheDocument();
  });

  it('calls onSkip when clicking Skip button', async () => {
    const onSkip = vi.fn();
    render(<ComponentPicker onContinue={vi.fn()} onSkip={onSkip} />);

    await waitFor(() => {
      expect(screen.getByText('Skip')).toBeInTheDocument();
    });

    const skipBtn = screen.getByText('Skip');
    fireEvent.click(skipBtn);

    expect(onSkip).toHaveBeenCalled();
  });

  it('shows AI features section', async () => {
    const onContinue = vi.fn();
    render(<ComponentPicker onContinue={onContinue} />);

    await waitFor(() => {
      expect(screen.getByText('AI Features')).toBeInTheDocument();
    });
  });

  it('renders all component sections', async () => {
    const onContinue = vi.fn();
    render(<ComponentPicker onContinue={onContinue} />);

    await waitFor(() => {
      expect(screen.getByText('Free Components')).toBeInTheDocument();
      expect(screen.getByText('Premium Add-ons')).toBeInTheDocument();
    });
  });

  it('displays price summary bar', async () => {
    const onContinue = vi.fn();
    render(<ComponentPicker onContinue={onContinue} />);

    await waitFor(() => {
      expect(screen.getByText('Total Monthly')).toBeInTheDocument();
    });
  });

  it('shows Preview My Site button', async () => {
    const onContinue = vi.fn();
    render(<ComponentPicker onContinue={onContinue} />);

    await waitFor(() => {
      expect(screen.getByText(/Preview My Site/)).toBeInTheDocument();
    });
  });
});
