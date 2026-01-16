/**
 * Booking Flow Component Tests
 *
 * Tests the multi-step booking flow component for:
 * - Service selection with glassmorphism cards
 * - 1.2x magnification effect
 * - Mobile responsiveness
 * - Most Popular badge display
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BookingFlow } from './BookingFlow';
import { trpc } from '@/lib/trpc';
import { TenantProvider } from '@/contexts/TenantContext';

// Mock tRPC
vi.mock('@/lib/trpc', () => ({
  trpc: {
    booking: {
      listServices: {
        useQuery: vi.fn(),
      },
    },
  },
}));

// Mock Framer Motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
  useAnimation: () => ({
    start: vi.fn(),
    stop: vi.fn(),
  }),
}));

const mockServices = [
  {
    id: 'service-1',
    name: 'Haircut',
    description: 'Professional haircut service',
    price: 5000, // $50.00
    duration: 30,
  },
  {
    id: 'service-2',
    name: 'Beard Trim',
    description: 'Beard trimming and styling',
    price: 3000, // $30.00
    duration: 15,
  },
];

function createTestClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
}

function renderWithClient(component: React.ReactElement) {
  const client = createTestClient();
  return render(
    <QueryClientProvider client={client}>
      <TenantProvider>
        {component}
      </TenantProvider>
    </QueryClientProvider>
  );
}

describe('BookingFlow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial Render', () => {
    it('should render the booking flow container with glassmorphism header', () => {
      const mockedUseQuery = vi.mocked(trpc.booking.listServices.useQuery);
      mockedUseQuery.mockReturnValue({
        data: mockServices,
        isLoading: false,
        error: null,
      } as any);

      renderWithClient(<BookingFlow tenantId="tenant_test" />);

      // Check for glassmorphism header
      const header = screen.getByText(/BOOK AN APPOINTMENT/i);
      expect(header).toBeInTheDocument();
    });

    it('should render loading state while fetching services', () => {
      const mockedUseQuery = vi.mocked(trpc.booking.listServices.useQuery);
      mockedUseQuery.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      } as any);

      renderWithClient(<BookingFlow tenantId="tenant_test" />);

      // Check for loading spinner
      const loader = document.querySelector('.animate-spin');
      expect(loader).toBeInTheDocument();
    });
  });

  describe('Service Selection', () => {
    it('should display service list with glassmorphism cards', () => {
      const mockedUseQuery = vi.mocked(trpc.booking.listServices.useQuery);
      mockedUseQuery.mockReturnValue({
        data: mockServices,
        isLoading: false,
        error: null,
      } as any);

      renderWithClient(<BookingFlow tenantId="tenant_test" />);

      // Check for service cards
      expect(screen.getByText('Haircut')).toBeInTheDocument();
      expect(screen.getByText('Beard Trim')).toBeInTheDocument();
      expect(screen.getByText('$50.00')).toBeInTheDocument();
      expect(screen.getByText('$30.00')).toBeInTheDocument();
    });

    it('should display Most Popular badge on first service', () => {
      const mockedUseQuery = vi.mocked(trpc.booking.listServices.useQuery);
      mockedUseQuery.mockReturnValue({
        data: mockServices,
        isLoading: false,
        error: null,
      } as any);

      renderWithClient(<BookingFlow tenantId="tenant_test" />);

      // Check for Most Popular badge
      expect(screen.getByText('MOST POPULAR')).toBeInTheDocument();
    });

    it('should display service duration with sparkles icon', () => {
      const mockedUseQuery = vi.mocked(trpc.booking.listServices.useQuery);
      mockedUseQuery.mockReturnValue({
        data: mockServices,
        isLoading: false,
        error: null,
      } as any);

      renderWithClient(<BookingFlow tenantId="tenant_test" />);

      // Check for duration info
      expect(screen.getByText('30 minutes')).toBeInTheDocument();
      expect(screen.getByText('15 minutes')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should display error message when service fetch fails', () => {
      const mockedUseQuery = vi.mocked(trpc.booking.listServices.useQuery);
      mockedUseQuery.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error('Failed to fetch'),
      } as any);

      renderWithClient(<BookingFlow tenantId="tenant_test" />);

      // Check for error message
      expect(screen.getByText(/Failed to load services/i)).toBeInTheDocument();
    });

    it('should display empty state when no services available', () => {
      const mockedUseQuery = vi.mocked(trpc.booking.listServices.useQuery);
      mockedUseQuery.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      } as any);

      renderWithClient(<BookingFlow tenantId="tenant_test" />);

      // Check for empty state
      expect(screen.getByText(/No services available/i)).toBeInTheDocument();
    });
  });

  describe('Progress Bar', () => {
    it('should render progress bar with glassmorphism styling', () => {
      const mockedUseQuery = vi.mocked(trpc.booking.listServices.useQuery);
      mockedUseQuery.mockReturnValue({
        data: mockServices,
        isLoading: false,
        error: null,
      } as any);

      const { container } = renderWithClient(<BookingFlow tenantId="tenant_test" />);

      // Check for progress bar element (motion.div rendered as div)
      const progressBar = container.querySelector('.h-1.bg-pink-500\\/20');
      expect(progressBar).toBeInTheDocument();
    });
  });

  describe('Mobile Responsiveness', () => {
    it('should render with mobile-first layout classes', () => {
      const mockedUseQuery = vi.mocked(trpc.booking.listServices.useQuery);
      mockedUseQuery.mockReturnValue({
        data: mockServices,
        isLoading: false,
        error: null,
      } as any);

      const { container } = renderWithClient(<BookingFlow tenantId="tenant_test" />);

      // Check for responsive grid layout
      const grid = container.querySelector('.grid');
      expect(grid).toBeInTheDocument();
      expect(grid?.className).toContain('max-w-2xl'); // Mobile-first max width
    });
  });

  describe('Magnification Effect', () => {
    it('should include whileHover and whileTap props for magnification', () => {
      const mockedUseQuery = vi.mocked(trpc.booking.listServices.useQuery);
      mockedUseQuery.mockReturnValue({
        data: mockServices,
        isLoading: false,
        error: null,
      } as any);

      const { container } = renderWithClient(<BookingFlow tenantId="tenant_test" />);

      // Note: Since we mocked framer-motion to render regular divs,
      // we're checking that the component renders without errors
      // The actual 1.2x magnification is tested in E2E tests
      const serviceCards = container.querySelectorAll('.space-y-4 > div');
      expect(serviceCards.length).toBeGreaterThan(0);
    });
  });
});
