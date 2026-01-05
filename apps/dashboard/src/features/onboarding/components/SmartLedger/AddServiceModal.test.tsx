import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { AddServiceModal } from './AddServiceModal';
import { vi, describe, it, expect } from 'vitest';

// Mock dialog
vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ open, children }: any) => open ? <div>{children}</div> : null,
  DialogContent: ({ children }: any) => <div>{children}</div>,
  DialogHeader: ({ children }: any) => <div>{children}</div>,
  DialogTitle: ({ children }: any) => <div>{children}</div>,
  DialogFooter: ({ children }: any) => <div>{children}</div>,
}));

describe('AddServiceModal', () => {
  it('renders when open', () => {
    render(<AddServiceModal isOpen={true} onClose={() => {}} onAdd={() => {}} />);
    expect(screen.getByText('Add New Service')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(<AddServiceModal isOpen={false} onClose={() => {}} onAdd={() => {}} />);
    expect(screen.queryByText('Add New Service')).not.toBeInTheDocument();
  });

  it('validates input', () => {
    const onAdd = vi.fn();
    render(<AddServiceModal isOpen={true} onClose={() => {}} onAdd={onAdd} />);
    
    fireEvent.click(screen.getByText('Add Service'));
    
    expect(onAdd).not.toHaveBeenCalled();
    expect(screen.getByText('Name is required')).toBeInTheDocument();
  });

  it('calls onAdd with correct data', () => {
    const onAdd = vi.fn();
    const onClose = vi.fn();
    render(<AddServiceModal isOpen={true} onClose={onClose} onAdd={onAdd} />);
    
    fireEvent.change(screen.getByLabelText('Service Name'), { target: { value: 'New Service' } });
    fireEvent.change(screen.getByLabelText('Price ($)'), { target: { value: '50.00' } });
    
    fireEvent.click(screen.getByText('Add Service'));
    
    expect(onAdd).toHaveBeenCalledWith(expect.objectContaining({
      name: 'New Service',
      price: 5000,
      confidence: 100
    }));
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onClose when cancel clicked', () => {
    const onClose = vi.fn();
    render(<AddServiceModal isOpen={true} onClose={onClose} onAdd={() => {}} />);
    
    fireEvent.click(screen.getByText('Cancel'));
    expect(onClose).toHaveBeenCalled();
  });
});
