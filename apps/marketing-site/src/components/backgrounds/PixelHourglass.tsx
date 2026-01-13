/**
 * Pixel Hourglass Background
 *
 * Canvas-based ambient background effect for znapsite.com
 * Pink pixel sprites spawn from bottom and accumulate upward like hourglass sand
 *
 * Spec: docs/product-discovery/znapsite-homepage-design.md
 */

import { useEffect, useRef } from 'react';

interface Pixel {
  x: number;
  y: number;
  size: number;
  speed: number;
  opacity: number;
  settled: boolean;
}

interface PixelHourglassProps {
  /** Pixel size in pixels (default: 6) */
  pixelSize?: number;
  /** Animation speed multiplier (default: 1) */
  speed?: number;
  /** Spawn rate - pixels per frame (default: 0.5) */
  spawnRate?: number;
  /** Color of pixels (default: accent pink) */
  color?: string;
  /** Maximum opacity (default: 0.6) */
  maxOpacity?: number;
  /** Enable reduced motion (default: auto-detect) */
  reducedMotion?: boolean;
}

export function PixelHourglass({
  pixelSize = 6,
  speed = 1,
  spawnRate = 0.5,
  color = 'var(--color-accent)',
  maxOpacity = 0.6,
  reducedMotion,
}: PixelHourglassProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const pixelsRef = useRef<Pixel[]>([]);
  const spawnAccumulatorRef = useRef(0);
  const lastTimeRef = useRef(0);

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

    // Pixel colors - parse the CSS variable if needed
    const getPixelColor = (opacity: number): string => {
      if (color.startsWith('var(')) {
        // For CSS variables, use a hardcoded fallback that matches our token
        return `rgba(233, 30, 140, ${opacity})`;
      }
      return color;
    };

    // Initialize pixels array
    pixelsRef.current = [];

    // Create a new pixel at the bottom
    const spawnPixel = (): Pixel => {
      const size = pixelSize + Math.random() * 2; // 6-8px variation
      return {
        x: Math.random() * canvas.width,
        y: canvas.height + size,
        size,
        speed: (0.5 + Math.random() * 0.5) * speed, // 0.5-1x base speed
        opacity: 0.1 + Math.random() * (maxOpacity - 0.1),
        settled: false,
      };
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

      // Spawn new pixels
      if (!shouldReduceMotion) {
        spawnAccumulatorRef.current += spawnRate * (deltaTime / 16); // Normalize to 60fps

        while (spawnAccumulatorRef.current >= 1) {
          pixelsRef.current.push(spawnPixel());
          spawnAccumulatorRef.current -= 1;

          // Limit total pixels for performance
          if (pixelsRef.current.length > 500) {
            pixelsRef.current.shift();
          }
        }
      }

      // Calculate "fill level" based on pixel count
      const fillProgress = Math.min(pixelsRef.current.length / 500, 1);
      const thresholdY = canvas.height * (1 - fillProgress * 0.8); // Fill 80% of screen

      // Update and draw pixels
      pixelsRef.current.forEach((pixel) => {
        // Move pixel upward
        if (!pixel.settled && !shouldReduceMotion) {
          pixel.y -= pixel.speed * (deltaTime / 16);
        }

        // Check if pixel should settle
        if (!pixel.settled && pixel.y <= thresholdY) {
          pixel.settled = true;
          pixel.y = thresholdY + (Math.random() - 0.5) * 20; // Add some stacking variation
        }

        // Draw pixel
        ctx.fillStyle = getPixelColor(pixel.opacity);
        ctx.fillRect(
          Math.floor(pixel.x),
          Math.floor(pixel.y),
          Math.floor(pixel.size),
          Math.floor(pixel.size)
        );
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
  }, [pixelSize, speed, spawnRate, color, maxOpacity, shouldReduceMotion]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 0 }}
      aria-hidden="true"
    />
  );
}
