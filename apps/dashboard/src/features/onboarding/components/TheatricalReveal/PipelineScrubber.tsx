import React from 'react';
import { RevealPhase, PHASE_CONFIG } from '../../types/reveal.types';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Check, Brain, Shield, Rocket, Grid3X3 } from 'lucide-react';

interface PipelineScrubberProps {
  currentPhase: RevealPhase;
  overallProgress: number;
  className?: string;
}

const PHASES: RevealPhase[] = ['architecture', 'intelligence', 'security', 'launch'];

const getIcon = (iconName: string, className?: string) => {
  switch (iconName) {
    case 'Grid3x3': return <Grid3X3 className={className} />;
    case 'Brain': return <Brain className={className} />;
    case 'Shield': return <Shield className={className} />;
    case 'Rocket': return <Rocket className={className} />;
    default: return null;
  }
};

export const PipelineScrubber = ({
  currentPhase,
  overallProgress,
  className
}: PipelineScrubberProps) => {
  const currentPhaseIndex = PHASES.indexOf(currentPhase);

  return (
    <div className={cn("w-full max-w-4xl mx-auto px-6 py-8", className)}>
      <div className="relative">
        {/* Background Line */}
        <div className="absolute top-5 left-0 w-full h-0.5 bg-zinc-800" />
        
        {/* Progress Line */}
        <motion.div
          className="absolute top-5 left-0 h-0.5 bg-pink-500 shadow-[0_0_8px_rgba(213,82,183,0.5)]"
          initial={{ width: 0 }}
          animate={{ width: `${overallProgress}%` }}
          transition={{ duration: 0.3, ease: "linear" }}
        />

        <div className="relative flex justify-between">
          {PHASES.map((phase, index) => {
            const config = PHASE_CONFIG[phase];
            const isCompleted = index < currentPhaseIndex || (index === PHASES.length - 1 && overallProgress === 100);
            const isActive = index === currentPhaseIndex && overallProgress < 100;

            return (
              <div key={phase} className="flex flex-col items-center group">
                <motion.div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center z-10 border-2 transition-colors duration-300",
                    isCompleted ? "bg-pink-500 border-pink-500" :
                    isActive ? "bg-zinc-900 border-pink-500 shadow-[0_0_12px_rgba(213,82,183,0.4)]" :
                    "bg-zinc-900 border-zinc-800"
                  )}
                  initial={false}
                  animate={isActive ? { scale: [1, 1.1, 1] } : { scale: 1 }}
                  transition={isActive ? { repeat: Infinity, duration: 2 } : {}}
                >
                  {isCompleted ? (
                    <Check className="h-5 w-5 text-zinc-950" />
                  ) : (
                    getIcon(config.icon, cn(
                      "h-5 w-5",
                      isActive ? "text-pink-400" : "text-zinc-600"
                    ))
                  )}
                </motion.div>

                <div className="mt-3 text-center">
                  <span className={cn(
                    "text-xs font-medium transition-colors duration-300",
                    isCompleted || isActive ? "text-zinc-100" : "text-zinc-500"
                  )}>
                    {config.label}
                  </span>
                  {isActive && (
                    <motion.div
                      layoutId="active-indicator"
                      className="text-[10px] text-pink-500 font-mono mt-0.5"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      IN PROGRESS
                    </motion.div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
