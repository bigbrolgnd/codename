import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { SourceImagePanel } from './SourceImagePanel';
import { vi, describe, it, expect } from 'vitest';
import type { EditableService } from '../../types/smartLedger.types';

// Mock react-zoom-pan-pinch
vi.mock('react-zoom-pan-pinch', () => ({
  TransformWrapper: ({ children }: any) => {
    return <div>{typeof children === 'function' ? children({ zoomIn: vi.fn(), zoomOut: vi.fn(), resetTransform: vi.fn() }) : children}</div>;
  },
  TransformComponent: ({ children }: any) => <div>{children}</div>,
  useControls: () => ({
    zoomIn: vi.fn(),
    zoomOut: vi.fn(),
    resetTransform: vi.fn(),
  }),
}));

// Mock Lucide icons
vi.mock('lucide-react', () => ({
  ZoomIn: () => <svg data-testid="icon-zoom-in" />,
  ZoomOut: () => <svg data-testid="icon-zoom-out" />,
  RotateCcw: () => <svg data-testid="icon-rotate-ccw" />,
  Minimize2: () => <svg data-testid="icon-minimize" />,
  Maximize2: () => <svg data-testid="icon-maximize" />,
  Loader2: () => <svg data-testid="icon-loader" />,
}));

describe('SourceImagePanel', () => {
  const mockUrl = 'https://example.com/image.jpg';
  
  const mockServices: EditableService[] = [
    {
      id: '1',
      name: 'Service 1',
      price: 100,
      duration: 30,
      category: 'Hair',
      confidence: 95,
      boundingBox: { x: 10, y: 10, width: 50, height: 50 },
      isEditing: false,
      isNew: false,
      isDeleted: false,
      hasChanges: false,
      validationErrors: []
    }
  ];

  it('renders image correctly', () => {
    render(<SourceImagePanel imageUrl={mockUrl} />);
    const img = screen.getByAltText('Source Receipt');
    fireEvent.load(img); // Trigger onLoad
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', mockUrl);
  });

  it('renders zoom controls', () => {
    render(<SourceImagePanel imageUrl={mockUrl} />);
    const img = screen.getByAltText('Source Receipt');
    fireEvent.load(img); // Trigger onLoad
    expect(screen.getByTitle('Zoom In')).toBeInTheDocument();
    expect(screen.getByTitle('Zoom Out')).toBeInTheDocument();
    expect(screen.getByTitle('Reset Zoom')).toBeInTheDocument();
  });

  it('renders collapse button when isMobile is true', () => {
    const onCollapse = vi.fn();
    render(<SourceImagePanel imageUrl={mockUrl} isMobile={true} onCollapse={onCollapse} />);
    const img = screen.getByAltText('Source Receipt');
    fireEvent.load(img); // Trigger onLoad
    const collapseBtn = screen.getByTitle('Collapse');
    expect(collapseBtn).toBeInTheDocument();
    fireEvent.click(collapseBtn);
    expect(onCollapse).toHaveBeenCalled();
  });

  it('does not render collapse button when isMobile is false', () => {
    const onCollapse = vi.fn();
    render(<SourceImagePanel imageUrl={mockUrl} isMobile={false} onCollapse={onCollapse} />);
    expect(screen.queryByTitle('Collapse')).not.toBeInTheDocument();
  });

  it('renders collapsed state correctly', () => {
    const onCollapse = vi.fn();
    render(<SourceImagePanel imageUrl={mockUrl} isCollapsed={true} onCollapse={onCollapse} />);
    
    expect(screen.queryByAltText('Source Receipt')).not.toBeInTheDocument();
    
    const showBtn = screen.getByText('Show Source Image');
    expect(showBtn).toBeInTheDocument();
    
    fireEvent.click(showBtn);
    expect(onCollapse).toHaveBeenCalled();
  });

  it('renders bounding boxes for services', () => {
    const { container } = render(<SourceImagePanel imageUrl={mockUrl} services={mockServices} />);
    
    // Trigger image load to reveal bounding boxes
    const img = screen.getByAltText('Source Receipt');
    fireEvent.load(img);

    // Check if the bounding box div exists by style
    // We can't easily query by style, but we can check if a div with the correct style attributes exists
    // Or we can rely on the fact that we mocked TransformComponent to render children
    const boundingBox = container.querySelector('div[style*="left: 10px"]');
    expect(boundingBox).toBeInTheDocument();
    expect(boundingBox).toHaveStyle({
      width: '50px',
      height: '50px'
    });
  });
});
