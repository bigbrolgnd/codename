import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { themeEditorStore } from './theme-editor.store';

describe('useThemeEditorStore', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
    // Reset singleton state
    themeEditorStore.getState().reset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('initializes with default values', () => {
    const state = themeEditorStore.getState();
    expect(state.themeState.styles.light.primary).toBeDefined();
    expect(state.history).toHaveLength(0);
  });

  it('updates styles correctly with setStyleProperty', () => {
    act(() => {
      themeEditorStore.getState().setStyleProperty('light', 'primary', 'oklch(0.5 0.2 250)');
    });

    expect(themeEditorStore.getState().themeState.styles.light.primary).toBe('oklch(0.5 0.2 250)');
    
    // First change might be immediate or debounced depending on lastHistoryTimestamp
    // The current logic adds history if now - last > 500. On first call, last=0, so now-0 > 500 is true.
    expect(themeEditorStore.getState().history).toHaveLength(1);
  });

  it('debounces rapid changes into a single history entry', () => {
    act(() => {
      themeEditorStore.getState().setStyleProperty('light', 'primary', 'oklch(0.1 0 0)'); // History entry 1
      vi.advanceTimersByTime(200);
      themeEditorStore.getState().setStyleProperty('light', 'primary', 'oklch(0.2 0 0)'); // No history entry (within 500ms)
      vi.advanceTimersByTime(200);
      themeEditorStore.getState().setStyleProperty('light', 'primary', 'oklch(0.3 0 0)'); // No history entry (within 500ms)
    });
    
    expect(themeEditorStore.getState().history).toHaveLength(1);
    expect(themeEditorStore.getState().themeState.styles.light.primary).toBe('oklch(0.3 0 0)');
    
    act(() => {
      vi.advanceTimersByTime(200); // Total 600ms from first change
      themeEditorStore.getState().setStyleProperty('light', 'primary', 'oklch(0.4 0 0)'); // History entry 2
    });
    
    expect(themeEditorStore.getState().history).toHaveLength(2);
  });

  it('undoes and redoes changes correctly', () => {
    const originalPrimary = themeEditorStore.getState().themeState.styles.light.primary;
    
    act(() => {
      themeEditorStore.getState().setStyleProperty('light', 'primary', 'oklch(0.5 0.2 250)');
      vi.advanceTimersByTime(501);
    });
    
    expect(themeEditorStore.getState().themeState.styles.light.primary).toBe('oklch(0.5 0.2 250)');
    
    act(() => {
      themeEditorStore.getState().undo();
    });
    
    expect(themeEditorStore.getState().themeState.styles.light.primary).toBe(originalPrimary);
    
    act(() => {
      themeEditorStore.getState().redo();
    });
    
    expect(themeEditorStore.getState().themeState.styles.light.primary).toBe('oklch(0.5 0.2 250)');
  });
});

// Helper for store actions
function act(fn: () => void) {
  fn();
}
