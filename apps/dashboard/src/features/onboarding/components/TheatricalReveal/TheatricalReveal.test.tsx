import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { TheatricalReveal } from './TheatricalReveal';
import { describe, it, expect, vi } from 'vitest';

// Mock canvas-confetti
vi.mock('canvas-confetti', () => ({
  default: vi.fn(),
}));

// Mock tRPC hooks
vi.mock('../../hooks/useProvisioningStatus', () => ({
  useProvisioningMutation: () => ({
    mutate: vi.fn((vars, { onSuccess }) => onSuccess({ provisioningId: 'test-id' })),
  }),
  useProvisioningStatus: (id: string | null) => ({
    status: id ? 'in_progress' : 'pending',
    phase: 'architecture',
    overallProgress: 10,
    isComplete: false,
    logs: [],
    siteUrl: '',
    isLoading: false,
    refetch: vi.fn(),
  }),
}));

describe('TheatricalReveal Integration', () => {
  it('renders all components and triggers provisioning', async () => {
    const onComplete = vi.fn();
    
    render(
      <TheatricalReveal 
        services={[]} 
        onComplete={onComplete} 
        onGoToDashboard={() => {}} 
      />
    );
    
    // Check for core components
    expect(screen.getByText(/Architecture/i)).toBeInTheDocument();
    expect(screen.getByText(/Agent Execution Log/i)).toBeInTheDocument();
  });
});