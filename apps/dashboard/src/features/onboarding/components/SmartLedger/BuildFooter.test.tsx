import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BuildFooter } from './BuildFooter';
import { vi, describe, it, expect } from 'vitest';

vi.mock('lucide-react', () => ({
  Loader2: () => <span data-testid="icon-loader" />,
  ArrowRight: () => <span data-testid="icon-arrow" />,
  CheckCheck: () => <span data-testid="icon-check" />,
}));

describe('BuildFooter', () => {
  it('renders correct service count and label', () => {
    render(
      <BuildFooter 
        serviceCount={12} 
        isValid={true} 
        onBuild={() => {}} 
      />
    );
    
    expect(screen.getByText('Confirm 12 Services & Build')).toBeInTheDocument();
  });

  it('calls onBuild when clicked and valid', () => {
    const onBuild = vi.fn();
    render(
      <BuildFooter 
        serviceCount={5} 
        isValid={true} 
        onBuild={onBuild} 
      />
    );
    
    fireEvent.click(screen.getByRole('button'));
    expect(onBuild).toHaveBeenCalled();
  });

  it('is disabled when not valid', () => {
    const onBuild = vi.fn();
    render(
      <BuildFooter 
        serviceCount={5} 
        isValid={false} 
        onBuild={onBuild} 
      />
    );
    
    expect(screen.getByRole('button')).toBeDisabled();
    fireEvent.click(screen.getByRole('button'));
    expect(onBuild).not.toHaveBeenCalled();
  });

  it('is disabled when service count is 0', () => {
    render(
      <BuildFooter 
        serviceCount={0} 
        isValid={true} 
        onBuild={() => {}} 
      />
    );
    
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('shows loading state', () => {
    render(
      <BuildFooter 
        serviceCount={5} 
        isValid={true} 
        isBuilding={true}
        onBuild={() => {}} 
      />
    );
    
    expect(screen.getByText('Building Your Site...')).toBeInTheDocument();
    expect(screen.getByTestId('icon-loader')).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('shows validation error message', () => {
    render(
      <BuildFooter 
        serviceCount={5} 
        isValid={false} 
        hasValidationErrors={true}
        onBuild={() => {}} 
      />
    );
    
    expect(screen.getByText('Please fix validation errors before proceeding.')).toBeInTheDocument();
  });
});
