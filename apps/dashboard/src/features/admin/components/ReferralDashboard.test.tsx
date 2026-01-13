import { render, screen } from '@testing-library/react';
import { ReferralDashboard } from './ReferralDashboard';
import { describe, it, expect, vi } from 'vitest';
import React from 'react';

vi.mock('@/lib/trpc', () => ({
  trpc: {
    referral: {
      getStats: {
        useQuery: vi.fn().mockReturnValue({
          data: {
            totalReferrals: 10,
            pendingReferrals: 2,
            monthsEarned: 8
          },
          isLoading: false
        })
      },
      getHistory: {
        useQuery: vi.fn().mockReturnValue({
          data: [
             { id: '1', refereeTenantId: 'ref_1', status: 'converted', createdAt: '2023-01-01' }
          ],
          isLoading: false
        })
      }
    }
  }
}));

describe('ReferralDashboard', () => {
    it('renders stats correctly', () => {
        render(<ReferralDashboard tenantId="test" />);
        expect(screen.getByText('10')).toBeInTheDocument();
        expect(screen.getByText('2')).toBeInTheDocument();
        expect(screen.getByText('8 months free')).toBeInTheDocument();
    });
    
    it('displays referral code', () => {
        render(<ReferralDashboard tenantId="test" />);
        // Checking for the input value
        expect(screen.getByDisplayValue('znapsite.com/?ref=social_test')).toBeInTheDocument();
    });
});
