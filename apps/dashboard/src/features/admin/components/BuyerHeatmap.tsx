import React from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Loader2, Globe } from 'lucide-react';

interface BuyerHeatmapProps {
  tenantId: string;
}

export const BuyerHeatmap: React.FC<BuyerHeatmapProps> = ({ tenantId }) => {
  const heatmapQuery = trpc.admin.getBuyerHeatmap.useQuery({ tenantId });

  if (heatmapQuery.isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
        <p className="text-xs text-zinc-500 font-mono tracking-widest uppercase">Mapping Buyers...</p>
      </div>
    );
  }

  const items = heatmapQuery.data || [];

  return (
    <Card className="bg-zinc-950 border-zinc-800 overflow-hidden">
      <CardHeader className="pb-3 border-b border-zinc-900">
        <CardTitle className="text-xs font-black tracking-[0.2em] text-zinc-500 uppercase flex items-center gap-2">
          <MapPin size={14} className="text-emerald-500" /> Top Buyer Hotspots
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-6">
        {items.length === 0 ? (
          <div className="py-12 text-center text-zinc-600 italic text-sm">
            Insufficient location data to generate heatmap.
          </div>
        ) : (
          <div className="space-y-5">
            {items.map((item, i) => (
              <div key={i} className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className={i === 0 ? "text-emerald-500" : "text-zinc-400"}>
                      <Globe size={12} />
                    </span>
                    <span className="font-bold text-white">{item.location}</span>
                    {i === 0 && (
                      <span className="bg-emerald-500/10 text-emerald-500 px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter">
                        Primary
                      </span>
                    )}
                  </div>
                  <span className="font-mono text-zinc-500">{item.count} hits</span>
                </div>
                <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-500 transition-all duration-1000" 
                    style={{ 
                      width: `${item.percentage}%`,
                      opacity: 1 - (i * 0.15) // Gradient of intensity
                    }} 
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="pt-2 border-t border-zinc-900">
           <p className="text-[9px] text-zinc-600 uppercase font-black tracking-widest leading-tight">
             Privacy Protected • Aggregated at City Level
           </p>
        </div>
      </CardContent>
    </Card>
  );
};
