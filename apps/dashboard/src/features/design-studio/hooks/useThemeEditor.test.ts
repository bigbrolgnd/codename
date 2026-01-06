import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useThemeEditor } from './useThemeEditor';
import { useThemeEditorStore } from '../stores/theme-editor.store';

// Mock the hook
vi.mock('../stores/theme-editor.store', () => ({
  useThemeEditorStore: vi.fn(),
}));

describe('useThemeEditor', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
    (useThemeEditorStore as any).mockReturnValue({
      themeState: {
        currentMode: 'light',
        styles: { light: { primary: 'oklch(0 0 0)' }, dark: {} },
      },
      setStyleProperty: vi.fn(),
      history: [],
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('initializes and returns store state', () => {
    const { result } = renderHook(() => useThemeEditor());
    
    expect(result.current.themeState).toBeDefined();
    expect(typeof result.current.setStyleProperty).toBe('function');
  });

  it('updates state via actions', () => {
    const mockSetStyleProperty = vi.fn();
    (useThemeEditorStore as any).mockReturnValue({
      themeState: {
        currentMode: 'light',
        styles: { light: { primary: 'oklch(0 0 0)' }, dark: {} },
      },
      setStyleProperty: mockSetStyleProperty,
      history: [],
    });

    const { result } = renderHook(() => useThemeEditor());
    
    act(() => {
      result.current.setStyleProperty('light', 'primary', 'oklch(0.5 0.2 250)');
    });

    expect(mockSetStyleProperty).toHaveBeenCalledWith('light', 'primary', 'oklch(0.5 0.2 250)');
  });
});