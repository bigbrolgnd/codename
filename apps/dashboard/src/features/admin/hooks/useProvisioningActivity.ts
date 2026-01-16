/**
 * useProvisioningActivity Hook
 *
 * Wraps provisioning operations to set activity state during site deployments.
 * Tracks site deployment and domain update operations.
 */

import { useCallback } from 'react';
import { useSystemActivity } from '../components/SystemActivityContext';

/**
 * Hook to wrap provisioning operations with activity state tracking
 *
 * @example
 * ```tsx
 * const { mutateAsync: provision } = useProvisionSite();
 * const { provisioningOperation } = useProvisioningActivity();
 *
 * const handleProvision = async (siteId: string) => {
 *   await provisioningOperation(
 *     () => provision({ siteId }),
 *     'Provisioning site container'
 *   );
 * };
 * ```
 */
export function useProvisioningActivity() {
  const { setActivity } = useSystemActivity();

  /**
   * Wrap a provisioning operation with activity state tracking
   */
  const provisioningOperation = useCallback(
    async <T,>(
      operation: () => Promise<T>,
      message?: string
    ): Promise<T> => {
      try {
        // Set to active when operation starts
        setActivity('active', { type: 'provisioning', message: message || 'Provisioning resources' });

        // Execute the operation
        const result = await operation();

        // Set to success when complete
        setActivity('success', { type: 'provisioning', message: message || 'Provisioning complete' });

        return result;
      } catch (error) {
        // Set to error on failure
        setActivity('error', {
          type: 'provisioning',
          message: `Provisioning failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        });
        throw error;
      }
    },
    [setActivity]
  );

  return { provisioningOperation };
}
