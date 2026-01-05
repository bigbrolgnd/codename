import React from 'react';
import { motion } from 'framer-motion';

export const WireframeLayer = () => {
  const paths = [
    { id: 'header', d: 'M10,10 L210,10 L210,35 L10,35 Z', delay: 0 },
    { id: 'hero-bg', d: 'M10,40 L210,40 L210,100 L10,120 Z', delay: 0.2 },
    { id: 'service-1', d: 'M10,130 L105,130 L105,180 L10,180 Z', delay: 0.4 },
    { id: 'service-2', d: 'M115,130 L210,130 L210,180 L115,180 Z', delay: 0.5 },
    { id: 'service-3', d: 'M10,190 L105,190 L105,240 L10,240 Z', delay: 0.6 },
    { id: 'service-4', d: 'M115,190 L210,190 L210,240 L115,240 Z', delay: 0.7 },
    { id: 'footer', d: 'M10,250 L210,250 L210,280 L10,280 Z', delay: 0.9 },
  ];

  return (
    <svg viewBox="0 0 220 300" className="w-full h-full">
      {paths.map((path) => (
        <motion.path
          key={path.id}
          d={path.d}
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          className="text-emerald-500/40"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 1, delay: path.delay, ease: "easeInOut" }}
        />
      ))}
    </svg>
  );
};
