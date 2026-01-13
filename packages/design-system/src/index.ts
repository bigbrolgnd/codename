/**
 * Znapsite Design System
 *
 * Atomic design components that consume design tokens
 * Based on: docs/product-discovery/component-library-spec.md
 *
 * Token cascade system:
 * - text-all → text-headings → text-h1/h2/h3 (inheritance)
 * - color-bg → color-surface → color-accent (hierarchy)
 * - anim-duration-fast → anim-duration-normal → anim-duration-slow
 */

// =====================================================
// TOKENS (import to load in app)
// =====================================================
export './tokens/colors.css';
export './tokens/typography.css';
export './tokens/animation.css';

// =====================================================
// UTILITIES
// =====================================================
export { cn } from './lib/utils';

// =====================================================
// ATOMS (Basic UI elements)
// =====================================================
export { Button } from './components';
export { Heading } from './components';
export { Text } from './components';
export { Input } from './components';

// Aceternity Wrappers - Atoms
export { Spotlight } from './components';
export { TextGenerateEffect } from './components';
export { ShimmerButton } from './components';
export { InfiniteMovingCards } from './components';

// =====================================================
// MOLECULES (Combinations of atoms)
// =====================================================
export { EmailCapture } from './components';
export { DualCTA } from './components';
export { FeatureCard } from './components';

// =====================================================
// ORGANISMS (Complex UI sections)
// =====================================================
export { HeroSplit } from './components';
export { FeaturesGrid } from './components';
export { TrustLogos } from './components';
export { FloatingNav } from './components';

// Aceternity Wrappers - Organisms
export { BentoGrid, BentoItem } from './components';

// =====================================================
// TYPES
// =====================================================
export type { ButtonProps } from './components';
export type { HeadingProps } from './components';
export type { TextProps } from './components';
export type { InputProps } from './components';
export type { EmailCaptureProps } from './components';
export type { DualCTAProps } from './components';
export type { FeatureCardProps } from './components';
export type { HeroSplitProps } from './components';
export type { FeaturesGridProps } from './components';
export type { TrustLogosProps } from './components';
export type { FloatingNavProps } from './components';
export type { SpotlightProps } from './components';
export type { TextGenerateEffectProps } from './components';
export type { ShimmerButtonProps } from './components';
export type { InfiniteMovingCardsProps, Card } from './components';
export type { BentoGridProps, BentoItemProps } from './components';
