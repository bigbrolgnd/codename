import { trpc } from '@/lib/trpc';
import { InsightSummary } from '@codename/api';

export function useInsights(tenantId: string) {
  const summaryQuery = trpc.admin.getPlainEnglishSummary.useQuery({ tenantId });
  
  const summaries: InsightSummary[] = summaryQuery.data || [
    {
      message: "Collecting data for your business...",
      trend: 'neutral',
    }
  ];

  const pixelStatus = {
    google: 'verified',
    meta: 'verified',
    lastChecked: new Date().toISOString(),
  };

  return {
    summaries,
    pixelStatus,
    isLoading: summaryQuery.isLoading,
  };
}