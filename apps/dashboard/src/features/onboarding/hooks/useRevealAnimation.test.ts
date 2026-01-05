import { renderHook, act } from '@testing-library/react';
import { useRevealAnimation } from './useRevealAnimation';
import { describe, it, expect, vi } from 'vitest';

describe('useRevealAnimation', () => {
  it('initializes with architecture phase', () => {
    const { result } = renderHook(() => useRevealAnimation({ durationMs: 1000 }));
    expect(result.current.currentPhase).toBe('architecture');
    expect(result.current.overallProgress).toBe(0);
  });

  it('progresses through phases automatically', async () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useRevealAnimation({ durationMs: 400 }));
    
    // Start animation if it doesn't start automatically
    // Assuming it starts automatically on mount or via a start function
    
    // Move to intelligence
    await act(async () => {
      vi.advanceTimersByTime(100);
    });
    expect(result.current.currentPhase).toBe('intelligence');
    
    // Move to security
    await act(async () => {
      vi.advanceTimersByTime(100);
    });
    expect(result.current.currentPhase).toBe('security');
    
    // Move to launch
    await act(async () => {
      vi.advanceTimersByTime(100);
    });
    expect(result.current.currentPhase).toBe('launch');
    
    // Complete
    await act(async () => {
      vi.advanceTimersByTime(100);
    });
    expect(result.current.isComplete).toBe(true);
    
    vi.useRealTimers();
  });
});
