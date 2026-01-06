import React from 'react';
import { Users, BookOpenCheck } from 'lucide-react';

interface ConversionFunnelProps {
  visitors: number;
  bookings: number;
}

export const ConversionFunnel: React.FC<ConversionFunnelProps> = ({ visitors, bookings }) => {
  const rate = visitors > 0 ? Math.round((bookings / visitors) * 100) : 0;

  return (
    <div className="space-y-6 w-full max-w-sm mx-auto">
      {/* Funnel Visualization */}
      <div className="relative space-y-1">
        {/* Top: Visitors */}
        <div className="h-12 bg-zinc-900 border border-zinc-800 rounded-t-3xl rounded-b-lg flex items-center justify-center relative overflow-hidden">
           <div className="absolute inset-0 bg-zinc-800/30" />
           <div className="z-10 flex items-center gap-2">
             <Users size={14} className="text-zinc-500" />
             <span className="text-xs font-bold text-zinc-400">{visitors.toLocaleString()} Lookers</span>
           </div>
        </div>

        {/* Transition Arrows */}
        <div className="flex justify-center -my-1 text-zinc-800">
           <div className="w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[8px] border-t-zinc-800" />
        </div>

        {/* Bottom: Bookings */}
        <div className="h-10 bg-emerald-500/10 border border-emerald-500/20 rounded-b-3xl rounded-t-lg flex items-center justify-center relative group">
           <div className="absolute inset-0 bg-emerald-500/5 group-hover:bg-emerald-500/10 transition-colors" />
           <div className="z-10 flex items-center gap-2">
             <BookOpenCheck size={14} className="text-emerald-500" />
             <span className="text-xs font-bold text-emerald-500">{bookings.toLocaleString()} Bookers</span>
           </div>
        </div>

        {/* Conversion Badge */}
        <div className="absolute -right-2 top-1/2 -translate-y-1/2 translate-x-full pl-4 flex flex-col items-center">
           <div className="h-10 w-10 rounded-full border-2 border-emerald-500 flex items-center justify-center bg-zinc-950 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
              <span className="text-xs font-black text-emerald-500">{rate}%</span>
           </div>
           <span className="text-[8px] uppercase font-bold text-zinc-600 mt-1">Rate</span>
        </div>
      </div>
    </div>
  );
};
