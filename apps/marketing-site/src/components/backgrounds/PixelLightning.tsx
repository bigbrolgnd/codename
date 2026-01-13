/**
 * Pixel Lightning Background
 *
 * Canvas-based ambient background effect for znapsite.com
 * Tesla coil-style lightning on left and right sides with branching pixel electricity
 *
 * Pink pixel art lightning that moves and branches like electrical arcs
 */

import { useEffect, useRef } from 'react';

interface LightningBolt {
  segments: { x: number; y: number }[];
  life: number;
  maxLife: number;
  side: 'left' | 'right';
  thickness: number;
}

interface PixelLightningProps {
  /** Pixel size in pixels (default: 6) */
  pixelSize?: number;
  /** Color of pixels (default: accent pink) */
  color?: string;
  /** Enable reduced motion (default: auto-detect) */
  reducedMotion?: boolean;
}

export function PixelLightning({
  pixelSize = 6,
  color = 'var(--color-accent)',
  reducedMotion,
}: PixelLightningProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const boltsRef = useRef<LightningBolt[]>([]);
  const lastTimeRef = useRef(0);
  const spawnTimerRef = useRef(0);

  const shouldReduceMotion = reducedMotion ?? window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Pixel color
    const getPixelColor = (opacity: number): string => {
      if (color.startsWith('var(')) {
        return `rgba(233, 30, 140, ${opacity})`;
      }
      return color;
    };

    // Tesla coil positions (bottom left and right corners)
    const getTeslaCoilBase = (side: 'left' | 'right') => {
      const margin = 30;
      return {
        x: side === 'left' ? margin : canvas.width - margin,
        y: canvas.height - 100,
      };
    };

    // Generate a lightning bolt with branching
    const generateLightningBolt = (side: 'left' | 'right'): LightningBolt => {
      const base = getTeslaCoilBase(side);
      const segments: { x: number; y: number }[] = [];
      const targetX = side === 'left'
        ? canvas.width * (0.3 + Math.random() * 0.4) // Left reaches 30-70% across
        : canvas.width * (0.3 + Math.random() * 0.4); // Right reaches 30-70% across
      const targetY = canvas.height * (0.1 + Math.random() * 0.3); // Top 10-40% of screen

      // Main bolt path with jagged segments
      let currentX = base.x;
      let currentY = base.y;
      const steps = 15 + Math.floor(Math.random() * 10); // 15-25 segments

      for (let i = 0; i <= steps; i++) {
        segments.push({ x: currentX, y: currentY });

        // Progress toward target
        const progress = i / steps;
        const nextX = base.x + (targetX - base.x) * progress;
        const nextY = base.y + (targetY - base.y) * progress;

        // Add jagged randomness
        const jagAmount = 30 * (1 - progress * 0.5); // Less jagged toward tip
        currentX = nextX + (Math.random() - 0.5) * jagAmount;
        currentY = nextY + (Math.random() - 0.5) * jagAmount * 0.5;

        // Create branches
        if (Math.random() < 0.25 && i > 2 && i < steps - 2) {
          const branchLength = 3 + Math.floor(Math.random() * 5);
          const branchAngle = (Math.random() - 0.5) * Math.PI * 0.8;
          let branchX = currentX;
          let branchY = currentY;

          for (let j = 0; j < branchLength; j++) {
            segments.push({ x: branchX, y: branchY });
            branchX += Math.cos(branchAngle) * pixelSize * 2;
            branchY -= Math.abs(Math.sin(branchAngle) * pixelSize * 2);
          }
        }
      }

      // Life in milliseconds
      const life = 80 + Math.random() * 120; // Very fast - 80-200ms

      return {
        segments,
        life,
        maxLife: life,
        side,
        thickness: 1 + Math.floor(Math.random() * 2), // 1-2 pixels thick
      };
    };

    // Draw a single pixel
    const drawPixel = (x: number, y: number, opacity: number, thickness: number = 1) => {
      ctx.fillStyle = getPixelColor(opacity);
      const size = pixelSize * thickness;
      ctx.fillRect(
        Math.floor(x - size / 2),
        Math.floor(y - size / 2),
        Math.ceil(size),
        Math.ceil(size)
      );
    };

    // Draw tesla coil base
    const drawTeslaCoil = (side: 'left' | 'right', opacity: number) => {
      const base = getTeslaCoilBase(side);
      const coilHeight = 80;
      const coilWidth = 20;

      // Draw coil base (stacked pixels)
      for (let y = 0; y < coilHeight; y += pixelSize) {
        const widthVariation = Math.sin(y * 0.2) * 5;
        const currentWidth = coilWidth + widthVariation;

        for (let x = -currentWidth / 2; x < currentWidth / 2; x += pixelSize) {
          drawPixel(base.x + x, base.y + y, opacity * 0.5);
        }
      }

      // Draw sphere on top
      const sphereRadius = 15;
      for (let dy = -sphereRadius; dy <= sphereRadius; dy += pixelSize) {
        for (let dx = -sphereRadius; dx <= sphereRadius; dx += pixelSize) {
          if (dx * dx + dy * dy <= sphereRadius * sphereRadius) {
            drawPixel(base.x + dx, base.y - sphereRadius + dy, opacity * 0.7);
          }
        }
      }
    };

    // Animation loop
    const animate = (timestamp: number) => {
      if (!lastTimeRef.current) {
        lastTimeRef.current = timestamp;
      }

      const deltaTime = timestamp - lastTimeRef.current;
      lastTimeRef.current = timestamp;

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (!shouldReduceMotion) {
        // Spawn new bolts rapidly
        spawnTimerRef.current += deltaTime;

        // Spawn every 50-150ms per side - very frequent for electric feel
        const spawnInterval = 50 + Math.random() * 100;
        if (spawnTimerRef.current > spawnInterval) {
          // Spawn from random side or both
          if (Math.random() < 0.5) {
            boltsRef.current.push(generateLightningBolt('left'));
          }
          if (Math.random() < 0.5) {
            boltsRef.current.push(generateLightningBolt('right'));
          }
          spawnTimerRef.current = 0;
        }

        // Update bolts
        boltsRef.current = boltsRef.current.filter(bolt => {
          bolt.life -= deltaTime;
          return bolt.life > 0;
        });
      }

      // Draw tesla coils (always visible with subtle glow)
      const coilPulse = 0.3 + Math.sin(timestamp * 0.005) * 0.2;
      drawTeslaCoil('left', coilPulse);
      drawTeslaCoil('right', coilPulse);

      // Draw all bolts
      boltsRef.current.forEach(bolt => {
        const lifeRatio = bolt.life / bolt.maxLife;
        const opacity = lifeRatio * 0.9; // Fade out as life decreases

        // Draw segments
        bolt.segments.forEach((segment) => {
          // Add flicker effect
          const flicker = 0.7 + Math.random() * 0.3;
          drawPixel(segment.x, segment.y, opacity * flicker, bolt.thickness);
        });

        // Draw occasional extra pixels around active bolts for "electricity spreading" effect
        if (Math.random() < 0.3) {
          const randomSegment = bolt.segments[Math.floor(Math.random() * bolt.segments.length)];
          if (randomSegment) {
            const offsetX = (Math.random() - 0.5) * pixelSize * 4;
            const offsetY = (Math.random() - 0.5) * pixelSize * 4;
            drawPixel(randomSegment.x + offsetX, randomSegment.y + offsetY, opacity * 0.3);
          }
        }
      });

      // Continue animation
      animationRef.current = requestAnimationFrame(animate);
    };

    // Start animation
    animationRef.current = requestAnimationFrame(animate);

    // Cleanup
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [pixelSize, color, shouldReduceMotion]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 0 }}
      aria-hidden="true"
    />
  );
}
