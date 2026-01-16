/**
 * SystemActivityContext
 *
 * Activity state provider with timeout logic for Tesla Storm Status Indicator.
 * Manages per-user system activity state with automatic timeout to idle.
 *
 * States:
 * - idle: No activity (0.008 strike probability)
 * - active: Background task running (0.05 strike probability)
 * - processing: Intensive operation (0.1 strike probability)
 * - success: Task completed successfully (burst of strikes, then idle)
 * - error: Task failed (0.2 strike probability, red color scheme)
 *
 * Timeouts:
 * - 5 seconds of no activity → return to idle
 * - 3 seconds in error state → return to idle
 * - success state → return to idle immediately (burst effect)
 */

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';

// ============================================================================
// Types
// ============================================================================

export type ActivityLevel = 'idle' | 'active' | 'processing' | 'success' | 'error';

export interface SystemActivityState {
  level: ActivityLevel;
  lastActivityTime: number; // timestamp in milliseconds
  metadata?: {
    type?: 'stripe' | 'ai' | 'provisioning' | 'webhook';
    message?: string;
  };
}

export interface SystemActivityContextValue {
  state: SystemActivityState;
  setActivity: (level: ActivityLevel, metadata?: SystemActivityState['metadata']) => void;
}

// ============================================================================
// Context
// ============================================================================

const SystemActivityContext = createContext<SystemActivityContextValue | undefined>(undefined);

// ============================================================================
// Provider
// ============================================================================

interface SystemActivityProviderProps {
  children: ReactNode;
}

export const IDLE_TIMEOUT_MS = 5000; // 5 seconds
export const ERROR_TIMEOUT_MS = 3000; // 3 seconds
export const SUCCESS_TIMEOUT_MS = 100; // Very short burst effect

export function SystemActivityProvider({ children }: SystemActivityProviderProps) {
  const [state, setState] = useState<SystemActivityState>({
    level: 'idle',
    lastActivityTime: Date.now(),
  });

  // Timeout logic for returning to idle
  useEffect(() => {
    if (state.level === 'idle') {
      return; // No timeout needed when already idle
    }

    let timeoutMs: number;

    if (state.level === 'error') {
      timeoutMs = ERROR_TIMEOUT_MS;
    } else if (state.level === 'success') {
      timeoutMs = SUCCESS_TIMEOUT_MS;
    } else {
      // active, processing
      timeoutMs = IDLE_TIMEOUT_MS;
    }

    const timeoutId = setTimeout(() => {
      setState(prev => ({
        ...prev,
        level: 'idle',
        metadata: undefined,
      }));
    }, timeoutMs);

    return () => clearTimeout(timeoutId);
  }, [state.level, state.lastActivityTime]);

  // setActivity callback
  const setActivity = useCallback((
    level: ActivityLevel,
    metadata?: SystemActivityState['metadata']
  ) => {
    setState({
      level,
      lastActivityTime: Date.now(),
      metadata,
    });
  }, []);

  const value: SystemActivityContextValue = {
    state,
    setActivity,
  };

  return (
    <SystemActivityContext.Provider value={value}>
      {children}
    </SystemActivityContext.Provider>
  );
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Hook to access system activity state and dispatch actions.
 *
 * @example
 * ```tsx
 * const { state, setActivity } = useSystemActivity();
 *
 * // Set activity state
 * setActivity('active', { type: 'stripe', message: 'Processing payment' });
 *
 * // Check current state
 * console.log(state.level); // 'active'
 * ```
 */
export function useSystemActivity(): SystemActivityContextValue {
  const context = useContext(SystemActivityContext);

  if (!context) {
    throw new Error('useSystemActivity must be used within SystemActivityProvider');
  }

  return context;
}
