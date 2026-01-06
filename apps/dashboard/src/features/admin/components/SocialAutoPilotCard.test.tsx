import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SocialAutoPilotCard } from './SocialAutoPilotCard';
import { MarketingSettings } from '@codename/api';

describe('SocialAutoPilotCard', () => {
  const mockSettings: MarketingSettings = {
    autoPilotEnabled: false,
    frequency: 'weekly',
    tone: 'professional',
    platforms: [],
    nextPostAt: null
  };

  const mockOnSave = vi.fn().mockResolvedValue(undefined);

  it('renders with disabled state by default', () => {
    render(<SocialAutoPilotCard settings={mockSettings} onSave={mockOnSave} />);

    expect(screen.getByText('Social Auto-Pilot')).toBeInTheDocument();
    expect(screen.getByText('Disabled')).toBeInTheDocument();
  });

  it('shows enabled state when auto-pilot is on', () => {
    const enabledSettings = { ...mockSettings, autoPilotEnabled: true };
    render(<SocialAutoPilotCard settings={enabledSettings} onSave={mockOnSave} />);

    expect(screen.getByText('Enabled')).toBeInTheDocument();
  });

  it('toggles auto-pilot state when button is clicked', async () => {
    render(<SocialAutoPilotCard settings={mockSettings} onSave={mockOnSave} />);

    const toggleButton = screen.getByText('Disabled');
    fireEvent.click(toggleButton);

    // Should update to Enabled
    await waitFor(() => {
      expect(screen.getByText('Enabled')).toBeInTheDocument();
    });
  });

  it('disables controls when auto-pilot is off', () => {
    render(<SocialAutoPilotCard settings={mockSettings} onSave={mockOnSave} />);

    const frequencySelect = screen.getByRole('combobox');
    expect(frequencySelect).toBeDisabled();
  });

  it('calls onSave with updated settings when Save button is clicked', async () => {
    render(<SocialAutoPilotCard settings={mockSettings} onSave={mockOnSave} />);

    const saveButton = screen.getByText(/Save Configuration/i);
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith({
        autoPilotEnabled: false,
        frequency: 'weekly',
        tone: 'professional',
        platforms: []
      });
    });
  });

  it('shows next post date when auto-pilot is enabled and scheduled', () => {
    const scheduledSettings = {
      ...mockSettings,
      autoPilotEnabled: true,
      nextPostAt: '2026-01-15T10:00:00Z'
    };

    render(<SocialAutoPilotCard settings={scheduledSettings} onSave={mockOnSave} />);

    expect(screen.getByText(/Auto-Pilot Active/i)).toBeInTheDocument();
    expect(screen.getByText(/Next post scheduled/i)).toBeInTheDocument();
  });

  it('does not show next post date when auto-pilot is disabled', () => {
    render(<SocialAutoPilotCard settings={mockSettings} onSave={mockOnSave} />);

    expect(screen.queryByText(/Auto-Pilot Active/i)).not.toBeInTheDocument();
  });

  it('shows saving state when isSaving is true', () => {
    render(<SocialAutoPilotCard settings={mockSettings} onSave={mockOnSave} isSaving={true} />);

    expect(screen.getByText('Saving...')).toBeInTheDocument();
  });

  it('toggles Google Business platform selection', async () => {
    const enabledSettings = { ...mockSettings, autoPilotEnabled: true };
    render(<SocialAutoPilotCard settings={enabledSettings} onSave={mockOnSave} />);

    const googleButton = screen.getByText('Google Business').closest('button');
    expect(googleButton).toBeTruthy();

    if (googleButton) {
      fireEvent.click(googleButton);

      const saveButton = screen.getByText(/Save Configuration/i);
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith(
          expect.objectContaining({
            platforms: expect.arrayContaining(['google'])
          })
        );
      });
    }
  });

  it('toggles Instagram platform selection', async () => {
    const enabledSettings = { ...mockSettings, autoPilotEnabled: true };
    render(<SocialAutoPilotCard settings={enabledSettings} onSave={mockOnSave} />);

    const instagramButton = screen.getByText('Instagram Feed').closest('button');
    expect(instagramButton).toBeTruthy();

    if (instagramButton) {
      fireEvent.click(instagramButton);

      const saveButton = screen.getByText(/Save Configuration/i);
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith(
          expect.objectContaining({
            platforms: expect.arrayContaining(['instagram'])
          })
        );
      });
    }
  });

  it('applies correct theme classes (Obsidian)', () => {
    const { container } = render(<SocialAutoPilotCard settings={mockSettings} onSave={mockOnSave} />);

    const card = container.querySelector('.bg-zinc-950.border-zinc-800');
    expect(card).toBeInTheDocument();
  });
});
