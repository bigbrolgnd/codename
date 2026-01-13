import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CookieBanner } from './CookieBanner';

describe('CookieBanner', () => {
  it('renders with default variant', () => {
    render(<CookieBanner />);

    expect(screen.getByText('Privacy & Cookies')).toBeInTheDocument();
    expect(screen.getByText(/We use cookies to improve your experience/)).toBeInTheDocument();
  });

  it('renders with minimal variant', () => {
    render(<CookieBanner variant="minimal" />);

    expect(screen.getByText('Privacy & Cookies')).toBeInTheDocument();
    expect(screen.getByText('Privacy & Cookies').closest('div')).toHaveClass('text-zinc-900');
  });

  it('renders with explicit variant', () => {
    render(<CookieBanner variant="explicit" />);

    expect(screen.getByText('Cookie Consent Required')).toBeInTheDocument();
  });

  it('renders custom title and message', () => {
    render(
      <CookieBanner
        title="Custom Title"
        message="Custom message for testing."
      />
    );

    expect(screen.getByText('Custom Title')).toBeInTheDocument();
    expect(screen.getByText('Custom message for testing.')).toBeInTheDocument();
  });

  it('renders custom privacy and terms URLs', () => {
    render(
      <CookieBanner
        privacyUrl="/custom-privacy"
        termsUrl="/custom-terms"
      />
    );

    const privacyLink = screen.getByText('Privacy Policy');
    const termsLink = screen.getByText('Terms');

    expect(privacyLink).toHaveAttribute('href', '/custom-privacy');
    expect(termsLink).toHaveAttribute('href', '/custom-terms');
  });

  it('calls onAccept when Accept All is clicked', () => {
    const onAccept = vi.fn();

    render(<CookieBanner onAccept={onAccept} />);

    screen.getByText('Accept All').click();
    expect(onAccept).toHaveBeenCalled();
  });

  it('calls onReject when Reject/Necessary Only is clicked', () => {
    const onReject = vi.fn();

    render(<CookieBanner variant="explicit" onReject={onReject} />);

    screen.getByText('Necessary Only').click();
    expect(onReject).toHaveBeenCalled();
  });

  it('calls onCustomize when Customize is clicked', () => {
    const onCustomize = vi.fn();

    render(<CookieBanner onCustomize={onCustomize} />);

    screen.getByText('Customize').click();
    expect(onCustomize).toHaveBeenCalled();
  });

  it('applies custom className', () => {
    const { container } = render(
      <CookieBanner className="custom-class-name" />
    );

    expect(container.firstChild).toHaveClass('custom-class-name');
  });

  it('positions at bottom by default', () => {
    const { container } = render(<CookieBanner />);

    expect(container.firstChild).toHaveClass('bottom-0');
  });

  it('positions at top when specified', () => {
    const { container } = render(<CookieBanner position="top" />);

    expect(container.firstChild).toHaveClass('top-0');
  });

  it('positions at bottom-left when specified', () => {
    const { container } = render(<CookieBanner position="bottom-left" />);

    expect(container.firstChild).toHaveClass('bottom-4', 'left-4');
  });

  it('positions at bottom-right when specified', () => {
    const { container } = render(<CookieBanner position="bottom-right" />);

    expect(container.firstChild).toHaveClass('bottom-4', 'right-4');
  });

  it('has correct z-index for overlay', () => {
    const { container } = render(<CookieBanner />);

    expect(container.firstChild).toHaveClass('z-50');
  });

  it('shows reject button only in explicit variant', () => {
    const { container: defaultContainer } = render(<CookieBanner variant="default" />);
    const { container: explicitContainer } = render(<CookieBanner variant="explicit" onReject={vi.fn()} />);

    expect(defaultContainer.querySelector('button')).not.toHaveTextContent('Necessary Only');
    expect(explicitContainer.querySelector('button')).toHaveTextContent('Necessary Only');
  });
});
