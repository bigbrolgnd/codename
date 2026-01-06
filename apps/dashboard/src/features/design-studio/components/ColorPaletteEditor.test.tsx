import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { ColorPaletteEditor } from './ColorPaletteEditor';
import { useThemeEditor } from '../hooks/useThemeEditor';

// Mock the hook
vi.mock('../hooks/useThemeEditor', () => ({
  useThemeEditor: vi.fn(),
}));

describe('ColorPaletteEditor', () => {
  const mockSetStyleProperty = vi.fn();
  
  const mockThemeState = {
    styles: {
      light: {
        primary: 'oklch(0.5 0.2 250)',
        background: 'oklch(1 0 0)',
      },
      dark: {
        primary: 'oklch(0.9 0.1 250)',
        background: 'oklch(0.2 0 0)',
      },
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useThemeEditor as any).mockReturnValue({
      themeState: mockThemeState,
      setStyleProperty: mockSetStyleProperty,
    });
  });

  it('renders all color groups', () => {
    render(<ColorPaletteEditor mode="light" />);
    
    expect(screen.getByText('Base')).toBeDefined();
    expect(screen.getByText('Cards & Popovers')).toBeDefined();
    expect(screen.getByText('Primary & Secondary')).toBeDefined();
  });

  it('renders correct colors for the given mode', () => {
    render(<ColorPaletteEditor mode="light" />);
    
    // Check if light mode primary is rendered in the input
    const inputs = screen.getAllByRole('textbox');
    const primaryInput = inputs.find(i => (i as HTMLInputElement).value === 'oklch(0.5 0.2 250)');
    expect(primaryInput).toBeDefined();
  });

  it('triggers setStyleProperty when a color is changed', async () => {
    vi.useFakeTimers();
    render(<ColorPaletteEditor mode="light" />);
    
    const inputs = screen.getAllByRole('textbox');
    const primaryInput = inputs.find(i => (i as HTMLInputElement).value === 'oklch(0.5 0.2 250)');
    
    fireEvent.change(primaryInput!, { target: { value: 'oklch(0.6 0.2 250)' } });
    
    // Advance timers for debounce in ColorPicker
    act(() => {
      vi.advanceTimersByTime(150);
    });
    
    expect(mockSetStyleProperty).toHaveBeenCalledWith('light', 'primary', 'oklch(0.6 0.2 250)');
    vi.useRealTimers();
  });
});
