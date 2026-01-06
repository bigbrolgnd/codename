import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import App from './App'
import { trpc } from '@/lib/trpc'

// Mock tRPC

// Mock canvas-confetti
vi.mock('canvas-confetti', () => ({
  default: vi.fn(),
}));

// Mock ServiceUpload
vi.mock('./features/onboarding/components/ServiceUpload', () => ({
  default: ({ onUploadComplete }: any) => (
    <button onClick={() => onUploadComplete({
      id: 'test',
      services: [{ id: '1', name: 'Service 1', price: 100, duration: 30, confidence: 90 }],
      categories: [],
      sourceImageUrl: 'http://example.com/img.jpg',
      overallConfidence: 90,
      processingTimeMs: 100,
      warnings: []
    })}>
      Complete Upload
    </button>
  )
}));

// Mock SmartLedger
vi.mock('./features/onboarding/components/SmartLedger', () => ({
  SmartLedger: ({ onBuild }: any) => (
    <button onClick={() => onBuild([])}>Build Site</button>
  )
}));

// Mock TheatricalReveal
vi.mock('./features/onboarding/components/TheatricalReveal', () => ({
  TheatricalReveal: ({ onGoToDashboard }: any) => (
    <div>
      <h2>Theatrical Reveal</h2>
      <button onClick={onGoToDashboard}>Go to Dashboard</button>
    </div>
  )
}));

// Mock tRPC
vi.mock('@/lib/trpc', () => ({
  trpc: {
    extraction: {
      start: { useMutation: vi.fn() },
      status: { useQuery: vi.fn() },
      result: { useQuery: vi.fn() },
    },
    site: {
      ingestIntakeData: { useMutation: vi.fn() },
    },
    admin: {
      getActionFeed: { useQuery: vi.fn() },
      sendAgentMessage: { useMutation: vi.fn() },
      getUsageStatus: { useQuery: vi.fn() },
      getSubscriptionStatus: { useQuery: vi.fn() },
    },
  },
}));

describe('App Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default mocks
    (trpc.admin.getActionFeed.useQuery as any).mockReturnValue({
      data: { items: [], totalCount: 0 },
      isLoading: false,
    });

    (trpc.admin.sendAgentMessage.useMutation as any).mockReturnValue({
      mutateAsync: vi.fn(),
      isLoading: false,
    });

    (trpc.admin.getUsageStatus.useQuery as any).mockReturnValue({
      data: { aiPercentage: 0, visitsTotal: 0, isCapped: false },
      isLoading: false,
    });

    (trpc.admin.getSubscriptionStatus.useQuery as any).mockReturnValue({
      data: { canAccessDesignStudio: true },
      isLoading: false,
    });
  });

  it('transitions from welcome to upload to review to reveal to dashboard', async () => {
    render(<App />);
    
    // Welcome -> Upload
    const startBtn = screen.getByText('Start Onboarding');
    expect(startBtn).toBeInTheDocument();
    fireEvent.click(startBtn);
    
    // Expect Upload Step (Mock)
    const uploadBtn = screen.getByText('Complete Upload');
    expect(uploadBtn).toBeInTheDocument();
    
    // Upload -> Review
    fireEvent.click(uploadBtn);
    
    // Expect Review Step (Mock SmartLedger)
    const buildBtn = screen.getByText('Build Site');
    expect(buildBtn).toBeInTheDocument();
    
    // Review -> Reveal
    fireEvent.click(buildBtn);
    
    // Expect Reveal Step
    expect(screen.getByText('Theatrical Reveal')).toBeInTheDocument();
    
    // Navigate to Dashboard
    fireEvent.click(screen.getByText('Go to Dashboard'));
    
    expect(screen.getAllByText('COMMAND').length).toBeGreaterThan(0);
  });
});

