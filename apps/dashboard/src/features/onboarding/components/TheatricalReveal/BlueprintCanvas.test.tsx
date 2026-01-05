import React from 'react';
import { render, screen } from '@testing-library/react';
import { BlueprintCanvas } from './BlueprintCanvas';
import { describe, it, expect, vi } from 'vitest';

// Mock Framer Motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    path: ({ children, ...props }: any) => <path {...props}>{children}</path>,
    rect: ({ children, ...props }: any) => <rect {...props}>{children}</rect>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock layers to check rendering
vi.mock('./WireframeLayer', () => ({ WireframeLayer: () => <div data-testid="wireframe-layer" /> }));
vi.mock('./HydrationLayer', () => ({ HydrationLayer: () => <div data-testid="hydration-layer" /> }));
vi.mock('./PolishLayer', () => ({ PolishLayer: () => <div data-testid="polish-layer" /> }));

describe('BlueprintCanvas', () => {
  it('renders wireframe layer in architecture phase', () => {
    render(<BlueprintCanvas phase="architecture" services={[]} />);
    expect(screen.getByTestId('wireframe-layer')).toBeInTheDocument();
    expect(screen.queryByTestId('hydration-layer')).not.toBeInTheDocument();
  });

  it('renders hydration layer in intelligence phase', () => {
    render(<BlueprintCanvas phase="intelligence" services={[]} />);
    expect(screen.getByTestId('wireframe-layer')).toBeInTheDocument();
    expect(screen.getByTestId('hydration-layer')).toBeInTheDocument();
    expect(screen.queryByTestId('polish-layer')).not.toBeInTheDocument();
  });

  it('renders all layers in security phase', () => {
    render(<BlueprintCanvas phase="security" services={[]} />);
    expect(screen.getByTestId('wireframe-layer')).toBeInTheDocument();
    expect(screen.getByTestId('hydration-layer')).toBeInTheDocument();
    expect(screen.getByTestId('polish-layer')).toBeInTheDocument();
  });
});
