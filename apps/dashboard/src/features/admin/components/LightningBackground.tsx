/**
 * LightningBackground Component
 *
 * Canvas-based procedural lightning storm background with activity-reactive intensity.
 * Supports 5 activity levels with different strike probabilities, branching complexity,
 * and visual effects.
 *
 * Activity Levels:
 * - idle: 0.008 strike probability, 0-1 branches per bolt
 * - active: 0.05 strike probability, 1-2 branches per bolt
 * - processing: 0.1 strike probability, 2-3 branches per bolt
 * - success: Burst of 3-5 strikes immediately, then return to idle
 * - error: 0.2 probability, 3-5 branches, red color scheme
 */

import { useEffect, useRef, useMemo } from 'react';
import type { ActivityLevel } from './SystemActivityContext';

interface LightningBolt {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  segments: { x: number; y: number }[];
  life: number;
  maxLife: number;
  width: number;
  opacity: number;
  color: string;
  branches: LightningBolt[];
}

interface LightningBackgroundProps {
  activityLevel?: ActivityLevel;
}

// Strike probabilities for each activity level
const STRIKE_PROBABILITIES: Record<ActivityLevel, number> = {
  idle: 0.008,
  active: 0.05,
  processing: 0.1,
  success: 1.0, // Burst effect - handled separately
  error: 0.2,
};

// Branching depth for each activity level (min, max)
const BRANCHING_DEPTH: Record<ActivityLevel, [number, number]> = {
  idle: [0, 1],
  active: [1, 2],
  processing: [2, 3],
  success: [0, 1],
  error: [3, 5],
};

// Lightning color palettes
const LIGHTNING_COLORS = [
  'rgba(139, 92, 246, ',   // violet
  'rgba(168, 85, 247, ',   // purple
  'rgba(217, 70, 239, ',   // fuchsia
  'rgba(236, 72, 153, ',   // pink
  'rgba(59, 130, 246, ',   // blue
  'rgba(99, 102, 241, ',   // indigo
];

const ERROR_COLORS = [
  'rgba(220, 38, 38, ',     // red-600
  'rgba(239, 68, 68, ',     // red-500
  'rgba(248, 113, 113, ',   // red-400
  'rgba(254, 202, 202, ',   // red-200
  'rgba(185, 28, 28, ',     // red-700
  'rgba(153, 27, 27, ',     // red-800
];

export const LightningBackground: React.FC<LightningBackgroundProps> = ({
  activityLevel = 'idle'
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const boltsRef = useRef<LightningBolt[]>([]);
  const animationRef = useRef<number>();
  const lastFrameTimeRef = useRef<number>(0);
  const pulseStartTimeRef = useRef<number | null>(null);

  // Performance monitoring
  const fpsRef = useRef(60);
  const frameTimesRef = useRef<number[]>([]);
  const performanceDebugEnabledRef = useRef(false);

  // Select color palette based on activity level
  const lightningColors = useMemo(() => {
    return activityLevel === 'error' ? ERROR_COLORS : LIGHTNING_COLORS;
  }, [activityLevel]);

  // Get branching depth range for current activity level
  const [minBranches, maxBranches] = BRANCHING_DEPTH[activityLevel];

  const createLightningBolt = (
    startX: number,
    startY: number,
    endX: number,
    endY: number,
    depth: number = 0
  ): LightningBolt => {
    const segments: { x: number; y: number }[] = [];
    const steps = 20 + Math.random() * 30;
    const displacement = 80 - depth * 20;

    let x = startX;
    let y = startY;

    for (let i = 0; i <= steps; i++) {
      segments.push({ x, y });

      const progress = i / steps;
      const targetX = startX + (endX - startX) * progress;
      const targetY = startY + (endY - startY) * progress;

      if (i < steps) {
        x = targetX + (Math.random() - 0.5) * displacement;
        y = targetY + (Math.random() - 0.5) * displacement * 0.5;
      }
    }

    const colorIndex = Math.floor(Math.random() * lightningColors.length);
    const branches: LightningBolt[] = [];

    // Create branches based on activity level
    if (depth < maxBranches && Math.random() > 0.6 - (activityLevel === 'error' ? 0.2 : 0)) {
      const branchCount = Math.floor(Math.random() * (maxBranches - depth));

      for (let i = 0; i < branchCount; i++) {
        const branchStart = segments[Math.floor(Math.random() * segments.length)];
        const angle = Math.atan2(endY - startY, endX - startX) + (Math.random() - 0.5) * Math.PI * 0.8;
        const length = 100 + Math.random() * 200;

        branches.push(createLightningBolt(
          branchStart.x,
          branchStart.y,
          branchStart.x + Math.cos(angle) * length,
          branchStart.y + Math.sin(angle) * length,
          depth + 1
        ));
      }
    }

    return {
      x: startX,
      y: startY,
      targetX: endX,
      targetY: endY,
      segments,
      life: 0,
      maxLife: 8 + Math.random() * 12,
      width: Math.max(0.5, 3 - depth * 0.8),
      opacity: 0.8 + Math.random() * 0.2,
      color: lightningColors[colorIndex],
      branches,
    };
  };

  const generateLightning = (canvas: HTMLCanvasElement, burstCount: number = 1) => {
    const bolts: LightningBolt[] = [];
    const strikeCount = burstCount + Math.floor(Math.random() * 2);

    for (let i = 0; i < strikeCount; i++) {
      const startX = Math.random() * canvas.width;
      const startY = 0;
      const endX = startX + (Math.random() - 0.5) * 400;
      const endY = canvas.height * (0.5 + Math.random() * 0.5);

      bolts.push(createLightningBolt(startX, startY, endX, endY));
    }

    return bolts;
  };

  const drawPulse = (ctx: CanvasRenderingContext2D, width: number, height: number, progress: number) => {
    if (activityLevel !== 'success' && activityLevel !== 'error') return;

    const duration = activityLevel === 'success' ? 2000 : 1500; // 2s for success, 1.5s for error
    const normalizedProgress = Math.min(progress / duration, 1);

    if (normalizedProgress > 1) return;

    // Fade out towards the end
    const alpha = Math.sin(normalizedProgress * Math.PI) * (activityLevel === 'success' ? 0.3 : 0.4);

    const gradient = ctx.createRadialGradient(
      width / 2, height / 2, 0,
      width / 2, height / 2, Math.max(width, height)
    );

    if (activityLevel === 'success') {
      // Navy blue radial gradient
      gradient.addColorStop(0, `rgba(30, 58, 138, ${alpha})`);
      gradient.addColorStop(0.5, `rgba(30, 58, 138, ${alpha * 0.33})`);
      gradient.addColorStop(1, 'rgba(30, 58, 138, 0)');
    } else {
      // Red radial gradient
      gradient.addColorStop(0, `rgba(220, 38, 38, ${alpha})`);
      gradient.addColorStop(0.5, `rgba(220, 38, 38, ${alpha * 0.25})`);
      gradient.addColorStop(1, 'rgba(220, 38, 38, 0)');
    }

    ctx.save();
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
  };

  const drawBolt = (
    ctx: CanvasRenderingContext2D,
    bolt: LightningBolt,
    deltaTime: number
  ) => {
    if (bolt.segments.length < 2) return;

    // Update life
    bolt.life += deltaTime;

    // Calculate opacity based on life (fade in then out)
    const fadeIn = bolt.life < 2;
    const fadeOut = bolt.life > bolt.maxLife - 4;
    let opacity = bolt.opacity;

    if (fadeIn) {
      opacity *= bolt.life / 2;
    } else if (fadeOut) {
      opacity *= (bolt.maxLife - bolt.life) / 4;
    }

    if (opacity <= 0) return;

    // Draw glow
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.shadowColor = bolt.color + '1)';
    ctx.shadowBlur = 30;
    ctx.strokeStyle = bolt.color + (opacity * 0.6) + ')';
    ctx.lineWidth = bolt.width * 6;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(bolt.segments[0].x, bolt.segments[0].y);
    for (let i = 1; i < bolt.segments.length; i++) {
      ctx.lineTo(bolt.segments[i].x, bolt.segments[i].y);
    }
    ctx.stroke();
    ctx.restore();

    // Draw main bolt
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = bolt.color + opacity + ')';
    ctx.lineWidth = bolt.width;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(bolt.segments[0].x, bolt.segments[0].y);
    for (let i = 1; i < bolt.segments.length; i++) {
      ctx.lineTo(bolt.segments[i].x, bolt.segments[i].y);
    }
    ctx.stroke();
    ctx.restore();

    // Draw bright core
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = 'rgba(255, 255, 255, ' + (opacity * 0.8) + ')';
    ctx.lineWidth = bolt.width * 0.3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(bolt.segments[0].x, bolt.segments[0].y);
    for (let i = 1; i < bolt.segments.length; i++) {
      ctx.lineTo(bolt.segments[i].x, bolt.segments[i].y);
    }
    ctx.stroke();
    ctx.restore();

    // Draw branches
    bolt.branches.forEach(branch => drawBolt(ctx, branch, deltaTime));
  };

  const drawBackground = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    // Deep space gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, '#0a0a0f');
    gradient.addColorStop(0.3, '#0f0a15');
    gradient.addColorStop(0.6, '#0a0a12');
    gradient.addColorStop(1, '#050508');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Subtle grid pattern
    ctx.strokeStyle = 'rgba(139, 92, 246, 0.03)';
    ctx.lineWidth = 1;
    const gridSize = 60;

    for (let x = 0; x < width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    for (let y = 0; y < height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Ambient glow orbs
    const time = Date.now() * 0.0005;
    const orbs = [
      { x: width * 0.2, y: height * 0.3, r: 300, color: '139, 92, 246' },
      { x: width * 0.8, y: height * 0.7, r: 400, color: '168, 85, 247' },
      { x: width * 0.5, y: height * 0.5, r: 350, color: '217, 70, 239' },
    ];

    orbs.forEach((orb, i) => {
      const pulse = 0.3 + Math.sin(time + i) * 0.15;
      const orbGradient = ctx.createRadialGradient(orb.x, orb.y, 0, orb.x, orb.y, orb.r);
      orbGradient.addColorStop(0, `rgba(${orb.color}, ${pulse * 0.15})`);
      orbGradient.addColorStop(0.5, `rgba(${orb.color}, ${pulse * 0.05})`);
      orbGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = orbGradient;
      ctx.fillRect(0, 0, width, height);
    });
  };

  const measureFPS = (time: number) => {
    const delta = time - lastFrameTimeRef.current;
    frameTimesRef.current.push(delta);
    if (frameTimesRef.current.length > 60) {
      frameTimesRef.current.shift();
    }
    const avgDelta = frameTimesRef.current.reduce((a, b) => a + b) / frameTimesRef.current.length;
    fpsRef.current = 1000 / avgDelta;

    if (fpsRef.current < 50 && process.env.NODE_ENV === 'development') {
      console.warn(`[LightningBackground] FPS dropped to ${fpsRef.current.toFixed(1)}`);
    }
  };

  const animate = (time: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const deltaTime = (time - lastFrameTimeRef.current) / 1000;
    lastFrameTimeRef.current = time;

    // Performance monitoring
    measureFPS(time);

    // Performance optimization: reduce complexity if fps drops
    const effectiveMaxBranches = fpsRef.current < 40 ? 2 : maxBranches;

    // Clear and draw background
    drawBackground(ctx, canvas.width, canvas.height);

    // Draw pulse effect for success/error states
    if (pulseStartTimeRef.current !== null) {
      const pulseProgress = time - pulseStartTimeRef.current;
      drawPulse(ctx, canvas.width, canvas.height, pulseProgress);

      // Stop pulse after duration
      const pulseDuration = activityLevel === 'success' ? 2000 : 1500;
      if (pulseProgress > pulseDuration) {
        pulseStartTimeRef.current = null;
      }
    }

    // Update and draw bolts
    boltsRef.current = boltsRef.current.filter(bolt => bolt.life < bolt.maxLife);

    boltsRef.current.forEach(bolt => {
      drawBolt(ctx, bolt, deltaTime);
    });

    // Generate new lightning based on activity level
    const strikeProbability = STRIKE_PROBABILITIES[activityLevel];

    // Trigger pulse if needed
    if ((activityLevel === 'success' || activityLevel === 'error') && pulseStartTimeRef.current === null) {
      pulseStartTimeRef.current = time;
      
      // Burst effect for success
      if (activityLevel === 'success') {
        boltsRef.current.push(...generateLightning(canvas, 3)); // Burst of 3-5 strikes
      }
    }

    // Generate random lightning for non-success states (including error)
    if (activityLevel !== 'success' && Math.random() < strikeProbability) {
      boltsRef.current.push(...generateLightning(canvas));
    }

    animationRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    // Enable performance debug mode in development
    if (process.env.NODE_ENV === 'development') {
      performanceDebugEnabledRef.current = true;
      (window as any).__LIGHTNING_DEBUG__ = {
        getFPS: () => fpsRef.current,
        getFrameTimes: () => frameTimesRef.current,
      };
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (process.env.NODE_ENV === 'development') {
        delete (window as any).__LIGHTNING_DEBUG__;
      }
    };
  }, [activityLevel, maxBranches]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: -1 }}
    />
  );
};
