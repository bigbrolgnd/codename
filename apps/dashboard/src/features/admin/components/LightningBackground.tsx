import { useEffect, useRef } from 'react';

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

export const LightningBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const boltsRef = useRef<LightningBolt[]>([]);
  const animationRef = useRef<number>();
  const lastStrikeTimeRef = useRef<number>(0);

  // Lightning color palette - electric blues, purples, and pinks
  const lightningColors = [
    'rgba(139, 92, 246, ',   // violet
    'rgba(168, 85, 247, ',   // purple
    'rgba(217, 70, 239, ',   // fuchsia
    'rgba(236, 72, 153, ',   // pink
    'rgba(59, 130, 246, ',   // blue
    'rgba(99, 102, 241, ',   // indigo
  ];

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

    // Create branches
    if (depth < 2 && Math.random() > 0.6) {
      const branchCount = Math.floor(Math.random() * 3);
      const midIndex = Math.floor(segments.length / 2);

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

  const generateLightning = (canvas: HTMLCanvasElement) => {
    const bolts: LightningBolt[] = [];
    const strikeCount = 1 + Math.floor(Math.random() * 2);

    for (let i = 0; i < strikeCount; i++) {
      const startX = Math.random() * canvas.width;
      const startY = 0;
      const endX = startX + (Math.random() - 0.5) * 400;
      const endY = canvas.height * (0.5 + Math.random() * 0.5);

      bolts.push(createLightningBolt(startX, startY, endX, endY));
    }

    return bolts;
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
      const gradient = ctx.createRadialGradient(orb.x, orb.y, 0, orb.x, orb.y, orb.r);
      gradient.addColorStop(0, `rgba(${orb.color}, ${pulse * 0.15})`);
      gradient.addColorStop(0.5, `rgba(${orb.color}, ${pulse * 0.05})`);
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
    });
  };

  const animate = (time: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const deltaTime = (time - lastStrikeTimeRef.current) / 1000;
    lastStrikeTimeRef.current = time;

    // Clear and draw background
    drawBackground(ctx, canvas.width, canvas.height);

    // Update and draw bolts
    boltsRef.current = boltsRef.current.filter(bolt => bolt.life < bolt.maxLife);

    boltsRef.current.forEach(bolt => {
      drawBolt(ctx, bolt, deltaTime);
    });

    // Randomly create new lightning
    if (Math.random() < 0.008) {
      boltsRef.current.push(...generateLightning(canvas));
    }

    animationRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
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
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: -1 }}
    />
  );
};
