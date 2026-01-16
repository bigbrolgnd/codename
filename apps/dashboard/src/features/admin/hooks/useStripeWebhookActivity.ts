/**
 * useStripeWebhookActivity Hook
 *
 * Polls for recent Stripe webhook events every 10 seconds.
 * Triggers activity state based on new webhook events detected.
 *
 * Polling Strategy:
 * - Poll frequency: Every 10 seconds
 * - Fetch last 10 webhook events from stripe_webhook_events table
 * - Compare timestamps with last poll to detect new events
 * - Trigger activity state based on new event types
 * - Fallback: If webhook missed, no pulse (acceptable - not critical)
 */

import { useEffect, useRef, useCallback } from 'react';
import { useSystemActivity } from '../components/SystemActivityContext';
import { api } from '@/utils/api';

interface StripeWebhookEvent {
  id: string;
  event_type: string;
  event_id: string;
  tenant_id?: string;
  processed_at: string;
}

interface UseStripeWebhookActivityOptions {
  /**
   * Polling interval in milliseconds (default: 10000 = 10 seconds)
   */
  pollInterval?: number;

  /**
   * Number of recent events to fetch (default: 10)
   */
  eventLimit?: number;

  /**
   * Maximum number of event IDs to track (default: 1000)
   * Prevents unbounded memory growth in long-running sessions
   */
  maxTrackedEvents?: number;

  /**
   * Enable/disable polling (default: true)
   */
  enabled?: boolean;
}

/**
 * Hook to poll Stripe webhook events and trigger activity state
 *
 * @example
 * ```tsx
 * function Dashboard() {
 *   useStripeWebhookActivity({
 *     pollInterval: 10000,  // 10 seconds
 *     eventLimit: 10,
 *     maxTrackedEvents: 1000,
 *     enabled: true
 *   });
 *   // ...
 * }
 * ```
 */
export function useStripeWebhookActivity({
  pollInterval = 10000,
  eventLimit = 10,
  maxTrackedEvents = 1000,
  enabled = true,
}: UseStripeWebhookActivityOptions = {}) {
  const { setActivity } = useSystemActivity();
  const lastProcessedEventsRef = useRef<Set<string>>(new Set());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const errorCountRef = useRef(0);
  const MAX_CONSECUTIVE_ERRORS = 3;

  /**
   * Trim the tracked events set to prevent unbounded memory growth
   * Removes oldest entries when size exceeds maxTrackedEvents
   */
  const trimTrackedEvents = useCallback(() => {
    if (lastProcessedEventsRef.current.size > maxTrackedEvents) {
      const entries = Array.from(lastProcessedEventsRef.current);
      const keepEntries = entries.slice(-maxTrackedEvents);
      lastProcessedEventsRef.current = new Set(keepEntries);
    }
  }, [maxTrackedEvents]);

  /**
   * Fetch recent Stripe webhook events from the API
   */
  const fetchRecentWebhookEvents = useCallback(async (): Promise<StripeWebhookEvent[]> => {
    try {
      const result = await api.activity.getRecentStripeEvents.query({
        limit: eventLimit,
      });
      // Reset error count on success
      errorCountRef.current = 0;
      return result.events as StripeWebhookEvent[];
    } catch (error) {
      errorCountRef.current++;
      console.error('[useStripeWebhookActivity] Failed to fetch webhook events:', error);

      // Disable polling after too many consecutive errors
      if (errorCountRef.current >= MAX_CONSECUTIVE_ERRORS) {
        console.warn('[useStripeWebhookActivity] Too many consecutive errors, disabling polling');
        setActivity('error', {
          type: 'webhook',
          message: `Webhook polling failed after ${MAX_CONSECUTIVE_ERRORS} attempts`
        });
      }

      return [];
    }
  }, [eventLimit, setActivity]);

  /**
   * Process webhook events and trigger activity state
   */
  const processWebhookEvents = useCallback((events: StripeWebhookEvent[]) => {
    const newEvents = events.filter(event => !lastProcessedEventsRef.current.has(event.event_id));

    if (newEvents.length === 0) {
      return;
    }

    // Mark events as processed
    newEvents.forEach(event => {
      lastProcessedEventsRef.current.add(event.event_id);
    });

    // Trim tracked events to prevent unbounded growth
    trimTrackedEvents();

    // Trigger activity state based on event types
    const paymentSuccessEvents = newEvents.filter(e =>
      e.event_type === 'payment_intent.succeeded' ||
      e.event_type === 'invoice.paid'
    );

    const paymentFailureEvents = newEvents.filter(e =>
      e.event_type === 'invoice.payment_failed' ||
      e.event_type === 'payment_intent.failed'
    );

    const subscriptionEvents = newEvents.filter(e =>
      e.event_type === 'customer.subscription.created' ||
      e.event_type === 'customer.subscription.updated' ||
      e.event_type === 'customer.subscription.deleted'
    );

    // Priority: error > success > active
    if (paymentFailureEvents.length > 0) {
      setActivity('error', {
        type: 'webhook',
        message: `${paymentFailureEvents.length} payment(s) failed`
      });
    } else if (paymentSuccessEvents.length > 0) {
      setActivity('success', {
        type: 'webhook',
        message: `${paymentSuccessEvents.length} payment(s) succeeded`
      });
    } else if (subscriptionEvents.length > 0) {
      setActivity('active', {
        type: 'webhook',
        message: `Subscription ${subscriptionEvents[0].event_type.split('.')[2]}`
      });
    }
  }, [setActivity, trimTrackedEvents]);

  /**
   * Poll for webhook events
   */
  const poll = useCallback(async () => {
    if (errorCountRef.current >= MAX_CONSECUTIVE_ERRORS) {
      // Skip polling if we've exceeded max errors
      return;
    }

    const events = await fetchRecentWebhookEvents();
    processWebhookEvents(events);
  }, [fetchRecentWebhookEvents, processWebhookEvents]);

  // Set up polling interval
  useEffect(() => {
    if (!enabled) {
      return;
    }

    // Initial poll
    poll();

    // Set up interval
    intervalRef.current = setInterval(poll, pollInterval);

    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, pollInterval, poll]);

  return {
    /**
     * Manually trigger a poll (useful for testing or immediate updates)
     */
    poll,

    /**
     * Get the count of processed events (useful for debugging)
     */
    getProcessedEventCount: () => lastProcessedEventsRef.current.size,
  };
}
