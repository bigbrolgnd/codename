import React from 'react';

interface SiteFooterProps {
    isFreeTier: boolean;
    tenantId: string;
}

export const SiteFooter = ({ isFreeTier, tenantId }: SiteFooterProps) => {
    if (!isFreeTier) return null;

    return (
        <footer className="w-full py-4 text-center text-xs text-gray-400">
            <a 
                href={`https://znapsite.com/?ref=footer_${tenantId}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:text-pink-500 hover:underline transition-colors"
            >
                Built with znapsite.com
            </a>
        </footer>
    );
};