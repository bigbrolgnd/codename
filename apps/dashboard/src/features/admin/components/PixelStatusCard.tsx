import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck, Info } from 'lucide-react';

interface PixelStatusCardProps {
  google: string;
  meta: string;
}

export const PixelStatusCard: React.FC<PixelStatusCardProps> = ({ google, meta }) => {
  return (
    <Card className="glass-card glow-soft">
      <CardHeader className="pb-3 border-b border-white/5">
        <CardTitle className="text-xs font-black tracking-[0.2em] text-zinc-400 uppercase flex items-center gap-2">
          <ShieldCheck size={14} className="text-violet-400" /> Pixel Verification
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-4 relative z-10">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-sm font-bold text-white">Google Tag</span>
            <span className="text-[10px] text-zinc-400">Global Site Tag active</span>
          </div>
          <div className="glass-panel px-2.5 py-1 rounded-lg">
            <span className="text-xs font-mono font-bold text-violet-400">
              {google}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-sm font-bold text-white">Meta Pixel</span>
            <span className="text-[10px] text-zinc-400">Facebook tracking active</span>
          </div>
          <div className="glass-panel px-2.5 py-1 rounded-lg">
            <span className="text-xs font-mono font-bold text-violet-400">
              {meta}
            </span>
          </div>
        </div>

        <div className="p-3 glass-frosted rounded-lg flex items-start gap-2">
          <Info size={14} className="text-violet-400 mt-0.5 shrink-0" />
          <p className="text-[10px] text-zinc-300 leading-tight">
            Your tracking pixels are automatically verified daily to ensure your conversion data remains accurate.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
