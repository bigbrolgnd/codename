import { render, screen } from '@testing-library/react';
import { SiteFooter } from './SiteFooter';
import { describe, it, expect } from 'vitest';
import React from 'react';

describe('SiteFooter', () => {
    it('renders "Built with znapsite.com" for free tier', () => {
        render(<SiteFooter isFreeTier={true} tenantId="test" />);
        expect(screen.getByText('Built with znapsite.com')).toBeInTheDocument();
        const link = screen.getByRole('link');
        expect(link).toHaveAttribute('href', 'https://znapsite.com/?ref=footer_test');
    });

    it('does not render for paid tier', () => {
        const { container } = render(<SiteFooter isFreeTier={false} tenantId="test" />);
        expect(container).toBeEmptyDOMElement();
    });
});
