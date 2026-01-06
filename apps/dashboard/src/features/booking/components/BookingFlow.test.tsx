import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BookingFlow } from './BookingFlow';
import { trpc } from '@/lib/trpc';

// Mock tRPC
vi.mock('@/lib/trpc', () => ({
  trpc: {
    booking: {
      listServices: { useQuery: vi.fn() },
      getAvailableSlots: { useQuery: vi.fn() },
      createPaymentIntent: { useMutation: vi.fn() },
      confirmBooking: { useMutation: vi.fn() },
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

describe('BookingFlow', () => {
  const tenantId = 'tenant_test';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('completes the full booking flow', async () => {
    // 1. Mock Data
    (trpc.booking.listServices.useQuery as any).mockReturnValue({
      data: [{ id: 's1', name: 'Test Service', price: 1000, duration: 30 }],
      isLoading: false,
    });

    (trpc.booking.getAvailableSlots.useQuery as any).mockReturnValue({
      data: ['2026-01-05T10:00:00.000Z'],
      isLoading: false,
    });

    const mockCreateIntent = vi.fn().mockResolvedValue({ id: 'pi_123' });
    (trpc.booking.createPaymentIntent.useMutation as any).mockReturnValue({
      mutateAsync: mockCreateIntent,
    });

    const mockConfirm = vi.fn().mockResolvedValue({ bookingId: 'b_456' });
    (trpc.booking.confirmBooking.useMutation as any).mockReturnValue({
      mutateAsync: mockConfirm,
    });

    render(<BookingFlow tenantId={tenantId} simulateDelay={0} />);

    // Step 1: Select Service
    fireEvent.click(screen.getByText('Test Service'));

    // Step 2: Select Slot
    const slotButton = await screen.findByText('10:00 AM');
    fireEvent.click(slotButton);

    // Step 3: Checkout
    expect(screen.getByText('CONFIRM BOOKING')).toBeInTheDocument();
    
    // Fill form
    fireEvent.change(screen.getByLabelText(/Full Name/i), { target: { value: 'Jane Doe' } });
    fireEvent.change(screen.getByLabelText(/Email Address/i), { target: { value: 'jane@example.com' } });
    
    fireEvent.click(screen.getByText(/Pay \$2.00 Deposit/i));

        // Step 4: Success

        await waitFor(() => {

          expect(screen.getByText('See you soon!')).toBeInTheDocument();

          expect(screen.getByText(/REF: B_456/i)).toBeInTheDocument();

        }, { timeout: 2000 });

      });

    });

    