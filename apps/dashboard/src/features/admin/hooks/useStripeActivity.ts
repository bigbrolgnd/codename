/**
 * useStripeActivity Hook
 *
 * Wraps tRPC mutations to set activity state during Stripe operations.
 * Tracks Stripe payment and subscription operations with automatic activity state management.
 */

import { useCallback } from 'react';
import { useSystemActivity } from '../components/SystemActivityContext';

/**
 * Hook to wrap Stripe operations with activity state tracking
 *
 * @example
 * ```tsx
 * const { mutateAsync: subscribe } = useSubscribeAddon();
 * const { stripeOperation } = useStripeActivity();
 *
 * const handleSubscribe = async () => {
 *   await stripeOperation(
 *     () => subscribe({ addonId: 'ai-tokens' }),
 *     'Subscribing to AI tokens addon'
 *   );
 * };
 * ```
 */
export function useStripeActivity() {
  const { setActivity } = useSystemActivity();

  /**
   * Wrap a Stripe operation with activity state tracking
   */
  const stripeOperation = useCallback(
    async <T,>(
      operation: () => Promise<T>,
      message?: string
    ): Promise<T> => {
      try {
        // Set to active when operation starts
        setActivity('active', { type: 'stripe', message: message || 'Processing Stripe operation' });

        // Execute the operation
        const result = await operation();

        // Set to success when complete
        setActivity('success', { type: 'stripe', message: message || 'Stripe operation complete' });

        return result;
      } catch (error) {
        // Set to error on failure
        setActivity('error', {
          type: 'stripe',
          message: `Stripe operation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        });
        throw error;
      }
    },
    [setActivity]
  );

  return { stripeOperation };
}
