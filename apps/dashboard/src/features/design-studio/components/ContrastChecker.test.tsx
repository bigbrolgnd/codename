import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ContrastChecker } from './ContrastChecker';

describe('ContrastChecker', () => {
  const mockStyles = {
    background: 'oklch(1 0 0)', // White
    foreground: 'oklch(0 0 0)', // Black
    primary: 'oklch(0.5 0.2 250)',
    'primary-foreground': 'oklch(0.98 0 0)',
    card: 'oklch(1 0 0)',
    'card-foreground': 'oklch(0.1 0 0)',
    popover: 'oklch(1 0 0)',
    'popover-foreground': 'oklch(0.1 0 0)',
    secondary: 'oklch(0.9 0 0)',
    'secondary-foreground': 'oklch(0.1 0 0)',
    muted: 'oklch(0.95 0 0)',
    'muted-foreground': 'oklch(0.4 0 0)',
    accent: 'oklch(0.95 0 0)',
    'accent-foreground': 'oklch(0.1 0 0)',
    destructive: 'oklch(0.5 0.2 25)',
    'destructive-foreground': 'oklch(0.98 0 0)',
    border: 'oklch(0.9 0 0)',
    input: 'oklch(0.9 0 0)',
    ring: 'oklch(0.5 0.2 250)',
    'font-sans': 'inter',
    'font-serif': 'serif',
    'font-mono': 'mono',
    'letter-spacing': '0',
    radius: '0.5rem',
    'shadow-color': 'black',
    'shadow-opacity': '0.1',
    'shadow-blur': '4px',
    'shadow-spread': '0',
    'shadow-offset-x': '0',
    'shadow-offset-y': '2px',
    'chart-1': 'red',
    'chart-2': 'blue',
    'chart-3': 'green',
    'chart-4': 'yellow',
    'chart-5': 'orange',
  };

  it('renders the trigger button with "Contrast OK" when all pass', () => {
    render(<ContrastChecker styles={mockStyles} />);
    expect(screen.getByText('Contrast OK')).toBeDefined();
  });

  it('renders issues count when contrast fails', () => {
    const failingStyles = {
      ...mockStyles,
      foreground: 'oklch(0.9 0 0)', // Very light grey on white background
    };
    render(<ContrastChecker styles={failingStyles} />);
    // Should show at least 1 issue (Background / Text)
    expect(screen.getByText(/Issue/)).toBeDefined();
  });

  it('opens the dialog when clicked', async () => {
    render(<ContrastChecker styles={mockStyles} />);
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    expect(screen.getByText('Accessibility Contrast Check')).toBeDefined();
    expect(screen.getByText('Background / Text')).toBeDefined();
  });
});
