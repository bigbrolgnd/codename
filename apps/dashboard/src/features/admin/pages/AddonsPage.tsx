import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Search, Sparkles, Star, Zap, Server, Filter, AlertCircle, RefreshCw } from 'lucide-react';
import { AddonCard } from '@/components/AddonCard';
import { trpc } from '@/lib/trpc';
import { cn } from '@/lib/utils';
import { useTenant } from '@/contexts/TenantContext';
import type { PricingConfig, TenantAddon } from '@codename/api';
import { toast } from 'sonner';

const CATEGORY_FILTERS = ['all', 'free', 'premium', 'ai', 'infrastructure'] as const;
const CATEGORY_ICONS = { all: Filter, free: Sparkles, premium: Star, ai: Zap, infrastructure: Server };

export const AddonsPage: React.FC = () => {
  const { tenantId, isLoading: isTenantLoading } = useTenant();
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<typeof CATEGORY_FILTERS[number]>('all');

  // Fetch pricing config
  const { data: pricingData, isLoading: isLoadingPricing, error: pricingError, refetch: refetchPricing } = trpc.admin.getPricingConfig.useQuery();
  const { data: tenantAddons } = trpc.admin.getTenantAddons.useQuery(
    { tenantId: tenantId ?? '' },
    { enabled: !!tenantId }
  );
  const { data: tenantPlan } = trpc.admin.getTenantPlan.useQuery(
    { tenantId: tenantId ?? '' },
    { enabled: !!tenantId }
  );

  const [subscribingAddon, setSubscribingAddon] = useState<string | null>(null);

  // Mutations with automatic query invalidation
  const subscribeMutation = trpc.admin.subscribeToAddon.useMutation({
    onSuccess: () => {
      toast.success('Add-on subscribed successfully!');
      // Queries will auto-refetch due to tRPC invalidation
    },
    onError: (error) => {
      toast.error(`Failed to subscribe: ${error.message}`);
    },
  });

  const unsubscribeMutation = trpc.admin.unsubscribeFromAddon.useMutation({
    onSuccess: () => {
      toast.success('Add-on unsubscribed successfully!');
      // Queries will auto-refetch due to tRPC invalidation
    },
    onError: (error) => {
      toast.error(`Failed to unsubscribe: ${error.message}`);
    },
  });

  const addons = pricingData?.pricing ?? [];
  const subscribedAddonIds = new Set(tenantAddons?.addons.map(a => a.addon_id) ?? []);
  const userPlan = tenantPlan?.base_plan_type ?? 'free';

  // Filter addons
  const filteredAddons = addons.filter((addon) => {
    const matchesCategory = categoryFilter === 'all' || addon.category === categoryFilter;
    const matchesSearch = addon.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (addon.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
    return matchesCategory && matchesSearch && addon.is_active;
  });

  // Group addons by category for display
  const groupedAddons = filteredAddons.reduce((acc, addon) => {
    if (!acc[addon.category]) acc[addon.category] = [];
    acc[addon.category].push(addon);
    return acc;
  }, {} as Record<string, PricingConfig[]>);

  const handleSubscribe = async (addonId: string) => {
    if (!tenantId) return;
    setSubscribingAddon(addonId);
    try {
      await subscribeMutation.mutateAsync({
        tenantId,
        addonId,
      });
    } catch (error) {
      // Keep loading state visible on error, clear after short delay
      setTimeout(() => setSubscribingAddon(null), 500);
      throw error;
    }
    // Only clear on success
    setSubscribingAddon(null);
  };

  const handleUnsubscribe = async (addonId: string) => {
    if (!tenantId) return;
    setSubscribingAddon(addonId);
    try {
      await unsubscribeMutation.mutateAsync({
        tenantId,
        addonId,
      });
    } catch (error) {
      // Keep loading state visible on error, clear after short delay
      setTimeout(() => setSubscribingAddon(null), 500);
      throw error;
    }
    // Only clear on success
    setSubscribingAddon(null);
  };

  // Calculate current monthly total
  const subscribedAddons = addons.filter(a => subscribedAddonIds.has(a.addon_id));
  const monthlyTotal = subscribedAddons.reduce((sum, addon) => {
    if (userPlan === 'ai_powered') return 0; // AI-Powered gets everything free
    // Skip one-time payments from monthly total
    if (addon.billing_interval === 'one-time' || addon.billing_interval === null) return sum;
    if (addon.billing_interval === 'annual') return sum + addon.price_cents / 12;
    if (addon.billing_interval === 'quarterly') return sum + addon.price_cents / 3;
    return sum + addon.price_cents;
  }, 0);

  // Error state for pricing fetch failure
  if (pricingError) {
    return (
      <div className="p-6">
        <Card className="bg-zinc-950 border-zinc-800">
          <CardContent className="p-12 text-center space-y-4">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
            <h3 className="text-lg font-bold text-white">Failed to load add-ons</h3>
            <p className="text-zinc-400">There was a problem loading the available add-ons. Please try again.</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetchPricing()}
              className="border-zinc-700 text-zinc-400"
            >
              <RefreshCw size={14} className="mr-1" /> Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoadingPricing || isTenantLoading) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <div className="text-zinc-400">Loading add-ons...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight text-white font-serif">Add-ons</h1>
            <p className="text-zinc-400">Manage your subscription and add-ons</p>
          </div>
          <Badge variant="outline" className={cn(
            "px-4 py-2 text-sm font-bold",
            userPlan === 'free' ? "text-zinc-400 border-zinc-700" : "text-violet-400 border-violet-500/30"
          )}>
            {userPlan === 'free' ? 'Free Plan' : userPlan === 'standard' ? 'Standard Plan' : 'AI-Powered Plan'}
          </Badge>
        </div>

        {/* Summary Bar */}
        <Card className="bg-zinc-950 border-zinc-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div>
                  <p className="text-xs text-zinc-500 uppercase font-bold tracking-wider">Active Add-ons</p>
                  <p className="text-2xl font-bold text-white mt-1">{subscribedAddonIds.size}</p>
                </div>
                <div className="h-10 w-px bg-zinc-800" />
                <div>
                  <p className="text-xs text-zinc-500 uppercase font-bold tracking-wider">Monthly Total</p>
                  <p className="text-2xl font-bold text-white mt-1">
                    {userPlan === 'ai_powered' ? 'Included' : `$${(monthlyTotal / 100).toFixed(2)}/mo`}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="border-zinc-700 text-zinc-400"
              >
                View Invoices
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <Input
            placeholder="Search add-ons..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-zinc-950 border-zinc-800 text-white placeholder:text-zinc-500"
          />
        </div>
        <ToggleGroup
          type="single"
          value={categoryFilter}
          onValueChange={(v) => {
            // Validate that the value is one of the allowed categories
            if (v && CATEGORY_FILTERS.includes(v as typeof CATEGORY_FILTERS[number])) {
              setCategoryFilter(v as typeof CATEGORY_FILTERS[number]);
            }
          }}
          className="flex-wrap gap-1"
        >
          {CATEGORY_FILTERS.map((filter) => {
            const Icon = CATEGORY_ICONS[filter];
            return (
              <ToggleGroupItem
                key={filter}
                value={filter}
                className={cn(
                  "gap-2 px-4 h-10 bg-zinc-950/50 border border-zinc-800 text-zinc-400 text-xs font-bold uppercase tracking-wider data-[state=on]:bg-violet-600 data-[state=on]:text-white data-[state=on]:border-violet-500",
                  categoryFilter === filter && "glow-violet"
                )}
              >
                <Icon size={14} />
                {filter === 'all' ? 'All' : filter}
              </ToggleGroupItem>
            );
          })}
        </ToggleGroup>
      </div>

      {/* Add-ons Grid */}
      {Object.entries(groupedAddons).length === 0 ? (
        <Card className="bg-zinc-950 border-zinc-800">
          <CardContent className="p-12 text-center">
            <Search className="h-12 w-12 text-zinc-700 mx-auto mb-4" />
            <p className="text-zinc-400">No add-ons found matching your search.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedAddons).map(([category, categoryAddons]) => (
            <div key={category} className="space-y-4">
              <div className="flex items-center gap-2">
                {React.createElement(CATEGORY_ICONS[category as keyof typeof CATEGORY_ICONS] || Star, {
                  className: "h-5 w-5",
                  style: {
                    color: category === 'free' ? '#10b981' :
                           category === 'premium' ? '#f59e0b' :
                           category === 'ai' ? '#8b5cf6' : '#3b82f6'
                  }
                })}
                <h2 className="text-xl font-bold text-white capitalize">{category} Add-ons</h2>
                <Badge variant="outline" className="text-xs">
                  {categoryAddons.length}
                </Badge>
              </div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {categoryAddons.map((addon) => (
                  <AddonCard
                    key={addon.addon_id}
                    addon={addon}
                    isSubscribed={subscribedAddonIds.has(addon.addon_id)}
                    userPlan={userPlan}
                    onSubscribe={handleSubscribe}
                    onUnsubscribe={handleUnsubscribe}
                    isLoading={subscribingAddon === addon.addon_id}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
