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
    <div className="flex items-center justify-between w-full p-4 bg-zinc-950/50 backdrop-blur-md border-b border-zinc-800 sticky top-0 z-30">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
          <span className="text-xs font-mono font-bold tracking-widest text-emerald-500 uppercase">System Armed</span>
        </div>
        
        <div className="hidden md:flex items-center gap-8">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-tighter text-zinc-500 font-bold">Revenue</span>
            <span className="text-sm font-mono font-bold text-white">${(metrics.revenue / 100).toLocaleString()}</span>
          </div>
          <div className="flex flex-col border-l border-zinc-800 pl-8">
            <span className="text-[10px] uppercase tracking-tighter text-zinc-500 font-bold">Bookings</span>
            <span className="text-sm font-mono font-bold text-white">{metrics.bookings}</span>
          </div>
          <div className="flex flex-col border-l border-zinc-800 pl-8">
            <span className="text-[10px] uppercase tracking-tighter text-zinc-500 font-bold">Visitors</span>
            <span className="text-sm font-mono font-bold text-white">{metrics.visitors.toLocaleString()}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Badge variant="outline" className="border-zinc-800 text-zinc-400 gap-1 bg-zinc-900">
          <TrendingUp size={12} className="text-emerald-500" /> +12% 
        </Badge>
        <div className="h-8 w-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs font-bold text-zinc-400">
          JD
        </div>
      </div>
    </div>
  );
};
