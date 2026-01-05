import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ServiceUpload from './ServiceUpload';

// Mock framer-motion to avoid animation timing issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => (
      <div {...props}>{children}</div>
    ),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock the useVisionExtraction hook to avoid tRPC context requirement in tests
const mockExtract = vi.fn();
const mockReset = vi.fn();

vi.mock('../hooks/useVisionExtraction', () => ({
  useVisionExtraction: () => ({
    extract: mockExtract,
    status: null,
    isProcessing: false,
    reset: mockReset,
  }),
}));

describe('ServiceUpload', () => {
  const mockOnUploadComplete = vi.fn();
  const mockOnManualEntry = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    // Make extract trigger processing state simulation
    mockExtract.mockImplementation(() => Promise.resolve());
  });

  describe('Upload Mode (default)', () => {
    it('renders the upload zone with correct heading', () => {
      render(
        <ServiceUpload
          onUploadComplete={mockOnUploadComplete}
          onManualEntry={mockOnManualEntry}
        />
      );

      expect(screen.getByText("Let's see your menu.")).toBeInTheDocument();
      expect(screen.getByText(/Snap a photo of your price list/)).toBeInTheDocument();
    });

    it('shows file size limit in the dropzone', () => {
      render(
        <ServiceUpload
          onUploadComplete={mockOnUploadComplete}
          onManualEntry={mockOnManualEntry}
        />
      );

      expect(screen.getByText(/JPG, PNG, WEBP up to 10\.0 MB/)).toBeInTheDocument();
    });

    it('has a link to switch to text input mode', () => {
      render(
        <ServiceUpload
          onUploadComplete={mockOnUploadComplete}
          onManualEntry={mockOnManualEntry}
        />
      );

      expect(screen.getByText("I don't have a price list handy")).toBeInTheDocument();
    });

    it('switches to text mode when link is clicked', async () => {
      const user = userEvent.setup();

      render(
        <ServiceUpload
          onUploadComplete={mockOnUploadComplete}
          onManualEntry={mockOnManualEntry}
        />
      );

      await user.click(screen.getByText("I don't have a price list handy"));

      await waitFor(() => {
        expect(screen.getByText('Describe your services.')).toBeInTheDocument();
      });
    });
  });

  describe('Text Input Mode', () => {
    it('renders textarea and submit button', async () => {
      const user = userEvent.setup();

      render(
        <ServiceUpload
          onUploadComplete={mockOnUploadComplete}
          onManualEntry={mockOnManualEntry}
        />
      );

      await user.click(screen.getByText("I don't have a price list handy"));

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/Example:/)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Analyze Services' })).toBeInTheDocument();
      });
    });

    it('disables submit button when textarea is empty', async () => {
      const user = userEvent.setup();

      render(
        <ServiceUpload
          onUploadComplete={mockOnUploadComplete}
          onManualEntry={mockOnManualEntry}
        />
      );

      await user.click(screen.getByText("I don't have a price list handy"));

      await waitFor(() => {
        const submitButton = screen.getByRole('button', { name: 'Analyze Services' });
        expect(submitButton).toBeDisabled();
      });
    });

    it('enables submit button when text is entered', async () => {
      const user = userEvent.setup();

      render(
        <ServiceUpload
          onUploadComplete={mockOnUploadComplete}
          onManualEntry={mockOnManualEntry}
        />
      );

      await user.click(screen.getByText("I don't have a price list handy"));

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/Example:/)).toBeInTheDocument();
      });

      await user.type(screen.getByPlaceholderText(/Example:/), 'Haircut - $25');

      const submitButton = screen.getByRole('button', { name: 'Analyze Services' });
      expect(submitButton).not.toBeDisabled();
    });

    it('calls extract when form is submitted', async () => {
      const user = userEvent.setup();

      render(
        <ServiceUpload
          onUploadComplete={mockOnUploadComplete}
          onManualEntry={mockOnManualEntry}
        />
      );

      await user.click(screen.getByText("I don't have a price list handy"));

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/Example:/)).toBeInTheDocument();
      });

      await user.type(screen.getByPlaceholderText(/Example:/), 'Haircut - $25');
      await user.click(screen.getByRole('button', { name: 'Analyze Services' }));

      await waitFor(() => {
        expect(mockExtract).toHaveBeenCalled();
      });
    });

    it('can switch back to upload mode', async () => {
      const user = userEvent.setup();

      render(
        <ServiceUpload
          onUploadComplete={mockOnUploadComplete}
          onManualEntry={mockOnManualEntry}
        />
      );

      await user.click(screen.getByText("I don't have a price list handy"));

      await waitFor(() => {
        expect(screen.getByText('Describe your services.')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Upload an image instead'));

      await waitFor(() => {
        expect(screen.getByText("Let's see your menu.")).toBeInTheDocument();
      });
    });
  });

  describe('Dropzone', () => {
    it('has file input with correct accept types', () => {
      render(
        <ServiceUpload
          onUploadComplete={mockOnUploadComplete}
          onManualEntry={mockOnManualEntry}
        />
      );

      const input = document.querySelector('input[type="file"]');
      expect(input).toBeInTheDocument();
    });

    it('renders dropzone area', () => {
      render(
        <ServiceUpload
          onUploadComplete={mockOnUploadComplete}
          onManualEntry={mockOnManualEntry}
        />
      );

      expect(screen.getByText('Take a photo or drag & drop')).toBeInTheDocument();
    });
  });
});
