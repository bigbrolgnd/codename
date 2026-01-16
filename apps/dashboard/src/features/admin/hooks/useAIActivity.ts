/**
 * useAIActivity Hook
 *
 * Wraps AI service calls to set activity state during AI operations.
 * Tracks AI vision extraction and content generation operations.
 */

import { useCallback } from 'react';
import { useSystemActivity } from '../components/SystemActivityContext';

/**
 * Hook to wrap AI operations with activity state tracking
 *
 * @example
 * ```tsx
 * const { mutateAsync: extract } = useExtractFromImage();
 * const { aiOperation } = useAIActivity();
 *
 * const handleExtract = async (imageUrl: string) => {
 *   await aiOperation(
 *     () => extract({ imageUrl, extractionType: 'logo' }),
 *     'Extracting business information from logo'
 *   );
 * };
 * ```
 */
export function useAIActivity() {
  const { setActivity } = useSystemActivity();

  /**
   * Wrap an AI operation with activity state tracking
   */
  const aiOperation = useCallback(
    async <T,>(
      operation: () => Promise<T>,
      message?: string
    ): Promise<T> => {
      try {
        // Set to active when operation starts
        setActivity('active', { type: 'ai', message: message || 'Processing AI operation' });

        // Execute the operation
        const result = await operation();

        // Set to success when complete
        setActivity('success', { type: 'ai', message: message || 'AI operation complete' });

        return result;
      } catch (error) {
        // Set to error on failure
        setActivity('error', {
          type: 'ai',
          message: `AI operation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        });
        throw error;
      }
    },
    [setActivity]
  );

  return { aiOperation };
}
