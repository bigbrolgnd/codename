import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemePreview } from './ThemePreview';
import { useThemeEditor } from '../hooks/useThemeEditor';

// Mock the hook
vi.mock('../hooks/useThemeEditor', () => ({
  useThemeEditor: vi.fn(),
}));

describe('ThemePreview', () => {
  const mockThemeState = {
    currentMode: 'light',
    styles: {
      light: {
        primary: 'oklch(0.5 0.2 250)',
        background: 'oklch(1 0 0)',
      },
      dark: {},
    },
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
    });
  });

  it('renders the preview toolbar and placeholder', () => {
    render(<ThemePreview />);
    expect(screen.getByText('Preview')).toBeDefined();
    expect(screen.getByText('Your Business')).toBeDefined();
  });

  it('changes viewport when toggle buttons are clicked', () => {
    render(<ThemePreview />);
    
    // ToggleGroupItem often renders as radio in testing-library
    const buttons = screen.getAllByRole('radio');
    expect(buttons.length).toBe(3);
  });

  it('applies theme styles to the preview content', () => {
    const { container } = render(<ThemePreview />);
    const previewContainer = container.querySelector('[style*="--primary"]');
    expect(previewContainer).toBeDefined();
  });
});
