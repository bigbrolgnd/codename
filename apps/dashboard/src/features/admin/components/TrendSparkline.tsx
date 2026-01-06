import React from 'react';

interface TrendSparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
}

export const TrendSparkline: React.FC<TrendSparklineProps> = ({ 
  data, 
  width = 200, 
  height = 40,
  color = "#10b981" 
}) => {
  if (data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data.map((val, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((val - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width={width} height={height} className="overflow-visible">
      <defs>
        <linearGradient id="sparkline-gradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.2" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      
      {/* Area under the curve */}
      <path
        d={`M 0,${height} L ${points} L ${width},${height} Z`}
        fill="url(#sparkline-gradient)"
      />

      {/* The Line */}
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
      
      {/* Endpoint dot */}
      <circle
        cx={width}
        cy={height - ((data[data.length - 1] - min) / range) * height}
        r="3"
        fill={color}
        className="animate-pulse"
      />
    </svg>
  );
};
