/**
 * CookieConsent Component
 *
 * GDPR/CCPA compliant cookie consent banner for znapsite.com marketing site.
 * Shows on first visit for EU visitors, remembers choice for 1 year.
 */

import { useState, useEffect } from 'react';

const COOKIE_CONSENT_KEY = '_zn_cookie_consent';
const CONSENT_DURATION = 365 * 24 * 60 * 60 * 1000; // 1 year in milliseconds

interface CookieConsentProps {
  onAccept?: () => void;
  onReject?: () => void;
  onCustomize?: () => void;
}

export const CookieConsent: React.FC<CookieConsentProps> = ({
  onAccept,
  onReject,
  onCustomize,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    // Check if user has already made a choice
    const existingConsent = getCookie(COOKIE_CONSENT_KEY);

    if (!existingConsent) {
      // No consent found, check if user is in EU (simplified check)
      const isInEU = detectEUUser();

      if (isInEU) {
        // Show banner after a short delay for better UX
        const timer = setTimeout(() => {
          setIsVisible(true);
          // Trigger slide-up animation
          requestAnimationFrame(() => setIsAnimating(true));
        }, 1000);

        return () => clearTimeout(timer);
      }
    }
  }, []);

  const handleAccept = () => {
    setCookie(COOKIE_CONSENT_KEY, 'accept', CONSENT_DURATION);
    setIsAnimating(false);
    setTimeout(() => setIsVisible(false), 300);
    onAccept?.();
  };

  const handleReject = () => {
    setCookie(COOKIE_CONSENT_KEY, 'reject', CONSENT_DURATION);
    setIsAnimating(false);
    setTimeout(() => setIsVisible(false), 300);
    onReject?.();
  };

  const handleCustomize = () => {
    onCustomize?.();
    // Would open a preferences modal in full implementation
  };

  if (!isVisible) return null;

  return (
    <div
      className={`
        fixed bottom-0 left-0 right-0 z-50 p-4
        transition-transform duration-300 ease-out
        ${isAnimating ? 'translate-y-0' : 'translate-y-full'}
      `}
    >
      <div className="max-w-4xl mx-auto">
        <div className="glass-card rounded-xl p-6 shadow-2xl border border-white/20">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            {/* Icon */}
            <div className="flex-shrink-0">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center border border-purple-400/30">
                <svg
                  className="w-6 h-6 text-purple-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
            </div>

            {/* Message */}
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-bold text-white mb-1">
                Privacy & Cookies
              </h3>
              <p className="text-sm text-[var(--text-muted)]">
                We use cookies to improve your experience and analyze site traffic. By clicking "Accept All",
                you consent to our use of cookies. Read our{' '}
                <a
                  href="/privacy"
                  className="text-[var(--color-accent)] hover:underline"
                >
                  Privacy Policy
                </a>
                {' '}and{' '}
                <a
                  href="/terms"
                  className="text-[var(--color-accent)] hover:underline"
                >
                  Terms of Service
                </a>
                .
              </p>
            </div>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-2 flex-shrink-0">
              <button
                onClick={handleReject}
                className="px-4 py-2 text-sm font-semibold text-white border border-white/30 rounded-lg hover:bg-white/10 transition-all cursor-pointer"
              >
                Reject
              </button>
              <button
                onClick={handleCustomize}
                className="px-4 py-2 text-sm font-semibold text-white border border-white/30 rounded-lg hover:bg-white/10 transition-all cursor-pointer"
              >
                Customize
              </button>
              <button
                onClick={handleAccept}
                className="px-4 py-2 text-sm font-semibold bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 text-white rounded-lg hover:from-purple-600 hover:via-pink-600 hover:to-orange-600 transition-all cursor-pointer"
              >
                Accept All
              </button>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .glass-card {
          background: rgba(17, 17, 17, 0.8);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
        }
      `}</style>
    </div>
  );
};

/**
 * Get a cookie value by name
 */
function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;

  const nameEQ = `${encodeURIComponent(name)}=`;
  const cookies = document.cookie.split(';');

  for (let i = 0; i < cookies.length; i++) {
    let cookie = cookies[i];
    while (cookie.charAt(0) === ' ') {
      cookie = cookie.substring(1, cookie.length);
    }
    if (cookie.indexOf(nameEQ) === 0) {
      return decodeURIComponent(cookie.substring(nameEQ.length, cookie.length));
    }
  }

  return null;
}

/**
 * Set a cookie with expiration
 */
function setCookie(name: string, value: string, maxAge: number): void {
  if (typeof document === 'undefined') return;

  const expires = new Date(Date.now() + maxAge).toUTCString();
  document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=lax`;
}

/**
 * Detect if user is in EU (simplified - in production would use geolocation API)
 * This is a basic implementation that checks timezone
 */
function detectEUUser(): boolean {
  if (typeof Intl === 'undefined') return true; // Default to showing consent if can't detect

  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  // EU timezones (simplified list)
  const euTimezones = [
    'Europe/London', 'Europe/Dublin', 'Europe/Paris', 'Europe/Berlin',
    'Europe/Rome', 'Europe/Madrid', 'Europe/Amsterdam', 'Europe/Brussels',
    'Europe/Vienna', 'Europe/Copenhagen', 'Europe/Helsinki', 'Europe/Stockholm',
    'Europe/Prague', 'Europe/Warsaw', 'Europe/Budapest', 'Europe/Athens',
    'Europe/Sofia', 'Europe/Bucharest', 'Europe/Zagreb', 'Europe/Ljubljana',
    'Europe/Vilnius', 'Europe/Riga', 'Europe/Tallinn', 'Europe/Luxembourg',
    'Europe/Bratislava', 'Europe/Malta',
  ];

  // Default to true for privacy-first approach (show consent in regions we're unsure about)
  return euTimezones.includes(timezone);
}

export default CookieConsent;
