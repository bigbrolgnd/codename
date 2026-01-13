import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Star, Info, AlertTriangle, ChevronRight } from 'lucide-react';
import { ActionItem } from '@codename/api';
import { cn } from '@/lib/utils';

interface ActionCardProps {
  item: ActionItem;
  onClick?: () => void;
}

const typeConfig = {
  booking: { icon: Calendar, color: 'text-pink-500', bgColor: 'bg-pink-500/10' },
  review: { icon: Star, color: 'text-amber-500', bgColor: 'bg-amber-500/10' },
  system: { icon: Info, color: 'text-blue-500', bgColor: 'bg-blue-500/10' },
  alert: { icon: AlertTriangle, color: 'text-red-500', bgColor: 'bg-red-500/10' },
};

export const ActionCard: React.FC<ActionCardProps> = ({ item, onClick }) => {
  const config = typeConfig[item.type];
  const Icon = config.icon;

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <Card
      className="glass-card hover:glow-medium cursor-pointer group"
      onClick={onClick}
    >
      <CardContent className="p-4 flex items-center justify-between gap-4 relative z-10">
        <div className="flex items-center gap-4 min-w-0">
          <div className={cn("p-2.5 rounded-xl shrink-0 glass-frosted", config.color)}>
            <Icon size={20} />
          </div>
          <div className="min-w-0 space-y-0.5">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-white truncate">{item.title}</h4>
              <span className="text-[10px] text-zinc-400 font-mono uppercase">{formatTime(item.timestamp)}</span>
            </div>
            <p className="text-xs text-zinc-300 truncate leading-relaxed">
              {item.description}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {item.priority === 'high' && !item.isRead && (
            <div className="h-1.5 w-1.5 rounded-full bg-violet-500 shadow-[0_0_12px_rgba(139,92,246,0.8)] animate-pulse" />
          )}
          <ChevronRight size={14} className="text-zinc-500 group-hover:text-violet-400 transition-colors" />
        </div>
      </CardContent>
    </Card>
  );
};
