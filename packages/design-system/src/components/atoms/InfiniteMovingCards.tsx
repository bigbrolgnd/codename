/**
 * Infinite Moving Cards Component
 * Based on: Aceternity Infinite Moving Cards
 * Wrapped to consume design system tokens
 */

import { cn } from '../../lib/utils';

// Card dimensions based on w-80 class (20rem = 320px) + gap (1.5rem = 24px)
const CARD_WIDTH = 320; // 20rem in pixels
const CARD_GAP = 24; // gap-6 in pixels

export interface Card {
  title: string;
  description?: string;
  icon?: string;
  link?: string;
}

export interface InfiniteMovingCardsProps {
  cards: Card[];
  direction?: 'left' | 'right';
  speed?: 'slow' | 'normal' | 'fast';
  pauseOnHover?: boolean;
  className?: string;
}

export function InfiniteMovingCards({
  cards,
  direction = 'left',
  speed = 'normal',
  pauseOnHover = true,
  className,
}: InfiniteMovingCardsProps) {
  // Duplicate cards for seamless infinite scroll
  const duplicatedCards = [...cards, ...cards, ...cards];

  const speedMap = {
    slow: '60s',
    normal: '40s',
    fast: '20s',
  };

  const animationDirection = direction === 'left' ? 'reverse' : 'normal';

  // Calculate scroll distance: card width + gap multiplied by number of cards
  const scrollDistance = `-${CARD_WIDTH + CARD_GAP}px`;

  return (
    <div className={cn('relative overflow-hidden w-full', className)}>
      {/* Gradient fade on left */}
      <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-[var(--color-bg)] to-transparent z-10" />
      {/* Gradient fade on right */}
      <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-[var(--color-bg)] to-transparent z-10" />

      <div
        className={cn(
          'flex gap-6 py-4',
          pauseOnHover && 'hover:[animation-play-state:paused]'
        )}
        style={{
          animation: `scroll ${speedMap[speed]} linear infinite`,
          animationDirection,
          '--scroll-distance': scrollDistance,
          '--cards-count': cards.length,
        } as React.CSSProperties}
      >
        {duplicatedCards.map((card, index) => (
          <div
            key={`${card.title}-${index}`}
            className={cn(
              'flex-shrink-0 w-80',
              'backdrop-blur-sm bg-[var(--color-surface)]/70',
              'border border-white/10 rounded-xl p-6',
              'hover:border-[var(--color-accent)]/50 transition-all',
              'hover:shadow-[0_0_30px_var(--color-accent-glow)]'
            )}
          >
            {card.icon && <div className="text-3xl mb-3">{card.icon}</div>}
            <h3 className="text-lg font-semibold text-[var(--text-headings)] mb-2">
              {card.title}
            </h3>
            {card.description && (
              <p className="text-sm text-[var(--text-muted)]">
                {card.description}
              </p>
            )}
          </div>
        ))}
      </div>

      <style>{`
        @keyframes scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(
              calc(var(--scroll-distance) * var(--cards-count))
            );
          }
        }
      `}</style>
    </div>
  );
}
