import React from 'react';
import { trpc } from '@/lib/trpc';
import { Instagram, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InstagramGridProps {
  tenantId: string;
  limit?: number;
}

export const InstagramGrid: React.FC<InstagramGridProps> = ({ tenantId, limit = 9 }) => {
  const { data, isLoading, error } = trpc.site.getInstagramFeed.useQuery({ 
    tenantId, 
    limit 
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 animate-pulse">
        {[...Array(limit)].map((_, i) => (
          <div key={i} className="aspect-square bg-zinc-900 rounded-xl border border-zinc-800" />
        ))}
      </div>
    );
  }

  if (error || !data?.posts.length) {
    return (
      <div className="bg-zinc-900/50 border border-dashed border-zinc-800 rounded-2xl p-12 text-center space-y-4">
        <div className="mx-auto w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-500">
          <Instagram size={24} />
        </div>
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-zinc-300">Instagram Not Connected</h3>
          <p className="text-xs text-zinc-500">Sync your feed in the Marketing Hub to display your latest work.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-black uppercase tracking-[0.2em] text-emerald-500 flex items-center gap-2">
          <div className="w-8 h-[1px] bg-emerald-500" /> High-Speed Hub
        </h2>
        <a 
          href={`https://instagram.com/`} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-[10px] font-bold uppercase text-zinc-500 hover:text-white transition-colors flex items-center gap-1"
        >
          Follow Us <ExternalLink size={10} />
        </a>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-4">
        {data.posts.map((post) => (
          <a
            key={post.externalId}
            href={post.permalink}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative aspect-square overflow-hidden rounded-xl bg-zinc-900 border border-zinc-800"
          >
            <img 
              src={post.mediaUrl} 
              alt={post.caption}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-zinc-950/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center p-4">
              <p className="text-[10px] text-white font-medium line-clamp-3 text-center leading-relaxed">
                {post.caption}
              </p>
              <div className="absolute top-2 right-2">
                <Instagram size={14} className="text-white" />
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
};
