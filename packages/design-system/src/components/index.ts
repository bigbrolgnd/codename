/**
 * Design System - Basic Components
 * Atoms and Molecules that consume design tokens
 */

import { forwardRef, useState, useId } from 'react';
import { cn } from '../../lib/utils';

// =====================================================
// ATOMS
// =====================================================

type ButtonBaseProps = {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
};

type ButtonAsButton = ButtonBaseProps & React.ButtonHTMLAttributes<HTMLButtonElement> & {
  as?: 'button' | never;
  href?: never;
};

type ButtonAsAnchor = ButtonBaseProps & React.AnchorHTMLAttributes<HTMLAnchorElement> & {
  as: 'a';
  href: string;
};

export type ButtonProps = ButtonAsButton | ButtonAsAnchor;

export const Button = forwardRef<HTMLButtonElement | HTMLAnchorElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', children, as = 'button', ...props }, ref
) => {
  const classNames = cn(
    // Base
    'inline-flex items-center justify-center rounded-lg font-semibold',
    'transition-all duration-[var(--anim-duration-fast)]',
    'focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:ring-offset-2',
    // Sizes
    size === 'sm' && 'px-4 py-2 text-sm',
    size === 'md' && 'px-6 py-3 text-base',
    size === 'lg' && 'px-8 py-4 text-lg',
    // Variants
    variant === 'primary' && 'bg-[var(--color-accent)] hover:bg-[var(--color-accent-light)] text-white shadow-[0_0_20px_var(--color-accent-glow)]',
    variant === 'secondary' && 'bg-[var(--color-surface)] border border-[var(--color-accent)]/50 text-[var(--color-accent)] hover:bg-[var(--color-accent)]/10',
    variant === 'ghost' && 'text-[var(--text-interactive)] hover:bg-[var(--color-surface)]',
    className
  );

  if (as === 'a') {
    return (
      <a
        ref={ref as React.Ref<HTMLAnchorElement>}
        className={classNames}
        {...(props as React.AnchorHTMLAttributes<HTMLAnchorElement>)}
      >
        {children}
      </a>
    );
  }

  return (
    <button
      ref={ref as React.Ref<HTMLButtonElement>}
      className={classNames}
      {...(props as React.ButtonHTMLAttributes<HTMLButtonElement>)}
    >
      {children}
    </button>
  );
});
Button.displayName = 'Button';

export interface HeadingProps extends React.HTMLAttributes<HTMLHeadingElement> {
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  children: React.ReactNode;
}

export const Heading = ({ level = 1, className, children, ...props }: HeadingProps) => {
  const Tag = `h${level}` as const;
  const sizeMap = {
    1: 'text-[var(--text-h1-size)]',
    2: 'text-[var(--text-h2-size)]',
    3: 'text-[var(--text-h3-size)]',
    4: 'text-[var(--text-h4-size)]',
    5: 'text-2xl',
    6: 'text-xl',
  };

  return (
    <Tag
      className={cn(
        'font-bold text-[var(--text-headings)]',
        sizeMap[level],
        className
      )}
      {...props}
    >
      {children}
    </Tag>
  );
};

export interface TextProps extends React.HTMLAttributes<HTMLParagraphElement> {
  variant?: 'body' | 'muted' | 'caption';
  children: React.ReactNode;
}

export const Text = forwardRef<HTMLParagraphElement, TextProps>(
  ({ className, variant = 'body', children, ...props }, ref
) => {
  return (
    <p
      ref={ref}
      className={cn(
        variant === 'body' && 'text-[var(--text-body-size)] text-[var(--text-content)]',
        variant === 'muted' && 'text-[var(--text-caption-size)] text-[var(--text-muted)]',
        variant === 'caption' && 'text-xs text-[var(--text-caption)]',
        className
      )}
      {...props}
    >
      {children}
    </p>
  );
});
Text.displayName = 'Text';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref
) => {
  const generatedId = useId();
  const inputId = id || generatedId;

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-[var(--text-content)]">
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        className={cn(
          'px-4 py-3 rounded-lg',
          'bg-[var(--color-surface)] border border-white/20',
          'text-[var(--text-all)] placeholder:text-[var(--text-muted)]',
          'focus:border-[var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/20',
          error && 'border-red-500',
          className
        )}
        {...props}
      />
      {error && <span className="text-sm text-red-500">{error}</span>}
    </div>
  );
});
Input.displayName = 'Input';

// =====================================================
// MOLECULES
// =====================================================

export interface EmailCaptureProps {
  onSubmit?: (email: string) => void;
  placeholder?: string;
  buttonText?: string;
}

export function EmailCapture({ onSubmit, placeholder = 'Enter your email', buttonText = 'Subscribe' }: EmailCaptureProps) {
  const [email, setEmail] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit?.(email);
    setEmail(''); // Clear input after submit
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
      <input
        type="email"
        placeholder={placeholder}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="flex-1 px-4 py-3 rounded-lg bg-[var(--color-surface)] border border-white/20 text-white placeholder:text-[var(--text-muted)] focus:border-[var(--color-accent)] focus:outline-none"
        required
      />
      <Button type="submit" variant="primary">
        {buttonText}
      </Button>
    </form>
  );
}

export interface DualCTAProps {
  primary?: { text: string; href: string };
  secondary?: { text: string; href: string };
}

export function DualCTA({ primary, secondary }: DualCTAProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4">
      {primary && (
        <Button as="a" href={primary.href} variant="primary">
          {primary.text}
        </Button>
      )}
      {secondary && (
        <Button as="a" href={secondary.href} variant="secondary">
          {secondary.text}
        </Button>
      )}
    </div>
  );
}

export interface FeatureCardProps {
  icon?: string;
  title: string;
  description: string;
  className?: string;
}

export function FeatureCard({ icon, title, description, className }: FeatureCardProps) {
  return (
    <div
      className={cn(
        'backdrop-blur-sm bg-[var(--color-surface)]/50',
        'border border-white/10 rounded-xl p-8',
        'hover:border-[var(--color-accent)]/50 transition-all',
        'hover:shadow-[0_0_30px_var(--color-accent-glow)]',
        className
      )}
    >
      {icon && <div className="text-4xl mb-4">{icon}</div>}
      <h3 className="text-xl font-bold text-[var(--text-headings)] mb-2">{title}</h3>
      <p className="text-[var(--text-muted)]">{description}</p>
    </div>
  );
}

// =====================================================
// ACETERNITY WRAPPERS
// =====================================================

// Re-export Aceternity components
export { Spotlight } from './atoms/Spotlight';
export type { SpotlightProps } from './atoms/Spotlight';

export { TextGenerateEffect } from './atoms/TextGenerateEffect';
export type { TextGenerateEffectProps } from './atoms/TextGenerateEffect';

export { ShimmerButton } from './atoms/ShimmerButton';
export type { ShimmerButtonProps } from './atoms/ShimmerButton';

export { InfiniteMovingCards } from './atoms/InfiniteMovingCards';
export type { InfiniteMovingCardsProps, Card } from './atoms/InfiniteMovingCards';

export { BentoGrid, BentoItem } from './organisms/BentoGrid';
export type { BentoGridProps, BentoItemProps } from './organisms/BentoGrid';

// =====================================================
// ORGANISMS
// =====================================================

export interface HeroSplitProps {
  headline: string;
  subheadline?: string;
  ctaPrimary?: { text: string; href: string };
  ctaSecondary?: { text: string; href: string };
}

export function HeroSplit({ headline, subheadline, ctaPrimary, ctaSecondary }: HeroSplitProps) {
  return (
    <section className="py-24 px-4 text-center">
      <h1 className="text-5xl md:text-7xl font-bold text-[var(--text-all)] mb-6 shadow-accent-glow">
        {headline}
      </h1>
      {subheadline && (
        <p className="text-xl md:text-2xl text-[var(--text-muted)] mb-8 max-w-2xl mx-auto">
          {subheadline}
        </p>
      )}
      {(ctaPrimary || ctaSecondary) && <DualCTA primary={ctaPrimary} secondary={ctaSecondary} />}
    </section>
  );
}

export interface FeaturesGridProps {
  features: Array<{ icon?: string; title: string; description: string }>;
  columns?: 2 | 3 | 4;
}

export function FeaturesGrid({ features, columns = 3 }: FeaturesGridProps) {
  return (
    <section className="py-24 px-4">
      <div className={cn('grid gap-8', columns === 2 && 'md:grid-cols-2', columns === 3 && 'md:grid-cols-3', columns === 4 && 'md:grid-cols-4')}>
        {features.map((feature) => (
          <FeatureCard key={feature.title} {...feature} />
        ))}
      </div>
    </section>
  );
}

export interface TrustLogosProps {
  title?: string;
  logos?: Array<{ name: string; url: string }>;
}

export function TrustLogos({ title = 'Built with', logos }: TrustLogosProps) {
  const defaultLogos = [
    { name: 'React', url: '#' },
    { name: 'TypeScript', url: '#' },
    { name: 'Tailwind CSS', url: '#' },
    { name: 'Supabase', url: '#' },
    { name: 'n8n', url: '#' },
  ];

  const displayLogos = logos || defaultLogos;

  return (
    <section className="py-12 px-4 border-y border-white/10">
      <div className="max-w-6xl mx-auto text-center">
        <p className="text-sm text-[var(--text-muted)] mb-6">{title}</p>
        <div className="flex flex-wrap justify-center gap-8 text-[var(--text-muted)] opacity-60">
          {displayLogos.map((logo, index) => (
            <a key={`${logo.name}-${index}`} href={logo.url} className="font-semibold hover:opacity-100 transition-opacity">
              {logo.name}
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

export interface FloatingNavProps {
  logo?: string;
  links?: Array<{ text: string; href: string }>;
  cta?: { text: string; href: string };
}

export function FloatingNav({ logo = 'Znapsite', links, cta }: FloatingNavProps) {
  const defaultLinks = [
    { text: 'Features', href: '#features' },
    { text: 'Pricing', href: '#pricing' },
    { text: 'Templates', href: '#templates' },
  ];

  return (
    <nav className="fixed top-4 left-1/2 -translate-x-1/2 z-50">
      <div className="backdrop-blur-md bg-[var(--color-surface)]/80 border border-[var(--color-accent)]/30 rounded-full px-6 py-3">
        <div className="flex items-center gap-8">
          <span className="text-xl font-bold text-white">{logo}</span>
          <div className="hidden md:flex items-center gap-6 text-sm text-[var(--text-muted)]">
            {(links || defaultLinks).map((link) => (
              <a key={link.href} href={link.href} className="hover:text-[var(--color-accent)] transition-colors">
                {link.text}
              </a>
            ))}
          </div>
          {cta && (
            <Button as="a" href={cta.href} size="sm" className="rounded-full">
              {cta.text}
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
}
