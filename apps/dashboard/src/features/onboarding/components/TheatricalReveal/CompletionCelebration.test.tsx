import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { CompletionCelebration } from './CompletionCelebration';
import { describe, it, expect, vi } from 'vitest';

// Mock canvas-confetti
vi.mock('canvas-confetti', () => ({
  default: vi.fn(),
}));

describe('CompletionCelebration', () => {
  const mockUrl = 'https://mysite.com';
  
  it('renders site URL and success message', () => {
    render(
      <CompletionCelebration 
        siteUrl={mockUrl} 
        onViewSite={() => {}} 
        onGoToDashboard={() => {}} 
      />
    );
    expect(screen.getByText('Your Business is Live!')).toBeInTheDocument();
    expect(screen.getByText('mysite.com')).toBeInTheDocument();
  });

  it('calls onViewSite when View Site button is clicked', () => {
    const onView = vi.fn();
    render(
      <CompletionCelebration 
        siteUrl={mockUrl} 
        onViewSite={onView} 
        onGoToDashboard={() => {}} 
      />
    );
    fireEvent.click(screen.getByText('View My Site'));
    expect(onView).toHaveBeenCalled();
  });
});
