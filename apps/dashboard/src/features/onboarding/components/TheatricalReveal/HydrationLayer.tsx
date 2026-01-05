import React from 'react';
import { motion } from 'framer-motion';
import type { EditableService } from '../../types/smartLedger.types';

interface HydrationLayerProps {
  services: EditableService[];
}

export const HydrationLayer = ({ services }: HydrationLayerProps) => {
  const blocks = [
    { id: 'header-fill', x: 10, y: 10, width: 200, height: 25, delay: 0 },
    { id: 'hero-fill', x: 10, y: 40, width: 200, height: 70, delay: 0.2, color: 'bg-zinc-800' },
  ];

  return (
    <div className="absolute inset-0 p-4">
      <svg viewBox="0 0 220 300" className="w-full h-full">
        {blocks.map((block) => (
          <motion.rect
            key={block.id}
            x={block.x}
            y={block.y}
            width={block.width}
            height={block.height}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: block.delay }}
            className={block.color || "fill-emerald-500/10"}
          />
        ))}
        
        {/* Animated service slots */}
        {services.slice(0, 4).map((service, i) => {
          const x = i % 2 === 0 ? 10 : 115;
          const y = Math.floor(i / 2) === 0 ? 130 : 190;
          
          return (
            <motion.rect
              key={service.id}
              x={x}
              y={y}
              width={95}
              height={50}
              initial={{ opacity: 0, y: y + 20 }}
              animate={{ opacity: 1, y: y }}
              transition={{ 
                type: 'spring', 
                stiffness: 100, 
                delay: 0.5 + (i * 0.1) 
              }}
              className="fill-zinc-800/80 stroke-emerald-500/20"
              strokeWidth="0.5"
            />
          );
        })}
      </svg>
    </div>
  );
};
