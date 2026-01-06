import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AgentChat } from './AgentChat';
import { trpc } from '@/lib/trpc';

// Mock tRPC
vi.mock('@/lib/trpc', () => ({
  trpc: {
    admin: {
      sendAgentMessage: {
        useMutation: vi.fn(),
      },
    },
  },
}));

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock scrollIntoView
window.HTMLElement.prototype.scrollIntoView = vi.fn();

describe('AgentChat', () => {
  const tenantId = 'tenant_test';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders chat bubble initially', () => {
    (trpc.admin.sendAgentMessage.useMutation as any).mockReturnValue({
      isLoading: false,
    });

    render(<AgentChat tenantId={tenantId} />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('opens chat window when bubble is clicked', () => {
    render(<AgentChat tenantId={tenantId} />);
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByText('Business Agent')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Message your agent...')).toBeInTheDocument();
  });

  it('sends message and displays response', async () => {
    const mockMutate = vi.fn().mockResolvedValue({
      response: {
        id: '2',
        role: 'assistant',
        content: 'I can help with that.',
        timestamp: new Date().toISOString(),
      },
    });

    (trpc.admin.sendAgentMessage.useMutation as any).mockReturnValue({
      mutateAsync: mockMutate,
      isLoading: false,
    });

    render(<AgentChat tenantId={tenantId} />);
    fireEvent.click(screen.getByRole('button'));

    const input = screen.getByPlaceholderText('Message your agent...');
    fireEvent.change(input, { target: { value: 'Hello' } });
    
    const sendButton = screen.getByLabelText('Send message');
    fireEvent.click(sendButton);

    expect(mockMutate).toHaveBeenCalledWith({
      tenantId,
      message: 'Hello',
    });

    await waitFor(() => {
      expect(screen.getByText('I can help with that.')).toBeInTheDocument();
    });
  });
});
