import { useState, useEffect, useCallback, useMemo } from 'react';
import { RevealPhase, RevealAnimationState, ProvisioningLog } from '../types/reveal.types';

interface UseRevealAnimationOptions {
  durationMs?: number;
  autoStart?: boolean;
}

const PHASES: RevealPhase[] = ['architecture', 'intelligence', 'security', 'launch'];

export function useRevealAnimation({ 
  durationMs = 15000, 
  autoStart = true 
}: UseRevealAnimationOptions = {}) {
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState(0);
  const [overallProgress, setOverallProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [isActive, setIsActive] = useState(autoStart);

  const currentPhase = useMemo(() => PHASES[currentPhaseIndex], [currentPhaseIndex]);

  useEffect(() => {
    if (!isActive || isComplete) return;

    const intervalMs = 100;
    const increment = (intervalMs / durationMs) * 100;

    const timer = setInterval(() => {
      setOverallProgress((prev) => {
        const next = prev + increment;
        
        // Update phase based on progress
        const phaseThreshold = 100 / PHASES.length;
        const newPhaseIndex = Math.min(
          Math.floor(next / phaseThreshold),
          PHASES.length - 1
        );
        
        if (newPhaseIndex !== currentPhaseIndex) {
          setCurrentPhaseIndex(newPhaseIndex);
        }

        if (next >= 100) {
          clearInterval(timer);
          setIsComplete(true);
          return 100;
        }
        return next;
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isActive, isComplete, durationMs, currentPhaseIndex]);

  const start = useCallback(() => setIsActive(true), []);
  const reset = useCallback(() => {
    setCurrentPhaseIndex(0);
    setOverallProgress(0);
    setIsComplete(false);
    setIsActive(autoStart);
  }, [autoStart]);

  return {
    currentPhase,
    overallProgress,
    isComplete,
    isActive,
    start,
    reset,
  };
}
