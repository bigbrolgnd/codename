import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Sparkles, TrendingUp, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { InsightSummary } from '@codename/api';

interface PlainEnglishSummaryProps {
  summary: InsightSummary;
}

export const PlainEnglishSummary: React.FC<PlainEnglishSummaryProps> = ({ summary }) => {
  return (
    <Card className="bg-zinc-900/50 border-zinc-800 hover:border-emerald-500/20 transition-all group overflow-hidden relative">
      <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500/20 group-hover:bg-emerald-500 transition-colors" />
      <CardContent className="p-5 flex items-start gap-4">
        <div className={cn(
          "p-2.5 rounded-xl shrink-0",
          summary.trend === 'positive' ? "bg-emerald-500/10 text-emerald-500" : "bg-zinc-800 text-zinc-500"
        )}>
          {summary.trend === 'positive' ? <Sparkles size={20} /> : <Minus size={20} />}
        </div>
        <div className="space-y-1 min-w-0">
          <p className="text-sm font-medium text-white leading-relaxed">
            {summary.message}
          </p>
          {summary.percentage && (
            <div className="flex items-center gap-1.5 text-emerald-500 font-mono text-[10px] font-bold uppercase tracking-widest">
              <TrendingUp size={12} /> +{summary.percentage}% Trend
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
