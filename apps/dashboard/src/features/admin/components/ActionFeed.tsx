import React from 'react';
import { trpc } from '@/lib/trpc';
import { ActionCard } from './ActionCard';
import { Loader2, Inbox } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ActionFeedProps {
  tenantId: string;
}

export const ActionFeed: React.FC<ActionFeedProps> = ({ tenantId }) => {
  const feedQuery = trpc.admin.getActionFeed.useQuery(
    { tenantId, limit: 10 },
    {
      refetchInterval: 30000, // Refresh every 30 seconds
    }
  );

  if (feedQuery.isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <Loader2 className="h-6 w-6 animate-spin text-violet-400" />
        <p className="text-xs text-zinc-400 font-mono tracking-widest uppercase">Scanning Feed...</p>
      </div>
    );
  }

  const items = feedQuery.data?.items || [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-xs font-black tracking-[0.2em] text-zinc-400 uppercase">Action Feed</h3>
        <Button variant="link" size="sm" className="text-[10px] text-zinc-500 h-auto p-0 hover:text-violet-400 uppercase tracking-wider">
          View All
        </Button>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center space-y-3 glass-frosted rounded-2xl border border-white/5">
          <Inbox className="h-8 w-8 text-zinc-600" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-zinc-300">All caught up.</p>
            <p className="text-xs text-zinc-500">No pending actions found for your business.</p>
          </div>
        </div>
      ) : (
        <div className="grid gap-2 animate-in fade-in slide-in-from-bottom-2 duration-500">
          {items.map((item) => (
            <ActionCard
              key={item.id}
              item={item}
              onClick={() => console.log('Navigate to:', item.type, item.metadata)}
            />
          ))}
        </div>
      )}
    </div>
  );
};
