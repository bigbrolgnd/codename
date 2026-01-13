import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { CookieConsent } from './CookieConsent';

// Mock document.cookie
const mockCookies = new Map<string, string>();

Object.defineProperty(document, 'cookie', {
  writable: true,
  value: '',
  get: () => {
    return Array.from(mockCookies.entries())
      .map(([name, value]) => `${encodeURIComponent(name)}=${encodeURIComponent(value)}`)
      .join('; ');
  },
  set: (cookie) => {
    const match = cookie.match(/^([^=]+)=([^;]*)/);
    if (match) {
      const name = decodeURIComponent(match[1]);
      const value = decodeURIComponent(match[2]);

      // Handle Max-Age=-1 for deletion (standard cookie deletion method)
      if (cookie.includes('Max-Age=-1') || cookie.includes('max-age=-1')) {
        mockCookies.delete(name);
        return;
      }

      // Handle expires-based deletion
      const expiresMatch = cookie.match(/expires=([^;]+)/);
      if (expiresMatch) {
        const expiresDate = new Date(expiresMatch[1]);
        // Only set cookie if expiration is in the future
        if (expiresDate > new Date()) {
          mockCookies.set(name, value);
        }
        // If expired, don't set (implicitly deletes)
      } else {
        // No expiration, set the cookie
        mockCookies.set(name, value);
      }
    }
  },
});

// Mock Intl.DateTimeFormat
const mockTimezone = 'America/New_York';

vi.stubGlobal('Intl', {
  ...Intl,
  DateTimeFormat: vi.fn(() => ({
    resolvedOptions: () => ({
      timeZone: mockTimezone,
      locale: 'en-US',
    }),
  })),
});

describe('CookieConsent', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    mockCookies.clear();
  });

  it('renders cookie consent banner when no consent exists', async () => {
    render(<CookieConsent />);

    // Wait for the 1 second delay
    vi.advanceTimersByTime(1000);

    await waitFor(() => {
      expect(screen.getByText('Privacy & Cookies')).toBeInTheDocument();
    });
  });

  it('does not render when consent already exists', () => {
    mockCookies.set('_zn_cookie_consent', 'accept');

    render(<CookieConsent />);

    vi.advanceTimersByTime(1000);

    expect(screen.queryByText('Privacy & Cookies')).not.toBeInTheDocument();
  });

  it('shows "Reject" button', async () => {
    render(<CookieConsent />);

    vi.advanceTimersByTime(1000);

    await waitFor(() => {
      expect(screen.getByText('Reject')).toBeInTheDocument();
    });
  });

  it('shows "Customize" button', async () => {
    render(<CookieConsent />);

    vi.advanceTimersByTime(1000);

    await waitFor(() => {
      expect(screen.getByText('Customize')).toBeInTheDocument();
    });
  });

  it('shows "Accept All" button', async () => {
    render(<CookieConsent />);

    vi.advanceTimersByTime(1000);

    await waitFor(() => {
      expect(screen.getByText('Accept All')).toBeInTheDocument();
    });
  });

  it('calls onAccept when "Accept All" is clicked', async () => {
    const onAccept = vi.fn();

    render(<CookieConsent onAccept={onAccept} />);

    vi.advanceTimersByTime(1000);

    await waitFor(() => {
      const acceptButton = screen.getByText('Accept All');
      acceptButton.click();
    });

    expect(onAccept).toHaveBeenCalled();
    expect(mockCookies.get('_zn_cookie_consent')).toBe('accept');
  });

  it('calls onReject when "Reject" is clicked', async () => {
    const onReject = vi.fn();

    render(<CookieConsent onReject={onReject} />);

    vi.advanceTimersByTime(1000);

    await waitFor(() => {
      const rejectButton = screen.getByText('Reject');
      rejectButton.click();
    });

    expect(onReject).toHaveBeenCalled();
    expect(mockCookies.get('_zn_cookie_consent')).toBe('reject');
  });

  it('calls onCustomize when "Customize" is clicked', async () => {
    const onCustomize = vi.fn();

    render(<CookieConsent onCustomize={onCustomize} />);

    vi.advanceTimersByTime(1000);

    await waitFor(() => {
      const customizeButton = screen.getByText('Customize');
      customizeButton.click();
    });

    expect(onCustomize).toHaveBeenCalled();
  });

  it('hides banner after accepting', async () => {
    render(<CookieConsent />);

    vi.advanceTimersByTime(1000);

    await waitFor(() => {
      expect(screen.getByText('Privacy & Cookies')).toBeInTheDocument();
    });

    const acceptButton = screen.getByText('Accept All');
    acceptButton.click();

    // Wait for animation
    vi.advanceTimersByTime(300);

    await waitFor(() => {
      expect(screen.queryByText('Privacy & Cookies')).not.toBeInTheDocument();
    });
  });

  it('links to privacy policy', async () => {
    render(<CookieConsent />);

    vi.advanceTimersByTime(1000);

    await waitFor(() => {
      const privacyLink = screen.getByText('Privacy Policy');
      expect(privacyLink).toBeInTheDocument();
      expect(privacyLink).toHaveAttribute('href', '/privacy');
    });
  });

  it('links to terms of service', async () => {
    render(<CookieConsent />);

    vi.advanceTimersByTime(1000);

    await waitFor(() => {
      const termsLink = screen.getByText('Terms of Service');
      expect(termsLink).toBeInTheDocument();
      expect(termsLink).toHaveAttribute('href', '/terms');
    });
  });

  it('has correct z-index for overlay', async () => {
    render(<CookieConsent />);

    vi.advanceTimersByTime(1000);

    await waitFor(() => {
      const banner = screen.getByText('Privacy & Cookies').closest('.fixed');
      expect(banner).toHaveClass('z-50');
    });
  });

  it('is positioned at bottom of screen', async () => {
    render(<CookieConsent />);

    vi.advanceTimersByTime(1000);

    await waitFor(() => {
      const banner = screen.getByText('Privacy & Cookies').closest('.fixed');
      expect(banner).toHaveClass('bottom-0');
    });
  });

  it('shows correct messaging', async () => {
    render(<CookieConsent />);

    vi.advanceTimersByTime(1000);

    await waitFor(() => {
      expect(screen.getByText(/We use cookies to improve your experience/)).toBeInTheDocument();
    });
  });

  it('respects existing "reject" consent', () => {
    mockCookies.set('_zn_cookie_consent', 'reject');

    render(<CookieConsent />);

    vi.advanceTimersByTime(1000);

    expect(screen.queryByText('Privacy & Cookies')).not.toBeInTheDocument();
  });

  it('respects existing "custom" consent', () => {
    mockCookies.set('_zn_cookie_consent', 'custom');

    render(<CookieConsent />);

    vi.advanceTimersByTime(1000);

    expect(screen.queryByText('Privacy & Cookies')).not.toBeInTheDocument();
  });
});
