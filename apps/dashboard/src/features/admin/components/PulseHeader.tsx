import React from 'react';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Users, Calendar as CalendarIcon } from 'lucide-react';

interface PulseHeaderProps {
  metrics: {
    revenue: number;
    bookings: number;
    visitors: number;
  };
}

export const PulseHeader: React.FC<PulseHeaderProps> = ({ metrics }) => {
  return (
    <div className="flex items-center justify-between w-full p-4 glass-frosted border-b border-white/5 sticky top-0 z-30">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-violet-500 animate-pulse shadow-[0_0_12px_rgba(139,92,246,0.8)]" />
          <span className="text-xs font-mono font-bold tracking-widest text-violet-400 uppercase">System Armed</span>
        </div>

        <div className="hidden md:flex items-center gap-8">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-tighter text-zinc-500 font-bold">Revenue</span>
            <span className="text-sm font-mono font-bold text-white">${(metrics.revenue / 100).toLocaleString()}</span>
          </div>
          <div className="flex flex-col border-l border-white/10 pl-8">
            <span className="text-[10px] uppercase tracking-tighter text-zinc-500 font-bold">Bookings</span>
            <span className="text-sm font-mono font-bold text-white">{metrics.bookings}</span>
          </div>
          <div className="flex flex-col border-l border-white/10 pl-8">
            <span className="text-[10px] uppercase tracking-tighter text-zinc-500 font-bold">Visitors</span>
            <span className="text-sm font-mono font-bold text-white">{metrics.visitors.toLocaleString()}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="glass-card px-3 py-1.5 flex items-center gap-1.5">
          <TrendingUp size={12} className="text-violet-400" />
          <span className="text-xs font-bold text-zinc-300">+12%</span>
        </div>
        <div className="h-8 w-8 rounded-full glass-panel flex items-center justify-center text-xs font-bold text-zinc-300 ring-2 ring-violet-500/30">
          JD
        </div>
      </div>
    </div>
  );
};
