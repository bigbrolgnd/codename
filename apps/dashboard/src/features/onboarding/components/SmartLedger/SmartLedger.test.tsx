import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SmartLedger } from './SmartLedger';
import { ExtractionResult } from '@codename/api';
import { vi, describe, it, expect } from 'vitest';

// Mocks
vi.mock('react-zoom-pan-pinch', () => ({
  TransformWrapper: ({ children }: any) => <div>{typeof children === 'function' ? children({ zoomIn: vi.fn(), zoomOut: vi.fn(), resetTransform: vi.fn() }) : children}</div>,
  TransformComponent: ({ children }: any) => <div>{children}</div>,
  useControls: () => ({ zoomIn: vi.fn(), zoomOut: vi.fn(), resetTransform: vi.fn() }),
}));

vi.mock('react-swipeable', () => ({
  useSwipeable: () => ({ onMouseDown: vi.fn() }),
}));

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

vi.mock('lucide-react', () => ({
  AlertTriangle: () => <span data-testid="icon-alert" />,
  Clock: () => <span data-testid="icon-clock" />,
  Tag: () => <span data-testid="icon-tag" />,
  Check: () => <span data-testid="icon-check" />,
  X: () => <span data-testid="icon-x" />,
  Trash2: () => <span data-testid="icon-trash" />,
  RotateCcw: () => <span data-testid="icon-rotate" />,
  Minimize2: () => <span data-testid="icon-minimize" />,
  Maximize2: () => <span data-testid="icon-maximize" />,
  ZoomIn: () => <span data-testid="icon-zoom-in" />,
  ZoomOut: () => <span data-testid="icon-zoom-out" />,
  Loader2: () => <span data-testid="icon-loader" />,
  ArrowRight: () => <span data-testid="icon-arrow" />,
  CheckCheck: () => <span data-testid="icon-check-double" />,
  AlertCircle: () => <span data-testid="icon-alert-circle" />,
  CheckCircle: () => <span data-testid="icon-check-circle" />,
  Info: () => <span data-testid="icon-info" />,
  Sparkles: () => <span data-testid="icon-sparkles" />,
  Layers: () => <span data-testid="icon-layers" />,
  Plus: () => <span data-testid="icon-plus" />,
  ChevronDown: () => <span data-testid="icon-chevron-down" />,
  ChevronRight: () => <span data-testid="icon-chevron-right" />,
}));

vi.mock('sonner', () => ({
  toast: { error: vi.fn(), success: vi.fn() }
}));

vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ open, children }: any) => open ? <div>{children}</div> : null,
  DialogContent: ({ children }: any) => <div>{children}</div>,
  DialogHeader: ({ children }: any) => <div>{children}</div>,
  DialogTitle: ({ children }: any) => <div>{children}</div>,
  DialogFooter: ({ children }: any) => <div>{children}</div>,
}));

const mockExtractionResult: ExtractionResult = {
  id: 'test-id',
  sourceImageUrl: 'http://example.com/receipt.jpg',
  services: [
    {
      id: 's1',
      name: 'Service 1',
      price: 1000,
      duration: 30,
      category: 'Category A',
      confidence: 95,
      boundingBox: { x: 10, y: 10, width: 100, height: 50 },
    },
    {
      id: 's2',
      name: 'Service 2',
      price: 2000,
      duration: 60,
      category: 'Category B',
      confidence: 60, // Low confidence
      boundingBox: { x: 10, y: 70, width: 100, height: 50 },
    }
  ],
  categories: ['Category A', 'Category B'],
  overallConfidence: 85,
  processingTimeMs: 500,
  warnings: []
};

describe('SmartLedger Integration', () => {
  it('renders main layout with image and service list', () => {
    render(
      <SmartLedger 
        extractionResult={mockExtractionResult} 
        onBuild={() => {}} 
      />
    );
    
    // Image Panel
    expect(screen.getByAltText('Source Receipt')).toBeInTheDocument();
    
    // Service List Header
    expect(screen.getByText('Extracted Services')).toBeInTheDocument();
    expect(screen.getByText('2 services found')).toBeInTheDocument();
    
    // Services
    expect(screen.getByText('Service 1')).toBeInTheDocument();
    expect(screen.getByText('Service 2')).toBeInTheDocument();
    
    // Footer
    expect(screen.getByText('Confirm 2 Services & Build')).toBeInTheDocument();
  });

  it('toggles edit mode when clicking a service', () => {
    render(
      <SmartLedger 
        extractionResult={mockExtractionResult} 
        onBuild={() => {}} 
      />
    );
    
    // Click service to edit
    fireEvent.click(screen.getByText('Service 1'));
    
    // Expect input with value "Service 1"
    expect(screen.getByDisplayValue('Service 1')).toBeInTheDocument();
    expect(screen.getByText('Save Changes')).toBeInTheDocument();
  });

  it('updates service details on save', async () => {
    render(
      <SmartLedger 
        extractionResult={mockExtractionResult} 
        onBuild={() => {}} 
      />
    );
    
    // Edit
    fireEvent.click(screen.getByText('Service 1'));
    
    // Change name
    fireEvent.change(screen.getByDisplayValue('Service 1'), { target: { value: 'Updated Service' } });
    
    // Save
    fireEvent.click(screen.getByText('Save Changes'));
    
    // Expect new name in list (compact view)
    await waitFor(() => {
      expect(screen.getByText('Updated Service')).toBeInTheDocument();
    });
  });

  it('deletes a service', () => {
    render(
      <SmartLedger 
        extractionResult={mockExtractionResult} 
        onBuild={() => {}} 
      />
    );
    
    // There are 2 services initially.
    // Use delete button if available or swipe.
    // We didn't implement a visible delete button in Compact View in ServiceCard.tsx (only swipe).
    // But we did add onDelete prop.
    // Wait, ServiceCard.tsx only calls onDelete on swipe.
    // We should probably add a delete action in Edit mode.
    
    // Click to edit first
    fireEvent.click(screen.getByText('Service 1'));
    
    // Click trash icon
    fireEvent.click(screen.getByTitle('Delete Service'));
    
    // Expect service to be gone (filtered out of validServices)
    expect(screen.queryByText('Service 1')).not.toBeInTheDocument();
    expect(screen.getByText('1 services found')).toBeInTheDocument();
  });

  it('calls onBuild with valid services', async () => {
    const onBuild = vi.fn();
    render(
      <SmartLedger 
        extractionResult={mockExtractionResult} 
        onBuild={onBuild} 
      />
    );
    
    fireEvent.click(screen.getByText('Confirm 2 Services & Build'));
    
    await waitFor(() => {
      expect(onBuild).toHaveBeenCalledTimes(1);
    });
    
    // Check arguments
    const calledServices = onBuild.mock.calls[0][0];
    expect(calledServices).toHaveLength(2);
  });
  
  it('collapses image panel', () => {
    render(
      <SmartLedger 
        extractionResult={mockExtractionResult} 
        onBuild={() => {}} 
      />
    );
    
    // Find collapse button (mocked icon Minimize2)
    // Actually SourceImagePanel renders buttons.
    // The button has title="Collapse" (if isMobile=true, which we set to true)
    
    const collapseBtn = screen.getByTitle('Collapse');
    fireEvent.click(collapseBtn);
    
    // Expect collapsed state: image not visible or container class changed.
    // In test environment, checking class names on specific elements might be tricky without testIds.
    // But we know SourceImagePanel renders "Show Source Image" button when collapsed.
    
    expect(screen.getByText('Show Source Image')).toBeInTheDocument();
  });

  it('adds a new service via modal', async () => {
    render(
      <SmartLedger 
        extractionResult={mockExtractionResult} 
        onBuild={() => {}} 
      />
    );
    
    // Click Add Service button in header
    fireEvent.click(screen.getByText('Add Service'));
    
    // Expect modal content
    expect(screen.getByText('Add New Service')).toBeInTheDocument();
    
    // Fill form
    fireEvent.change(screen.getByLabelText('Service Name'), { target: { value: 'New Test Service' } });
    fireEvent.change(screen.getByLabelText('Price ($)'), { target: { value: '50.00' } });
    
    // Submit
    // Note: The button text "Add Service" appears twice now (header button and modal submit button).
    // Use closest or specific selector.
    // The modal submit button is in DialogFooter.
    const submitBtns = screen.getAllByText('Add Service');
    fireEvent.click(submitBtns[1]); // Assuming 2nd one is the modal button
    
    // Expect modal closed
    expect(screen.queryByText('Add New Service')).not.toBeInTheDocument();
    
    // Expect new service in list
    expect(screen.getByText('New Test Service')).toBeInTheDocument();
    expect(screen.getByText('3 services found')).toBeInTheDocument();
  });
});
