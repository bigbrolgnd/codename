import React, { useRef, useEffect } from 'react';
import { ProvisioningLog } from '../../types/reveal.types';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { CheckCircle2, Info, AlertTriangle, ChevronRight } from 'lucide-react';

interface AgentTerminalProps {
  logs: ProvisioningLog[];
  className?: string;
}

export const AgentTerminal = ({
  logs,
  className
}: AgentTerminalProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className={cn(
      "w-full max-w-4xl mx-auto bg-zinc-950/80 backdrop-blur-md border border-zinc-800 rounded-lg overflow-hidden shadow-2xl flex flex-col",
      className
    )}>
      {/* Header */}
      <div className="bg-zinc-900 px-4 py-2 border-b border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500/50" />
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/50" />
          </div>
          <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest ml-2">Agent Execution Log</span>
        </div>
        <div className="text-[10px] font-mono text-emerald-500/50 animate-pulse">SYSTEM_STABLE</div>
      </div>

      {/* Log Content */}
      <div 
        ref={scrollRef}
        className="p-4 h-48 overflow-y-auto font-mono text-xs space-y-2 scroll-smooth"
      >
        <AnimatePresence initial={false}>
          {logs.map((log) => (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-start gap-2 group"
            >
              <span className="text-zinc-600 mt-0.5"><ChevronRight className="h-3 w-3" /></span>
              
              <div className="flex-1 flex justify-between items-center gap-4">
                <span className={cn(
                  "leading-relaxed",
                  log.type === 'success' ? "text-emerald-400" : 
                  log.type === 'warning' ? "text-amber-400" : 
                  "text-zinc-300"
                )}>
                  {log.message}
                </span>
                
                {log.type === 'success' && (
                  <motion.span 
                    initial={{ scale: 0 }} 
                    animate={{ scale: 1 }}
                    className="text-emerald-500 flex items-center gap-1 flex-shrink-0"
                  >
                    <CheckCircle2 className="h-3 w-3" />
                    <span className="text-[10px]">DONE</span>
                  </motion.span>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {logs.length === 0 && (
          <div className="text-zinc-700 animate-pulse italic">Initializing secure pipeline...</div>
        )}
      </div>
    </div>
  );
};
