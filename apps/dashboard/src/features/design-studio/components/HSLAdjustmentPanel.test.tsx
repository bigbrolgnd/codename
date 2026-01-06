import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { HSLAdjustmentPanel } from './HSLAdjustmentPanel';
import { useThemeEditor } from '../hooks/useThemeEditor';

// Mock the hook
vi.mock('../hooks/useThemeEditor', () => ({
  useThemeEditor: vi.fn(),
}));

describe('HSLAdjustmentPanel', () => {
  const mockSetHSLAdjustments = vi.fn();
  const mockResetHSLAdjustments = vi.fn();
  
  const mockThemeState = {
    hslAdjustments: {
      hueShift: 0,
      saturationScale: 1,
      lightnessScale: 1,
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useThemeEditor as any).mockReturnValue({
      themeState: mockThemeState,
      setHSLAdjustments: mockSetHSLAdjustments,
      resetHSLAdjustments: mockResetHSLAdjustments,
    });
  });

  it('renders all adjustment controls', () => {
    render(<HSLAdjustmentPanel />);
    expect(screen.getByText('Hue Shift')).toBeDefined();
    expect(screen.getByText('Saturation')).toBeDefined();
    expect(screen.getByText('Lightness')).toBeDefined();
  });

  it('contains sliders for each adjustment', () => {
    render(<HSLAdjustmentPanel />);
    const sliders = screen.getAllByRole('slider');
    expect(sliders).toHaveLength(3);
  });

  it('renders preset buttons and they trigger setHSLAdjustments', () => {
    render(<HSLAdjustmentPanel />);
    const presetButton = screen.getByText('Warm');
    fireEvent.click(presetButton);
    
    expect(mockSetHSLAdjustments).toHaveBeenCalledWith(expect.objectContaining({
      hueShift: expect.any(Number),
    }));
  });
});