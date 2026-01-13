import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Check, Sparkles, Star, Zap, Server } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PricingConfig } from '@codename/api';

interface AddonCardProps {
  addon: PricingConfig;
  isSubscribed?: boolean;
  userPlan?: 'free' | 'standard' | 'ai_powered';
  onSubscribe?: (addonId: string) => void;
  onUnsubscribe?: (addonId: string) => void;
  isLoading?: boolean;
}

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  free: Sparkles,
  premium: Star,
  ai: Zap,
  infrastructure: Server,
};

const CATEGORY_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  free: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', text: 'text-emerald-500' },
  premium: { bg: 'bg-amber-500/10', border: 'border-amber-500/20', text: 'text-amber-500' },
  ai: { bg: 'bg-violet-500/10', border: 'border-violet-500/20', text: 'text-violet-500' },
  infrastructure: { bg: 'bg-blue-500/10', border: 'border-blue-500/20', text: 'text-blue-500' },
};

export const AddonCard: React.FC<AddonCardProps> = ({
  addon,
  isSubscribed = false,
  userPlan = 'free',
  onSubscribe,
  onUnsubscribe,
  isLoading = false,
}) => {
  const IconComponent = CATEGORY_ICONS[addon.category] || Sparkles;
  const colors = CATEGORY_COLORS[addon.category] || CATEGORY_COLORS.free;

  // AI-Powered plan gets all add-ons for free
  const isIncluded = userPlan === 'ai_powered';
  // Free users need Standard plan for premium/ai/infrastructure add-ons
  const requiresPlan = addon.category !== 'free' && userPlan === 'free';

  const formatPrice = (cents: number) => {
    const dollars = cents / 100;
    if (addon.billing_interval === 'annual') {
      return `$${(dollars / 12).toFixed(2)}/mo`;
    }
    if (addon.billing_interval === 'quarterly') {
      return `$${(dollars / 3).toFixed(2)}/mo`;
    }
    return `$${dollars.toFixed(2)}/mo`;
  };

  return (
    <Card className={cn(
      "bg-zinc-950 border-zinc-800 shadow-xl overflow-hidden transition-all duration-300 hover:border-zinc-700",
      isSubscribed && "border-emerald-500/30"
    )}>
      <CardHeader className="border-b border-zinc-900 pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              "p-2.5 rounded-lg",
              colors.bg
            )}>
              <IconComponent className={cn("w-5 h-5", colors.text)} />
            </div>
            <div className="space-y-1">
              <CardTitle className="text-base font-bold text-white leading-tight">
                {addon.name}
              </CardTitle>
              {addon.description && (
                <p className="text-xs text-zinc-500 leading-relaxed max-w-[200px]">
                  {addon.description}
                </p>
              )}
            </div>
          </div>
          <Badge variant="outline" className={cn(
            "text-[10px] uppercase font-bold tracking-wider border",
            colors.bg,
            colors.border,
            colors.text
          )}>
            {addon.category}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-5 space-y-4">
        {/* Price Display */}
        <div className="flex items-center justify-between">
          {isIncluded ? (
            <div className="flex items-center gap-2 text-emerald-500">
              <Check size={16} />
              <span className="text-sm font-bold">Included (FREE)</span>
            </div>
          ) : requiresPlan ? (
            <div className="text-zinc-500">
              <span className="text-sm font-medium">Requires Standard Plan</span>
            </div>
          ) : addon.price_cents === 0 ? (
            <div className="flex items-center gap-2 text-emerald-500">
              <Check size={16} />
              <span className="text-sm font-bold">FREE</span>
            </div>
          ) : (
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-white">{formatPrice(addon.price_cents)}</span>
              {addon.billing_interval && addon.billing_interval !== 'monthly' && (
                <span className="text-xs text-zinc-500">
                  {addon.billing_interval === 'annual' && '(billed annually)'}
                  {addon.billing_interval === 'quarterly' && '(billed quarterly)'}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Action Button */}
        {isSubscribed ? (
          <div className="space-y-2">
            <Badge variant="outline" className="w-full justify-center py-2 bg-emerald-500/10 border-emerald-500/20 text-emerald-500">
              <Check size={14} className="mr-1" /> Subscribed
            </Badge>
            {!isIncluded && onUnsubscribe && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onUnsubscribe(addon.addon_id)}
                disabled={isLoading}
                className="w-full border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-900"
              >
                {isLoading ? <Loader2 size={14} className="animate-spin" /> : 'Unsubscribe'}
              </Button>
            )}
          </div>
        ) : requiresPlan ? (
          <Button
            variant="outline"
            size="sm"
            disabled
            className="w-full border-zinc-800 text-zinc-500 cursor-not-allowed"
          >
            Upgrade to Subscribe
          </Button>
        ) : isIncluded ? (
          <Button
            variant="default"
            size="sm"
            onClick={() => onSubscribe?.(addon.addon_id)}
            disabled={isLoading}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white"
          >
            {isLoading ? <Loader2 size={14} className="animate-spin" /> : 'Add to Site'}
          </Button>
        ) : (
          <Button
            variant="default"
            size="sm"
            onClick={() => onSubscribe?.(addon.addon_id)}
            disabled={isLoading}
            className="w-full bg-zinc-100 hover:bg-white text-zinc-950 font-bold"
          >
            {isLoading ? <Loader2 size={14} className="animate-spin" /> : 'Subscribe'}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
