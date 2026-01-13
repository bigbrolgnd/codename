import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface FreeTierWatermarkProps {
  tenantId: string;
  basePlanType: 'free' | 'standard' | 'ai_powered';
  className?: string;
}

export const FreeTierWatermark: React.FC<FreeTierWatermarkProps> = ({
  tenantId,
  basePlanType,
  className,
}) => {
  const [opacity, setOpacity] = useState(0.8);
  const [showTooltip, setShowTooltip] = useState(false);

  // Fade to subtle after 3 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setOpacity(0.3);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  // Hide watermark for paid plans
  if (basePlanType !== 'free') {
    return null;
  }

  const referrerUrl = `https://znapsite.com/?ref=watermark_${tenantId}`;

  return (
    <a
      href={referrerUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'fixed bottom-4 right-4 z-50 transition-all duration-500 ease-out select-none',
        'hover:scale-110 active:scale-105',
        className
      )}
      style={{ opacity }}
      onMouseEnter={() => setOpacity(0.6)}
      onMouseLeave={() => setOpacity(0.3)}
      onClick={() => {
        // Track watermark click for analytics
        if (typeof window !== 'undefined' && (window as any)._zn_track_event) {
          (window as any)._zn_track_event('watermark_click', { tenant_id: tenantId });
        }
      }}
      onMouseEnterCapture={() => setShowTooltip(true)}
      onMouseLeaveCapture={() => setShowTooltip(false)}
    >
      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute bottom-full right-0 mb-2 px-3 py-1.5 bg-zinc-900 text-white text-xs rounded-md whitespace-nowrap shadow-lg">
          Powered by znapsite.com
          <div className="absolute bottom-0 right-4 translate-y-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-zinc-900" />
        </div>
      )}

      {/* Z Logo */}
      <svg
        width="60"
        height="60"
        viewBox="0 0 60 60"
        className="w-10 h-10 sm:w-12 sm:h-12 md:w-[60px] md:h-[60px]"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="z-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#d552b7" />
            <stop offset="100%" stopColor="#9f4389" />
          </linearGradient>
        </defs>
        {/* Background circle */}
        <circle
          cx="30"
          cy="30"
          r="28"
          fill="rgba(213, 82, 183, 0.1)"
          stroke="url(#z-gradient)"
          strokeWidth="2"
        />
        {/* Z Letter */}
        <text
          x="30"
          y="42"
          textAnchor="middle"
          fontSize="32"
          fontWeight="bold"
          fill="url(#z-gradient)"
          fontFamily="serif"
        >
          Z
        </text>
      </svg>
    </a>
  );
};

FreeTierWatermark.displayName = 'FreeTierWatermark';
