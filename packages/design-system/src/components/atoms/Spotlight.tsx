/**
 * Spotlight Component
 * Based on: Aceternity Spotlight
 * Creates a hover spotlight effect on cards
 */

import { useRef, useState } from 'react';
import { cn } from '../../lib/utils';

export interface SpotlightProps {
  className?: string;
  children: React.ReactNode;
  spotlightSize?: number;
  spotlightColor?: string;
}

export function Spotlight({
  className,
  children,
  spotlightSize = 200,
  spotlightColor = 'rgba(233, 30, 140, 0.15)',
}: SpotlightProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setMousePosition({ x, y });
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn('relative', className)}
      style={{
        '--spotlight-size': `${spotlightSize}px`,
        '--spotlight-color': spotlightColor,
      }}
    >
      {/* Spotlight overlay */}
      {isHovered && (
        <div
          className="absolute inset-0 pointer-events-none transition-opacity duration-300"
          style={{
            background: `radial-gradient(
              circle at ${mousePosition.x}px ${mousePosition.y}px,
              var(--spotlight-color) 0%,
              transparent 70%
            )`,
            opacity: isHovered ? 1 : 0,
          }}
        />
      )}
      {children}
    </div>
  );
}
