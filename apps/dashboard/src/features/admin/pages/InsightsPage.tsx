import React from 'react';
import { useInsights } from '../hooks/useInsights';
import { PlainEnglishSummary } from '../components/PlainEnglishSummary';
import { PixelStatusCard } from '../components/PixelStatusCard';
import { Loader2, BrainCircuit, BarChart3, PieChart } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendSparkline } from '../components/TrendSparkline';
import { ConversionFunnel } from '../components/ConversionFunnel';
import { BuyerHeatmap } from '../components/BuyerHeatmap';

export const InsightsPage: React.FC = () => {
  const { summaries, pixelStatus, isLoading } = useInsights('tenant_default');

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
        <p className="text-sm text-zinc-500 font-mono tracking-widest uppercase">Analyzing Data...</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8 pb-32">
      <div className="flex flex-col space-y-2">
        <div className="flex items-center gap-2 text-emerald-500">
          <BrainCircuit size={20} />
          <span className="text-[10px] uppercase font-black tracking-widest">Pocket Data Scientist</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-white font-serif">Plain English Insights</h1>
        <p className="text-zinc-500 text-sm">Actionable summaries of your business performance.</p>
      </div>

      <div className="grid gap-4">
        {summaries.map((summary, i) => (
          <PlainEnglishSummary key={i} summary={summary} />
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="bg-zinc-900/30 border-zinc-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold text-zinc-500 uppercase flex items-center gap-2">
              <BarChart3 size={14} /> 7-Day Visitor Trend
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 flex items-center justify-center min-h-[100px]">
            <TrendSparkline data={[120, 150, 110, 180, 240, 210, 300]} width={280} height={60} />
          </CardContent>
        </Card>

        <Card className="bg-zinc-900/30 border-zinc-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold text-zinc-500 uppercase flex items-center gap-2">
              <PieChart size={14} /> Conversion Funnel
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 px-8 flex items-center justify-center">
            <ConversionFunnel visitors={1240} bookings={148} />
          </CardContent>
        </Card>
      </div>

      <div className="pt-4">
        <BuyerHeatmap tenantId="tenant_default" />
      </div>

      <div className="pt-4">
        <PixelStatusCard 
          google={pixelStatus.google} 
          meta={pixelStatus.meta} 
        />
      </div>
    </div>
  );
};
