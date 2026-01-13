/**
 * CookieBanner Component
 *
 * A reusable cookie consent banner component with multiple variants.
 * Part of the @znapsite/design-system feedback components.
 */

import { cn } from '../../../utils/cn';

// Variant types
export type CookieBannerVariant = 'default' | 'minimal' | 'explicit';
export type CookieBannerPosition = 'bottom' | 'top' | 'bottom-left' | 'bottom-right';

export interface CookieBannerProps {
  variant?: CookieBannerVariant;
  position?: CookieBannerPosition;
  title?: string;
  message?: string;
  privacyUrl?: string;
  termsUrl?: string;
  onAccept?: () => void;
  onReject?: () => void;
  onCustomize?: () => void;
  className?: string;
}

export const CookieBanner = ({
  variant = 'default',
  position = 'bottom',
  title = 'Privacy & Cookies',
  message = 'We use cookies to improve your experience and analyze site traffic.',
  privacyUrl = '/privacy',
  termsUrl = '/terms',
  onAccept,
  onReject,
  onCustomize,
  className,
}: CookieBannerProps) => {
  const positionClasses = {
    bottom: 'bottom-0 left-0 right-0',
    top: 'top-0 left-0 right-0',
    'bottom-left': 'bottom-4 left-4 max-w-md',
    'bottom-right': 'bottom-4 right-4 max-w-md',
  };

  const variantStyles = {
    default: 'bg-zinc-900/95 border-zinc-700 shadow-2xl',
    minimal: 'bg-white/95 border-zinc-200 shadow-lg text-zinc-900',
    explicit: 'bg-red-950/95 border-red-700 shadow-2xl',
  };

  const buttonStyles = {
    default: {
      accept: 'bg-violet-600 hover:bg-violet-700 text-white',
      reject: 'border-zinc-600 text-zinc-300 hover:bg-zinc-800',
      customize: 'border-zinc-600 text-zinc-300 hover:bg-zinc-800',
    },
    minimal: {
      accept: 'bg-zinc-900 hover:bg-zinc-800 text-white',
      reject: 'border-zinc-300 text-zinc-700 hover:bg-zinc-100',
      customize: 'border-zinc-300 text-zinc-700 hover:bg-zinc-100',
    },
    explicit: {
      accept: 'bg-red-600 hover:bg-red-700 text-white',
      reject: 'border-red-500 text-red-400 hover:bg-red-950',
      customize: 'border-red-500 text-red-400 hover:bg-red-950',
    },
  };

  return (
    <div
      className={cn(
        'fixed z-50 p-4',
        positionClasses[position],
        className
      )}
    >
      <div
        className={cn(
          'rounded-xl border p-6',
          variantStyles[variant],
          variant === 'minimal' ? '' : 'backdrop-blur-md'
        )}
      >
        {/* Icon for explicit variant */}
        {variant === 'explicit' && (
          <div className="flex items-center gap-2 mb-3">
            <svg
              className="w-5 h-5 text-red-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <span className="text-red-400 font-medium text-sm">Cookie Consent Required</span>
          </div>
        )}

        {/* Title */}
        <h3
          className={cn(
            'text-lg font-bold mb-2',
            variant === 'minimal' ? 'text-zinc-900' : 'text-white'
          )}
        >
          {title}
        </h3>

        {/* Message */}
        <p
          className={cn(
            'text-sm mb-4',
            variant === 'minimal' ? 'text-zinc-600' : 'text-zinc-400'
          )}
        >
          {message}{' '}
          <a
            href={privacyUrl}
            className={cn(
              'underline hover:no-underline',
              variant === 'minimal' ? 'text-zinc-900' : 'text-violet-400'
            )}
          >
            Privacy Policy
          </a>
          {' '}and{' '}
          <a
            href={termsUrl}
            className={cn(
              'underline hover:no-underline',
              variant === 'minimal' ? 'text-zinc-900' : 'text-violet-400'
            )}
          >
            Terms
          </a>
          .
        </p>

        {/* Buttons */}
        <div className="flex flex-wrap gap-2">
          {variant === 'explicit' && (
            <button
              onClick={onReject}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium border transition-all',
                buttonStyles[variant].reject
              )}
            >
              Necessary Only
            </button>
          )}

          <button
            onClick={onCustomize}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium border transition-all',
              buttonStyles[variant].customize
            )}
          >
            Customize
          </button>

          <button
            onClick={onAccept}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition-all',
              buttonStyles[variant].accept
            )}
          >
            Accept All
          </button>
        </div>
      </div>
    </div>
  );
};

CookieBanner.displayName = 'CookieBanner';

export default CookieBanner;
