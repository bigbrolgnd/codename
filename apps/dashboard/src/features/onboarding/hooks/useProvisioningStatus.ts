import { useState, useEffect } from 'react';
import { trpc } from '@/lib/trpc';
import { ProvisioningStatusResponse, ProvisioningRequest } from '@codename/api';

/**
 * Hook to start the provisioning process
 */
export function useProvisioningMutation() {
  return trpc.provision.start.useMutation();
}

/**
 * Hook to track real-time provisioning status via polling
 */
export function useProvisioningStatus(provisioningId: string | null) {
  const [lastLogs, setLastLogs] = useState<any[]>([]);

  const query = trpc.provision.getStatus.useQuery(
    { provisioningId: provisioningId as string },
    {
      enabled: !!provisioningId,
      refetchInterval: (data) => {
        if (data?.status === 'complete' || data?.status === 'failed') {
          return false;
        }
        return 1000; // Poll every second
      },
      onSuccess: (data) => {
        if (data.logs) {
          setLastLogs(data.logs);
        }
      }
    }
  );

  return {
    status: query.data?.status,
    phase: query.data?.currentPhase || 'architecture',
    overallProgress: query.data?.overallProgress || 0,
    isComplete: query.data?.status === 'complete',
    error: query.data?.error,
    logs: lastLogs,
    siteUrl: query.data?.result?.siteUrl,
    isLoading: query.isLoading,
    refetch: query.refetch,
  };
}