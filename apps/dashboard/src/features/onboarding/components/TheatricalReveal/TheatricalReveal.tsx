import React, { useState, useEffect, useRef } from 'react';
import { EditableService } from '../../types/smartLedger.types';
import { ProvisioningError } from '../../types/reveal.types';
import { useRevealAnimation } from '../../hooks/useRevealAnimation';
import { useProvisioningStatus, useProvisioningMutation } from '../../hooks/useProvisioningStatus';
import { PipelineScrubber } from './PipelineScrubber';
import { BlueprintCanvas } from './BlueprintCanvas';
import { AgentTerminal } from './AgentTerminal';
import { CompletionCelebration } from './CompletionCelebration';
import { FailureRecovery } from './FailureRecovery';
import { motion, AnimatePresence } from 'framer-motion';

interface TheatricalRevealProps {
  services: EditableService[];
  onComplete: (siteUrl: string) => void;
  onError?: (error: ProvisioningError) => void;
  onGoToDashboard: () => void;
  durationMs?: number;
}

export const TheatricalReveal = ({
  services,
  onComplete,
  onError,
  onGoToDashboard,
  durationMs = 15000
}: TheatricalRevealProps) => {
  const [provisioningId, setProvisioningId] = useState<string | null>(null);
  const startTriggered = useRef(false);

  const { mutate: startProvisioning } = useProvisioningMutation();

  const { 
    currentPhase: animationPhase, 
    overallProgress: animationProgress, 
    isComplete: isAnimationComplete 
  } = useRevealAnimation({ durationMs });

  const { 
    phase: provisioningPhase, 
    logs, 
    isComplete: isProvisioningComplete,
    error: provisioningError,
    siteUrl,
    refetch: retry
  } = useProvisioningStatus(provisioningId);

  // Trigger provisioning once on mount
  useEffect(() => {
    if (startTriggered.current) return;
    startTriggered.current = true;

    startProvisioning({
      services: services.map(s => ({
        id: s.id,
        name: s.name,
        price: s.price,
        duration: s.duration,
        category: s.category,
        confidence: s.confidence,
        boundingBox: s.boundingBox,
        description: s.description,
      })),
      preferences: {
        colorScheme: 'dark',
      }
    }, {
      onSuccess: (data) => {
        setProvisioningId(data.provisioningId);
      },
      onError: (err) => {
        console.error('Failed to start provisioning:', err);
      }
    });
  }, [services, startProvisioning]);

  // Sync error state
  const [error, setError] = useState<ProvisioningError | null>(null);
  
  useEffect(() => {
    if (provisioningError) {
      setError(provisioningError as ProvisioningError);
      onError?.(provisioningError as ProvisioningError);
    }
  }, [provisioningError, onError]);

  return (
    <motion.div
      layoutId="reveal-container"
      className="fixed inset-0 z-[100] bg-zinc-950 text-white flex flex-col overflow-hidden"
    >
      {/* Background Ambience */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-1/2 h-1/2 bg-pink-500/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-0 right-1/4 w-1/2 h-1/2 bg-blue-500/5 blur-[120px] rounded-full" />
      </div>

      <div className="relative z-10 flex flex-col h-full">
        {/* Top: Progress */}
        <PipelineScrubber 
          currentPhase={provisioningPhase} 
          overallProgress={provisioningId ? animationProgress : 0} 
        />

        {/* Center: Visualization */}
        <main className="flex-1 flex items-center justify-center p-6 min-h-0">
          <BlueprintCanvas 
            phase={provisioningPhase} 
            services={services} 
          />
        </main>

        {/* Bottom: Terminal */}
        <footer className="p-6 pb-12">
          <AgentTerminal logs={logs} />
        </footer>
      </div>

      {/* Completion Overlay */}
      <AnimatePresence>
        {isAnimationComplete && isProvisioningComplete && !error && (
          <CompletionCelebration
            siteUrl={siteUrl || ""}
            onViewSite={() => onComplete(siteUrl || "")}
            onGoToDashboard={onGoToDashboard}
          />
        )}
      </AnimatePresence>

      {/* Error Overlay */}
      {error && (
        <FailureRecovery
          error={error}
          onRetry={() => {
            setError(null);
            retry();
          }}
        />
      )}
    </motion.div>
  );
};