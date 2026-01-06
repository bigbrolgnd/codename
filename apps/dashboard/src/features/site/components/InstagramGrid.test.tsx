import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { InstagramGrid } from './InstagramGrid';
import * as trpcLib from '@/lib/trpc';

vi.mock('@/lib/trpc', () => ({
  trpc: {
    site: {
      getInstagramFeed: {
        useQuery: vi.fn()
      }
    }
  }
}));

describe('InstagramGrid', () => {
  it('shows loading skeleton while fetching', () => {
    vi.spyOn(trpcLib.trpc.site.getInstagramFeed, 'useQuery').mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null
    } as any);

    render(<InstagramGrid tenantId="tenant_test" limit={9} />);

    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('shows placeholder when no posts available', () => {
    vi.spyOn(trpcLib.trpc.site.getInstagramFeed, 'useQuery').mockReturnValue({
      data: { posts: [] },
      isLoading: false,
      error: null
    } as any);

    render(<InstagramGrid tenantId="tenant_test" limit={9} />);

    expect(screen.getByText('Instagram Not Connected')).toBeInTheDocument();
    expect(screen.getByText(/Sync your feed in the Marketing Hub/i)).toBeInTheDocument();
  });

  it('renders grid of posts when data is available', () => {
    const mockPosts = [
      {
        externalId: 'ig_1',
        mediaUrl: 'https://test.com/img1.jpg',
        permalink: 'https://instagram.com/p/1',
        caption: 'Post 1',
        mediaType: 'IMAGE',
        postedAt: '2026-01-01T10:00:00Z'
      },
      {
        externalId: 'ig_2',
        mediaUrl: 'https://test.com/img2.jpg',
        permalink: 'https://instagram.com/p/2',
        caption: 'Post 2',
        mediaType: 'IMAGE',
        postedAt: '2026-01-02T10:00:00Z'
      }
    ];

    vi.spyOn(trpcLib.trpc.site.getInstagramFeed, 'useQuery').mockReturnValue({
      data: { posts: mockPosts },
      isLoading: false,
      error: null
    } as any);

    render(<InstagramGrid tenantId="tenant_test" limit={9} />);

    expect(screen.getByText('High-Speed Hub')).toBeInTheDocument();

    const images = screen.getAllByRole('img');
    expect(images.length).toBe(2);
    expect(images[0]).toHaveAttribute('src', 'https://test.com/img1.jpg');
    expect(images[1]).toHaveAttribute('src', 'https://test.com/img2.jpg');
  });

  it('renders responsive grid with correct classes', () => {
    const mockPosts = [
      {
        externalId: 'ig_1',
        mediaUrl: 'https://test.com/img1.jpg',
        permalink: 'https://instagram.com/p/1',
        caption: 'Post 1',
        mediaType: 'IMAGE',
        postedAt: '2026-01-01T10:00:00Z'
      }
    ];

    vi.spyOn(trpcLib.trpc.site.getInstagramFeed, 'useQuery').mockReturnValue({
      data: { posts: mockPosts },
      isLoading: false,
      error: null
    } as any);

    const { container } = render(<InstagramGrid tenantId="tenant_test" limit={9} />);

    const grid = container.querySelector('.grid.grid-cols-2.md\\:grid-cols-3');
    expect(grid).toBeInTheDocument();
  });

  it('shows placeholder when error occurs', () => {
    vi.spyOn(trpcLib.trpc.site.getInstagramFeed, 'useQuery').mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Network error')
    } as any);

    render(<InstagramGrid tenantId="tenant_test" limit={9} />);

    expect(screen.getByText('Instagram Not Connected')).toBeInTheDocument();
  });
});
