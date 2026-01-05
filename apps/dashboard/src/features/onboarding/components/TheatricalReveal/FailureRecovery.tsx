import React from 'react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { AlertCircle, RefreshCw, MessageSquare } from 'lucide-react';
import { ProvisioningError } from '../../types/reveal.types';

interface FailureRecoveryProps {
  error: ProvisioningError;
  onRetry: () => void;
  onContactSupport?: () => void;
}

export const FailureRecovery = ({
  error,
  onRetry,
  onContactSupport
}: FailureRecoveryProps) => {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-zinc-950/80 backdrop-blur-sm"
    >
      <div className="w-full max-w-md bg-zinc-900 border border-red-500/20 rounded-2xl p-8 shadow-2xl text-center">
        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/20">
          <AlertCircle className="w-8 h-8 text-red-500" />
        </div>
        
        <h2 className="text-xl font-bold text-zinc-100 mb-2">I hit a little snag</h2>
        <p className="text-zinc-400 mb-8 text-sm">
          {error.message || "I encountered an issue setting up your infrastructure. Don't worry, your data is safe."}
        </p>

        <div className="space-y-3">
          <Button size="lg" onClick={onRetry} className="w-full bg-zinc-100 text-zinc-950 hover:bg-white">
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
          
          <Button variant="ghost" onClick={onContactSupport} className="w-full text-zinc-500 hover:text-zinc-300">
            <MessageSquare className="w-4 h-4 mr-2" />
            Talk to an Expert
          </Button>
        </div>
        
        <p className="mt-6 text-[10px] font-mono text-zinc-600 uppercase tracking-tighter">
          Error Code: {error.code} | Phase: {error.phase}
        </p>
      </div>
    </motion.div>
  );
};
