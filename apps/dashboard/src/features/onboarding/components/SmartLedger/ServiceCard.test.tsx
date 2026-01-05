import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ServiceCard } from './ServiceCard';
import { ServiceCardExpanded } from './ServiceCardExpanded';
import { vi, describe, it, expect } from 'vitest';
import type { EditableService } from '../../types/smartLedger.types';

// Mock react-swipeable
vi.mock('react-swipeable', () => ({
  useSwipeable: ({ onSwipedLeft }: any) => ({ 
    onMouseDown: vi.fn(),
    // We can manually trigger onSwipedLeft in tests if needed, or check if hook is called
  }),
}));

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}));

// Mock lucide-react
vi.mock('lucide-react', () => ({
  AlertTriangle: () => <span data-testid="icon-alert" />,
  Clock: () => <span data-testid="icon-clock" />,
  Tag: () => <span data-testid="icon-tag" />,
  Check: () => <span data-testid="icon-check" />,
  X: () => <span data-testid="icon-x" />,
  Trash2: () => <span data-testid="icon-trash" />,
  RotateCcw: () => <span data-testid="icon-rotate" />,
}));

const mockService: EditableService = {
  id: '1',
  name: 'Test Service',
  price: 1500, // $15.00
  duration: 60,
  category: 'Hair',
  confidence: 90,
  isEditing: false,
  isNew: false,
  isDeleted: false,
  hasChanges: false,
  validationErrors: []
};

const mockLowConfidenceService: EditableService = {
  ...mockService,
  confidence: 70,
};

describe('ServiceCard', () => {
  it('renders service details correctly', () => {
    render(<ServiceCard service={mockService} onClick={() => {}} />);
    expect(screen.getByText('Test Service')).toBeInTheDocument();
    expect(screen.getByText('$15.00')).toBeInTheDocument();
    expect(screen.getByText('1h')).toBeInTheDocument();
    expect(screen.getByText('Hair')).toBeInTheDocument();
  });

  it('renders low confidence warning', () => {
    render(<ServiceCard service={mockLowConfidenceService} onClick={() => {}} />);
    expect(screen.getByTestId('icon-alert')).toBeInTheDocument();
    expect(screen.getByText(/Low confidence/)).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const onClick = vi.fn();
    render(<ServiceCard service={mockService} onClick={onClick} />);
    fireEvent.click(screen.getByText('Test Service'));
    expect(onClick).toHaveBeenCalled();
  });
  
  it('calls onHover when hovered', () => {
    const onHover = vi.fn();
    render(<ServiceCard service={mockService} onClick={() => {}} onHover={onHover} />);
    fireEvent.mouseEnter(screen.getByText('Test Service'));
    expect(onHover).toHaveBeenCalledWith(true);
    fireEvent.mouseLeave(screen.getByText('Test Service'));
    expect(onHover).toHaveBeenCalledWith(false);
  });
});

describe('ServiceCardExpanded', () => {
  it('renders form with initial values', () => {
    render(
      <ServiceCardExpanded 
        service={mockService} 
        onSave={() => {}} 
        onCancel={() => {}} 
        onDelete={() => {}} 
      />
    );
    
    expect(screen.getByDisplayValue('Test Service')).toBeInTheDocument();
    expect(screen.getByDisplayValue('15.00')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Hair')).toBeInTheDocument();
    // Check select value (might need to check option selected)
    expect(screen.getByDisplayValue('1 hour')).toBeInTheDocument();
  });

  it('validates required fields', () => {
    const onSave = vi.fn();
    render(
      <ServiceCardExpanded 
        service={mockService} 
        onSave={onSave} 
        onCancel={() => {}} 
        onDelete={() => {}} 
      />
    );
    
    // Clear name
    fireEvent.change(screen.getByDisplayValue('Test Service'), { target: { value: '' } });
    
    // Try to save
    fireEvent.click(screen.getByText('Save Changes'));
    
    expect(onSave).not.toHaveBeenCalled();
    expect(screen.getByText('Name is required')).toBeInTheDocument();
  });

  it('calls onSave with updated values', () => {
    const onSave = vi.fn();
    render(
      <ServiceCardExpanded 
        service={mockService} 
        onSave={onSave} 
        onCancel={() => {}} 
        onDelete={() => {}} 
      />
    );
    
    // Update name
    fireEvent.change(screen.getByDisplayValue('Test Service'), { target: { value: 'Updated Name' } });
    // Update price
    fireEvent.change(screen.getByDisplayValue('15.00'), { target: { value: '20.50' } });
    
    fireEvent.click(screen.getByText('Save Changes'));
    
    expect(onSave).toHaveBeenCalledWith('1', expect.objectContaining({
      name: 'Updated Name',
      price: 2050, // 20.50 * 100
    }));
  });

  it('calls onDelete when trash icon clicked', () => {
    const onDelete = vi.fn();
    render(
      <ServiceCardExpanded 
        service={mockService} 
        onSave={() => {}} 
        onCancel={() => {}} 
        onDelete={onDelete} 
      />
    );
    
    fireEvent.click(screen.getByTitle('Delete Service'));
    expect(onDelete).toHaveBeenCalledWith('1');
  });

  it('calls onCancel when cancel button clicked', () => {
    const onCancel = vi.fn();
    render(
      <ServiceCardExpanded 
        service={mockService} 
        onSave={() => {}} 
        onCancel={onCancel} 
        onDelete={() => {}} 
      />
    );
    
    fireEvent.click(screen.getByText('Cancel'));
    expect(onCancel).toHaveBeenCalled();
  });
});
