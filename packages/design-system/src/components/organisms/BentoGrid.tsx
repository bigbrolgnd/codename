/**
 * Bento Grid Component
 * Based on: Magic UI Bento Grid
 * Wrapped to consume design system tokens
 */

import { cn } from '../../lib/utils';

export interface BentoGridProps {
  children: React.ReactNode;
  className?: string;
  cols?: number;
}

export function BentoGrid({ children, className, cols = 3 }: BentoGridProps) {
  return (
    <div
      className={cn(
        'grid gap-4',
        cols === 2 && 'md:grid-cols-2',
        cols === 3 && 'md:grid-cols-3',
        cols === 4 && 'md:grid-cols-4',
        className
      )}
    >
      {children}
    </div>
  );
}

export interface BentoItemProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  description?: string;
  span?: number;
}

export function BentoItem({ children, className, span = 1 }: BentoItemProps) {
  return (
    <div
      className={cn(
        // Base styles
        'relative overflow-hidden',
        'backdrop-blur-sm bg-[var(--color-surface)]/50',
        'border border-white/10 rounded-xl',
        'hover:border-[var(--color-accent)]/50 transition-all',
        'hover:shadow-[0_0_30px_var(--color-accent-glow)]',
        // Span sizing
        span === 2 && 'md:col-span-2',
        className
      )}
    >
      {children}
    </div>
  );
}
