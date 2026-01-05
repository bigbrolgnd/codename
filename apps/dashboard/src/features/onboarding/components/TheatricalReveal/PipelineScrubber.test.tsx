import React from 'react';
import { render, screen } from '@testing-library/react';
import { PipelineScrubber } from './PipelineScrubber';
import { describe, it, expect, vi } from 'vitest';

// Mock Framer Motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}));

// Mock Lucide icons
vi.mock('lucide-react', () => ({
  Check: () => <svg data-testid="icon-check" />,
  Brain: () => <svg data-testid="icon-brain" />,
  Shield: () => <svg data-testid="icon-shield" />,
  Rocket: () => <svg data-testid="icon-rocket" />,
  Grid3X3: () => <svg data-testid="icon-grid" />,
}));

describe('PipelineScrubber', () => {
  it('renders all 4 phases', () => {
    render(<PipelineScrubber currentPhase="architecture" overallProgress={0} />);
    expect(screen.getByText('Architecture')).toBeInTheDocument();
    expect(screen.getByText('Intelligence')).toBeInTheDocument();
    expect(screen.getByText('Security')).toBeInTheDocument();
    expect(screen.getByText('Launch')).toBeInTheDocument();
  });

  it('shows "IN PROGRESS" for the active phase', () => {
    render(<PipelineScrubber currentPhase="intelligence" overallProgress={30} />);
    expect(screen.getByText('IN PROGRESS')).toBeInTheDocument();
  });

  it('shows checkmark for completed phases', () => {
    // Current phase is Security, so Architecture and Intelligence should be completed
    render(<PipelineScrubber currentPhase="security" overallProgress={60} />);
    const checkmarks = screen.getAllByTestId('icon-check');
    expect(checkmarks.length).toBe(2);
  });
});
