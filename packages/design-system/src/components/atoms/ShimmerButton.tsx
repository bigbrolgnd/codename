/**
 * Shimmer Button Component
 * Based on: Magic UI Shimmer Button
 * Wrapped to consume design system tokens
 */

import { forwardRef } from 'react';
import { cn } from '../../lib/utils';

export interface ShimmerButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  shimmerColor?: string;
  shimmerSize?: string;
  background?: 'accent' | 'surface';
  children: React.ReactNode;
}

export const ShimmerButton = forwardRef<HTMLButtonElement, ShimmerButtonProps>(
  ({ className, shimmerColor = 'var(--color-accent-light)', shimmerSize = '1px', background = 'accent', children, ...props },
  ref
) => {
    return (
      <button
        ref={ref}
        className={cn(
          // Base styles
          'inline-flex items-center justify-center px-8 py-4 rounded-lg font-semibold',
          'relative overflow-hidden transition-all duration-300',
          'hover:scale-105 active:scale-[0.98]',
          // Focus styles
          'focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:ring-offset-2 focus:ring-offset-[var(--color-bg)]',
          // Background
          background === 'accent'
            ? 'bg-[var(--color-accent)] hover:bg-[var(--color-accent-light)] text-white'
            : 'bg-[var(--color-surface)] border border-[var(--color-accent)]/50 text-[var(--color-accent)] hover:bg-[var(--color-accent)]/10',
          className
        )}
        style={{
          // Shimmer effect using animation
          '--shimmer-color': shimmerColor,
          '--shimmer-size': shimmerSize,
        }}
        {...props}
      >
        {/* Shimmer overlay */}
        <span
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `linear-gradient(
              90deg,
              transparent 0%,
              var(--shimmer-color) 50%,
              transparent 100%
            )`,
            backgroundSize: '200% 100%',
            animation: 'shimmer 2s infinite',
          }}
        />
        <span className="relative z-10">{children}</span>
      </button>
    );
  }
);

ShimmerButton.displayName = 'ShimmerButton';
