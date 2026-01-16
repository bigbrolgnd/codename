/**
 * SystemActivityContext Tests
 *
 * Test coverage for:
 * - State transitions (idle → active → processing → success → idle)
 * - Timeout logic (5 seconds idle return, 3 seconds error return)
 * - setActivity action functionality
 * - useSystemActivity hook behavior
 * - Per-user state isolation
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { ReactNode } from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  SystemActivityProvider,
  useSystemActivity,
  SystemActivityState,
  ActivityLevel
} from './SystemActivityContext';

describe('SystemActivityContext', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const wrapper = ({ children }: { children: ReactNode }) => (
    <SystemActivityProvider>{children}</SystemActivityProvider>
  );

  describe('Initial State', () => {
    it('should start with idle state and no metadata', () => {
      const { result } = renderHook(() => useSystemActivity(), { wrapper });

      expect(result.current.state.level).toBe('idle');
      expect(result.current.state.lastActivityTime).toBeGreaterThan(0);
      expect(result.current.state.metadata).toBeUndefined();
    });
  });

  describe('State Transitions', () => {
    it('should transition from idle to active when setActivity is called', () => {
      const { result } = renderHook(() => useSystemActivity(), { wrapper });

      act(() => {
        result.current.setActivity('active', { type: 'stripe', message: 'Processing payment' });
      });

      expect(result.current.state.level).toBe('active');
      expect(result.current.state.metadata?.type).toBe('stripe');
      expect(result.current.state.metadata?.message).toBe('Processing payment');
    });

    it('should transition from active to processing', () => {
      const { result } = renderHook(() => useSystemActivity(), { wrapper });

      act(() => {
        result.current.setActivity('active');
      });

      act(() => {
        result.current.setActivity('processing', { type: 'ai' });
      });

      expect(result.current.state.level).toBe('processing');
    });

    it('should transition from processing to success', () => {
      const { result } = renderHook(() => useSystemActivity(), { wrapper });

      act(() => {
        result.current.setActivity('processing');
      });

      act(() => {
        result.current.setActivity('success', { type: 'provisioning' });
      });

      expect(result.current.state.level).toBe('success');
    });

    it('should transition to error state', () => {
      const { result } = renderHook(() => useSystemActivity(), { wrapper });

      act(() => {
        result.current.setActivity('error', { type: 'stripe', message: 'Payment failed' });
      });

      expect(result.current.state.level).toBe('error');
      expect(result.current.state.metadata?.message).toBe('Payment failed');
    });
  });

  describe('Timeout Logic - Idle Return (5 seconds)', () => {
    it('should return to idle after 5 seconds of no activity', async () => {
      const { result } = renderHook(() => useSystemActivity(), { wrapper });

      // Set to active
      act(() => {
        result.current.setActivity('active');
      });

      expect(result.current.state.level).toBe('active');

      // Fast-forward 4 seconds - should still be active
      act(() => {
        vi.advanceTimersByTime(4000);
      });

      expect(result.current.state.level).toBe('active');

      // Fast-forward 1 more second (total 5 seconds) - should return to idle
      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(result.current.state.level).toBe('idle');
    });

    it('should extend idle timeout when new activity occurs', () => {
      const { result } = renderHook(() => useSystemActivity(), { wrapper });

      // Set to active
      act(() => {
        result.current.setActivity('active');
      });

      // Advance 3 seconds
      act(() => {
        vi.advanceTimersByTime(3000);
      });

      expect(result.current.state.level).toBe('active');

      // Set to active again (extends timeout)
      act(() => {
        result.current.setActivity('active');
      });

      // Advance 3 more seconds (total 6 seconds from first, 3 from second)
      act(() => {
        vi.advanceTimersByTime(3000);
      });

      // Should still be active because timeout was reset
      expect(result.current.state.level).toBe('active');

      // Advance 2 more seconds (total 5 seconds from last activity)
      act(() => {
        vi.advanceTimersByTime(2000);
      });

      expect(result.current.state.level).toBe('idle');
    });

    it('should not timeout success state - should return to idle immediately after burst', () => {
      const { result } = renderHook(() => useSystemActivity(), { wrapper });

      act(() => {
        result.current.setActivity('success');
      });

      expect(result.current.state.level).toBe('success');

      // Success state should return to idle quickly (burst effect)
      act(() => {
        vi.advanceTimersByTime(100);
      });

      expect(result.current.state.level).toBe('idle');
    });
  });

  describe('Timeout Logic - Error Return (3 seconds)', () => {
    it('should return to idle after 3 seconds in error state', () => {
      const { result } = renderHook(() => useSystemActivity(), { wrapper });

      act(() => {
        result.current.setActivity('error', { type: 'stripe' });
      });

      expect(result.current.state.level).toBe('error');

      // Fast-forward 2 seconds - should still be error
      act(() => {
        vi.advanceTimersByTime(2000);
      });

      expect(result.current.state.level).toBe('error');

      // Fast-forward 1 more second (total 3 seconds)
      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(result.current.state.level).toBe('idle');
    });
  });

  describe('Multiple Events Within Timeout', () => {
    it('should handle multiple rapid events correctly', () => {
      const { result } = renderHook(() => useSystemActivity(), { wrapper });

      // Set to active
      act(() => {
        result.current.setActivity('active', { type: 'stripe' });
      });

      // Advance 2 seconds
      act(() => {
        vi.advanceTimersByTime(2000);
      });

      // Set to processing (extends timeout)
      act(() => {
        result.current.setActivity('processing', { type: 'ai' });
      });

      // Advance 2 more seconds
      act(() => {
        vi.advanceTimersByTime(2000);
      });

      // Should still be processing (4 seconds from first, 2 from second)
      expect(result.current.state.level).toBe('processing');

      // Advance 3 more seconds (5 seconds from last activity)
      act(() => {
        vi.advanceTimersByTime(3000);
      });

      expect(result.current.state.level).toBe('idle');
    });
  });

  describe('Metadata Tracking', () => {
    it('should update metadata with each state change', () => {
      const { result } = renderHook(() => useSystemActivity(), { wrapper });

      act(() => {
        result.current.setActivity('active', { type: 'stripe', message: 'Payment started' });
      });

      expect(result.current.state.metadata).toEqual({
        type: 'stripe',
        message: 'Payment started'
      });

      act(() => {
        result.current.setActivity('success', { type: 'stripe', message: 'Payment complete' });
      });

      expect(result.current.state.metadata).toEqual({
        type: 'stripe',
        message: 'Payment complete'
      });
    });

    it('should allow metadata to be optional', () => {
      const { result } = renderHook(() => useSystemActivity(), { wrapper });

      act(() => {
        result.current.setActivity('active');
      });

      expect(result.current.state.metadata).toBeUndefined();
    });
  });

  describe('Per-User State Isolation', () => {
    it('should maintain separate state for each provider instance', () => {
      const wrapper1 = ({ children }: { children: ReactNode }) => (
        <SystemActivityProvider>{children}</SystemActivityProvider>
      );

      const wrapper2 = ({ children }: { children: ReactNode }) => (
        <SystemActivityProvider>{children}</SystemActivityProvider>
      );

      const { result: result1 } = renderHook(() => useSystemActivity(), { wrapper: wrapper1 });
      const { result: result2 } = renderHook(() => useSystemActivity(), { wrapper: wrapper2 });

      // Set different states in each context
      act(() => {
        result1.current.setActivity('active', { type: 'stripe' });
      });

      act(() => {
        result2.current.setActivity('error', { type: 'ai' });
      });

      // Each context should have its own state
      expect(result1.current.state.level).toBe('active');
      expect(result1.current.state.metadata?.type).toBe('stripe');

      expect(result2.current.state.level).toBe('error');
      expect(result2.current.state.metadata?.type).toBe('ai');
    });
  });

  describe('Last Activity Time Tracking', () => {
    it('should update lastActivityTime on each state change', () => {
      const { result } = renderHook(() => useSystemActivity(), { wrapper });

      const initialTime = result.current.state.lastActivityTime;

      // Wait a bit then change state
      act(() => {
        vi.advanceTimersByTime(100);
      });

      act(() => {
        result.current.setActivity('active');
      });

      expect(result.current.state.lastActivityTime).toBeGreaterThan(initialTime);
    });
  });
});
