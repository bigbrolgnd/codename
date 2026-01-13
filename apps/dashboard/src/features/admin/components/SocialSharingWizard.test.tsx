import { render, screen } from '@testing-library/react';
import { SocialSharingWizard } from './SocialSharingWizard';
import { vi, describe, it, expect } from 'vitest';
import userEvent from '@testing-library/user-event';
import React from 'react';

// Mock canvas-confetti
vi.mock('canvas-confetti', () => ({
  default: vi.fn(),
}));

// Mock dialog since we might use it later, or just test logic
vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, open }: any) => open ? <div>{children}</div> : null,
  DialogContent: ({ children }: any) => <div>{children}</div>,
  DialogHeader: ({ children }: any) => <div>{children}</div>,
  DialogTitle: ({ children }: any) => <div>{children}</div>,
  DialogDescription: ({ children }: any) => <div>{children}</div>,
  DialogFooter: ({ children }: any) => <div>{children}</div>,
}));

describe('SocialSharingWizard', () => {
  const defaultProps = {
    tenantId: 'test-tenant',
    isOpen: true,
    onClose: vi.fn(),
  };

  it('renders the wizard modal when open', () => {
    render(<SocialSharingWizard {...defaultProps} />);
    expect(screen.getByText('Share your new site!')).toBeInTheDocument();
  });

  it('displays the referral link', () => {
    render(<SocialSharingWizard {...defaultProps} />);
    // Use flexible matching for input value
    expect(screen.getByDisplayValue('znapsite.com/?ref=social_test-tenant')).toBeInTheDocument();
  });

  it('has social share buttons', () => {
    render(<SocialSharingWizard {...defaultProps} />);
    expect(screen.getByLabelText('Share on Twitter')).toBeInTheDocument();
    expect(screen.getByLabelText('Share on LinkedIn')).toBeInTheDocument();
    expect(screen.getByLabelText('Share on Facebook')).toBeInTheDocument();
  });

  it('copies referral link to clipboard', async () => {
    const user = userEvent.setup();
    const writeText = vi.fn();
    
    // Mock navigator.clipboard
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText,
      },
      writable: true,
    });

    render(<SocialSharingWizard {...defaultProps} />);
    
    // Find button by text "Copy Link" or icon logic
    const copyButton = screen.getByText('Copy Link');
    await user.click(copyButton);
    
    expect(writeText).toHaveBeenCalledWith('znapsite.com/?ref=social_test-tenant');
  });
});
