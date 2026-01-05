import React from 'react';
import { render, screen } from '@testing-library/react';
import { AgentTerminal } from './AgentTerminal';
import { ProvisioningLog } from '../../types/reveal.types';
import { describe, it, expect, vi } from 'vitest';

// Mock Framer Motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    span: ({ children, ...props }: any) => <span {...props}>{children}</span>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

describe('AgentTerminal', () => {
  const mockLogs: ProvisioningLog[] = [
    { id: '1', timestamp: new Date(), message: 'Optimizing images', type: 'info', phase: 'architecture' },
    { id: '2', timestamp: new Date(), message: 'Secure checkout ready', type: 'success', phase: 'security' },
  ];

  it('renders log messages', () => {
    render(<AgentTerminal logs={mockLogs} />);
    expect(screen.getByText('Optimizing images')).toBeInTheDocument();
    expect(screen.getByText('Secure checkout ready')).toBeInTheDocument();
  });

  it('shows DONE indicator for success logs', () => {
    render(<AgentTerminal logs={mockLogs} />);
    expect(screen.getByText('DONE')).toBeInTheDocument();
  });

  it('shows initialization message when empty', () => {
    render(<AgentTerminal logs={[]} />);
    expect(screen.getByText(/Initializing secure pipeline/)).toBeInTheDocument();
  });
});
