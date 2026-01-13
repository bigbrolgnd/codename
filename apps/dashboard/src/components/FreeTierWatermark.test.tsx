import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { FreeTierWatermark } from './FreeTierWatermark';

describe('FreeTierWatermark', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders watermark for free tier users', () => {
    render(
      <FreeTierWatermark
        tenantId="tenant_test"
        basePlanType="free"
      />
    );

    const link = screen.getByRole('link', { name: /powered by znapsite\.com/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', 'https://znapsite.com/?ref=watermark_tenant_test');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('does not render for standard plan users', () => {
    const { container } = render(
      <FreeTierWatermark
        tenantId="tenant_test"
        basePlanType="standard"
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('does not render for ai_powered plan users', () => {
    const { container } = render(
      <FreeTierWatermark
        tenantId="tenant_test"
        basePlanType="ai_powered"
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('has initial opacity of 0.8', () => {
    render(
      <FreeTierWatermark
        tenantId="tenant_test"
        basePlanType="free"
      />
    );

    const link = screen.getByRole('link');
    expect(link).toHaveStyle({ opacity: 0.8 });
  });

  it('fades to 0.3 opacity after 3 seconds', async () => {
    render(
      <FreeTierWatermark
        tenantId="tenant_test"
        basePlanType="free"
      />
    );

    const link = screen.getByRole('link');

    // Initially at 0.8
    expect(link).toHaveStyle({ opacity: 0.8 });

    // Fast-forward 3 seconds
    vi.advanceTimersByTime(3000);

    await waitFor(() => {
      expect(link).toHaveStyle({ opacity: 0.3 });
    });
  });

  it('shows tooltip on hover', () => {
    render(
      <FreeTierWatermark
        tenantId="tenant_test"
        basePlanType="free"
      />
    );

    const link = screen.getByRole('link');

    // Tooltip not visible initially
    expect(screen.queryByText('Powered by znapsite.com')).not.toBeInTheDocument();

    // Trigger hover using fireEvent which properly triggers React events
    fireEvent.mouseEnter(link);

    // Tooltip should appear
    expect(screen.getByText('Powered by znapsite.com')).toBeInTheDocument();
  });

  it('increases opacity on hover', () => {
    render(
      <FreeTierWatermark
        tenantId="tenant_test"
        basePlanType="free"
      />
    );

    const link = screen.getByRole('link');

    // Advance to subtle state
    vi.advanceTimersByTime(3000);

    // Trigger hover using fireEvent which properly triggers React events
    fireEvent.mouseEnter(link);

    expect(link).toHaveStyle({ opacity: 0.6 });
  });

  it('applies custom className', () => {
    render(
      <FreeTierWatermark
        tenantId="tenant_test"
        basePlanType="free"
        className="custom-class"
      />
    );

    const link = screen.getByRole('link');
    expect(link).toHaveClass('custom-class');
  });

  it('has correct position and z-index', () => {
    render(
      <FreeTierWatermark
        tenantId="tenant_test"
        basePlanType="free"
      />
    );

    const link = screen.getByRole('link');
    expect(link).toHaveClass('fixed', 'bottom-4', 'right-4', 'z-50');
  });

  it('has responsive sizing classes', () => {
    render(
      <FreeTierWatermark
        tenantId="tenant_test"
        basePlanType="free"
      />
    );

    const link = screen.getByRole('link');
    expect(link).toHaveClass('w-10', 'h-10', 'sm:w-12', 'sm:h-12', 'md:w-[60px]', 'md:h-[60px]');
  });

  it('tracks click event when analytics is available', () => {
    // Mock window analytics
    const mockTrackEvent = vi.fn();
    (window as any)._zn_track_event = mockTrackEvent;

    render(
      <FreeTierWatermark
        tenantId="tenant_test"
        basePlanType="free"
      />
    );

    const link = screen.getByRole('link');
    link.click();

    expect(mockTrackEvent).toHaveBeenCalledWith('watermark_click', {
      tenant_id: 'tenant_test',
    });

    delete (window as any)._zn_track_event;
  });

  it('renders SVG with Z logo', () => {
    render(
      <FreeTierWatermark
        tenantId="tenant_test"
        basePlanType="free"
      />
    );

    const svg = document.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg?.getAttribute('viewBox')).toBe('0 0 60 60');

    const text = svg?.querySelector('text');
    expect(text?.textContent).toBe('Z');
  });

  it('has gradient colors for branding', () => {
    render(
      <FreeTierWatermark
        tenantId="tenant_test"
        basePlanType="free"
      />
    );

    const gradient = document.querySelector('#z-gradient');
    expect(gradient).toBeInTheDocument();

    const stops = gradient?.querySelectorAll('stop');
    expect(stops).toHaveLength(2);
    expect(stops?.[0]).toHaveAttribute('offset', '0%');
    expect(stops?.[0]).toHaveAttribute('stopColor', '#d552b7');
    expect(stops?.[1]).toHaveAttribute('offset', '100%');
    expect(stops?.[1]).toHaveAttribute('stopColor', '#9f4389');
  });
});
