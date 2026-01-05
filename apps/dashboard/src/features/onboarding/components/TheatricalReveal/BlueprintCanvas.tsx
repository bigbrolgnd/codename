import React from 'react';
import { RevealPhase } from '../../types/reveal.types';
import { EditableService } from '../../types/smartLedger.types';
import { WireframeLayer } from './WireframeLayer';
import { HydrationLayer } from './HydrationLayer';
import { PolishLayer } from './PolishLayer';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface BlueprintCanvasProps {
  phase: RevealPhase;
  services: EditableService[];
  className?: string;
}

export const BlueprintCanvas = ({
  phase,
  services,
  className
}: BlueprintCanvasProps) => {
  return (
    <div className={cn(
      "relative aspect-[3/4] w-full max-w-md mx-auto bg-zinc-950 rounded-2xl border border-zinc-800 shadow-2xl overflow-hidden overflow-y-auto perspective-1000",
      className
    )}>
      {/* Background Blueprint Grid */}
      <div className="absolute inset-0 opacity-10 pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(circle, #10b981 1px, transparent 1px)', backgroundSize: '20px 20px' }} />

      <div className="relative h-full w-full transform-gpu rotate-x-6">
        <AnimatePresence>
          {/* Layer 1: Architecture (Wireframe) */}
          {(['architecture', 'intelligence', 'security', 'launch'].includes(phase)) && (
            <motion.div 
              key="wireframe"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 p-4"
            >
              <WireframeLayer />
            </motion.div>
          )}

          {/* Layer 2: Intelligence (Hydration) */}
          {(['intelligence', 'security', 'launch'].includes(phase)) && (
            <motion.div
              key="hydration"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1 }}
              className="absolute inset-0"
            >
              <HydrationLayer services={services} />
            </motion.div>
          )}

          {/* Layer 3: Security & Launch (Polish) */}
          {(['security', 'launch'].includes(phase)) && (
            <motion.div
              key="polish"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1 }}
              className="absolute inset-0"
            >
              <PolishLayer />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* HUD Overlay */}
      <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center text-[10px] font-mono text-zinc-500 pointer-events-none">
        <div className="flex gap-2">
          <span>LAT: 34.0522</span>
          <span>LNG: -118.2437</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>LIVE_SYNC_ACTIVE</span>
        </div>
      </div>
    </div>
  );
};
