import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StaffList } from './StaffList';
import { trpc } from '@/lib/trpc';

// Mock tRPC
vi.mock('@/lib/trpc', () => ({
  trpc: {
    admin: {
      listStaff: { useQuery: vi.fn() },
      inviteStaff: { useMutation: vi.fn() },
      deleteStaff: { useMutation: vi.fn() },
    },
  },
}));

// Mock sonner
vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() }
}));

describe('StaffList', () => {
  const tenantId = 'tenant_test';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders staff members', () => {
    (trpc.admin.listStaff.useQuery as any).mockReturnValue({
      data: [
        { id: '1', name: 'Alice', email: 'alice@example.com', role: 'admin', createdAt: new Date().toISOString() }
      ],
      isLoading: false,
    });

    render(<StaffList tenantId={tenantId} />);
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('alice@example.com')).toBeInTheDocument();
    expect(screen.getByText('Admin')).toBeInTheDocument();
  });

  it('shows empty state when no staff', () => {
    (trpc.admin.listStaff.useQuery as any).mockReturnValue({
      data: [],
      isLoading: false,
    });

    render(<StaffList tenantId={tenantId} />);
    expect(screen.getByText(/No staff members invited/)).toBeInTheDocument();
  });

  it('opens invite modal when clicking button', () => {
    (trpc.admin.listStaff.useQuery as any).mockReturnValue({
      data: [],
      isLoading: false,
    });
    
    (trpc.admin.inviteStaff.useMutation as any).mockReturnValue({
      isLoading: false,
    });

    render(<StaffList tenantId={tenantId} />);
    fireEvent.click(screen.getByText(/Invite Member/i));
    expect(screen.getByText('Invite Team Member')).toBeInTheDocument();
  });
});
