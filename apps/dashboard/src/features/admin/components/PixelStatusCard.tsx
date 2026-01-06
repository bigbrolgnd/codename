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
    <Card className="bg-zinc-950 border-emerald-500/10 shadow-[0_0_20px_rgba(16,185,129,0.05)]">
      <CardHeader className="pb-3 border-b border-zinc-900">
        <CardTitle className="text-xs font-black tracking-[0.2em] text-zinc-500 uppercase flex items-center gap-2">
          <ShieldCheck size={14} className="text-emerald-500" /> Pixel Verification
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-sm font-bold text-white">Google Tag</span>
            <span className="text-[10px] text-zinc-500">Global Site Tag active</span>
          </div>
          <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 capitalize font-mono text-[10px]">
            {google}
          </Badge>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-sm font-bold text-white">Meta Pixel</span>
            <span className="text-[10px] text-zinc-500">Facebook tracking active</span>
          </div>
          <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 capitalize font-mono text-[10px]">
            {meta}
          </Badge>
        </div>

        <div className="p-3 bg-zinc-900/50 rounded-lg flex items-start gap-2 border border-zinc-800">
          <Info size={14} className="text-zinc-600 mt-0.5 shrink-0" />
          <p className="text-[10px] text-zinc-500 leading-tight">
            Your tracking pixels are automatically verified daily to ensure your conversion data remains accurate.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
