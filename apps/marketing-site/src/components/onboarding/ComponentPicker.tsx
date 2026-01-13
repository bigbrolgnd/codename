/**
 * ComponentPicker Component
 *
 * Step 4: User selects optional components to add to their website.
 * Displays pricing information and validates plan requirements.
 */

import { useState, useEffect, useMemo, useCallback } from 'react';

interface ComponentOption {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'free' | 'premium' | 'ai' | 'infrastructure';
  price: number | null;
  priceDisplay?: string;
  defaultEnabled?: boolean;
}

interface BasePlan {
  price: number;
  display: string;
  features: string[];
}

interface PricingData {
  updatedAt: string;
  basePlans: {
    free: BasePlan;
    standard: BasePlan;
    ai_powered: BasePlan;
  };
  components: {
    free: ComponentOption[];
    premium: ComponentOption[];
    ai: ComponentOption[];
    infrastructure: ComponentOption[];
  };
  billingIntervals: {
    monthly: { multiplier: number; discount: number };
    quarterly: { multiplier: number; discount: number };
    annual: { multiplier: number; discount: number };
  };
}

interface ComponentPickerProps {
  onContinue: (selectedComponents: string[], planType: 'free' | 'standard' | 'ai_powered', billingInterval: 'monthly' | 'quarterly' | 'annual', totalPrice: number) => void;
  onSkip?: () => void;
}

type BillingInterval = 'monthly' | 'quarterly' | 'annual';
type PlanType = 'free' | 'standard' | 'ai_powered';

// Shared glass card style - extracted to avoid duplication
const GLASS_CARD_STYLE = `
  .glass-card {
    background: rgba(17, 17, 17, 0.6);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid rgba(213, 82, 183, 0.3);
  }
`;

// Validate pricing data structure
function validatePricingData(data: unknown): data is PricingData {
  if (!data || typeof data !== 'object') return false;

  const d = data as Record<string, unknown>;

  // Check basePlans
  if (!d.basePlans || typeof d.basePlans !== 'object') return false;
  const basePlans = d.basePlans as Record<string, unknown>;
  if (!basePlans.free || !basePlans.standard || !basePlans.ai_powered) return false;

  // Check components
  if (!d.components || typeof d.components !== 'object') return false;
  const components = d.components as Record<string, unknown>;
  if (!Array.isArray(components.free)) return false;
  if (!Array.isArray(components.premium)) return false;
  if (!Array.isArray(components.ai)) return false;
  // infrastructure is optional
  if (components.infrastructure !== undefined && !Array.isArray(components.infrastructure)) return false;

  // Check billingIntervals
  if (!d.billingIntervals || typeof d.billingIntervals !== 'object') return false;

  return true;
}

export function ComponentPicker({ onContinue, onSkip }: ComponentPickerProps) {
  const [pricing, setPricing] = useState<PricingData | null>(null);
  const [selectedComponents, setSelectedComponents] = useState<Set<string>>(new Set());
  const [billingInterval, setBillingInterval] = useState<BillingInterval>('monthly');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch pricing on mount with error handling
  useEffect(() => {
    let isMounted = true;

    const fetchPricing = async () => {
      try {
        const response = await fetch('/pricing.json');
        if (!response.ok) {
          throw new Error(`Failed to load pricing: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();

        // Validate data structure
        if (!validatePricingData(data)) {
          throw new Error('Invalid pricing data format');
        }

        if (isMounted) {
          setPricing(data);
          setIsLoading(false);

          // Set default enabled components
          const defaults = new Set<string>();
          Object.values(data.components).flat().forEach((comp) => {
            if (comp && typeof comp === 'object' && 'defaultEnabled' in comp && comp.defaultEnabled) {
              defaults.add((comp as ComponentOption).id);
            }
          });
          setSelectedComponents(defaults);
        }
      } catch (err) {
        console.error('Failed to load pricing:', err);
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to load pricing data');
          setIsLoading(false);
        }
      }
    };

    fetchPricing();

    return () => {
      isMounted = false;
    };
  }, []);

  // Memoized component toggle
  const toggleComponent = useCallback((id: string) => {
    setSelectedComponents((prev) => {
      const newSelected = new Set(prev);
      if (newSelected.has(id)) {
        newSelected.delete(id);
      } else {
        newSelected.add(id);
      }
      return newSelected;
    });
  }, []);

  // Memoized: Get selected component details
  const selectedComponentsList = useMemo((): ComponentOption[] => {
    if (!pricing) return [];
    const allComponents = [
      ...pricing.components.free,
      ...pricing.components.premium,
      ...pricing.components.ai,
      ...(pricing.components.infrastructure || []),
    ];
    return allComponents.filter((c) => selectedComponents.has(c.id));
  }, [pricing, selectedComponents]);

  // Memoized: Calculate plan requirements
  const planRequirements = useMemo((): { planType: PlanType; reason: string } => {
    if (!pricing) return { planType: 'free', reason: 'Free site available' };

    const hasPremium = selectedComponentsList.some((c) => c.category === 'premium' || c.category === 'infrastructure');
    const hasAI = selectedComponentsList.some((c) => c.category === 'ai');

    if (hasAI) {
      return { planType: 'ai_powered', reason: 'AI-Powered Plan required for AI features' };
    }
    if (hasPremium) {
      return { planType: 'standard', reason: 'Standard Plan required for premium add-ons' };
    }
    return { planType: 'free', reason: 'Your site is ready!' };
  }, [pricing, selectedComponentsList]);

  // Memoized: Get plan type details
  const planTypeDetails = useMemo(() => {
    if (!pricing) return { planType: 'free' as PlanType, planRequirements: { price: 0, display: '$0' } };

    const { planType } = planRequirements;
    const planDetails = pricing.basePlans[planType];
    return { planType, planRequirements: planDetails };
  }, [pricing, planRequirements]);

  // Memoized: Apply billing discount
  const applyBillingDiscount = useCallback((priceCents: number, interval: BillingInterval): number => {
    if (!pricing) return priceCents;

    const { multiplier, discount } = pricing.billingIntervals[interval];
    const monthlyPrice = priceCents / multiplier;
    return Math.round(monthlyPrice * (1 - discount));
  }, [pricing]);

  // Memoized: Calculate total price
  const totalPrice = useMemo((): number => {
    if (!pricing) return 0;

    // Base price with billing interval
    const basePrice = planTypeDetails.planRequirements.price;
    const basePriceMonthly = applyBillingDiscount(basePrice, billingInterval);

    // Add-ons (already monthly pricing)
    const addonsTotal = selectedComponentsList
      .filter((c) => c.category === 'premium' || c.category === 'ai' || c.category === 'infrastructure')
      .reduce((sum, c) => sum + (c.price || 0), 0);

    return basePriceMonthly + addonsTotal;
  }, [pricing, planTypeDetails, billingInterval, applyBillingDiscount, selectedComponentsList]);

  // Memoized: Total price display
  const totalPriceDisplay = useMemo(() => {
    return totalPrice === 0 ? 'FREE' : `$${(totalPrice / 100).toFixed(2)}/mo`;
  }, [totalPrice]);

  // Memoized: Show AI upsell
  const showAIUpsell = useMemo(() => {
    return selectedComponentsList.filter((c) => c.category === 'premium').length >= 5;
  }, [selectedComponentsList]);

  // Handle AI upsell click - switches all premium to AI plan
  const handleAIUpsellClick = useCallback(() => {
    if (!pricing) return;
    // The AI plan includes all premium add-ons, so we could clear the premium selection
    // or just show them as "included". For now, the upsell shows savings but doesn't change selection.
    // Future: could deselect premium components since they're included in AI plan.
  }, [pricing]);

  // Handle continue
  const handleContinue = useCallback(() => {
    onContinue(
      Array.from(selectedComponents),
      planRequirements.planType,
      billingInterval,
      totalPrice
    );
  }, [selectedComponents, planRequirements.planType, billingInterval, totalPrice, onContinue]);

  // Loading state
  if (isLoading) {
    return (
      <div className="glass-card p-8 rounded-xl text-center">
        <div className="text-white text-lg">Loading pricing...</div>
      </div>
    );
  }

  // Error state
  if (error || !pricing) {
    return (
      <div className="glass-card p-8 rounded-xl text-center border border-red-500/50 bg-red-500/10">
        <div className="text-red-400 text-lg mb-2">Failed to load pricing</div>
        <p className="text-[var(--text-muted)] mb-4">{error || 'Pricing data unavailable'}</p>
        <button
          onClick={() => window.location.reload()}
          className="bg-[var(--color-accent)] hover:bg-[var(--color-accent-light)] text-white px-6 py-2 rounded-lg font-semibold"
        >
          Retry
        </button>
      </div>
    );
  }

  const { planType } = planTypeDetails;
  const savings = showAIUpsell && planType === 'standard'
    ? (totalPrice - pricing.basePlans.ai_powered.price) / 100
    : 0;

  return (
    <div>
      {/* Plan Requirements Banner */}
      <div className={`glass-card p-4 rounded-xl mb-6 border ${
        planType === 'free' ? 'border-green-500/50 bg-green-500/10' :
        planType === 'standard' ? 'border-yellow-500/50 bg-yellow-500/10' :
        'border-purple-500/50 bg-purple-500/10'
      }`}>
        <div className="flex items-center justify-between">
          <div>
            {planType === 'free' && (
              <>
                <span className="text-green-400 font-semibold">✅ FREE - {planRequirements.reason}</span>
                <p className="text-sm text-[var(--text-muted)] mt-1">5,000 visits/month included</p>
              </>
            )}
            {planType === 'standard' && (
              <>
                <span className="text-yellow-400 font-semibold">💎 Requires Standard Plan ({planTypeDetails.planRequirements.display}/mo)</span>
                <p className="text-sm text-[var(--text-muted)] mt-1">Premium add-ons require base subscription</p>
              </>
            )}
            {planType === 'ai_powered' && (
              <>
                <span className="text-purple-400 font-semibold">🤖 AI-Powered Plan ({planTypeDetails.planRequirements.display}/mo)</span>
                <p className="text-sm text-[var(--text-muted)] mt-1">All premium add-ons included free!</p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Billing Interval Selector */}
      <div className="glass-card p-4 rounded-xl mb-6">
        <label className="text-white text-sm font-medium mb-2 block">Billing Interval</label>
        <div className="flex gap-4">
          {Object.entries(pricing.billingIntervals).map(([interval, config]) => {
            const discount = config.discount > 0 ? `Save ${config.discount * 100}%` : '';
            return (
              <button
                key={interval}
                onClick={() => setBillingInterval(interval as BillingInterval)}
                className={`
                  flex-1 p-3 rounded-lg border transition-all
                  ${billingInterval === interval
                    ? 'bg-[var(--color-accent)] border-[var(--color-accent)] text-white'
                    : 'bg-white/5 border-white/20 text-[var(--text-muted)] hover:border-[var(--color-accent)]/50'
                  }
                `}
              >
                <div className="font-semibold capitalize">{interval}</div>
                {discount && <div className="text-xs opacity-80">{discount}</div>}
              </button>
            );
          })}
        </div>
      </div>

      {/* AI Plan Upsell - Now with click handler */}
      {showAIUpsell && planType === 'standard' && savings > 0 && (
        <div
          onClick={handleAIUpsellClick}
          className="glass-card p-4 rounded-xl mb-6 border border-purple-500/30 bg-purple-500/10 cursor-pointer hover:bg-purple-500/15 transition-all"
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && handleAIUpsellClick()}
        >
          <div className="flex items-start gap-3">
            <span className="text-2xl">💡</span>
            <div>
              <div className="text-purple-300 font-semibold">Pro Tip: Upgrade to AI-Powered Plan</div>
              <p className="text-sm text-[var(--text-muted)] mt-1">
                Our AI-Powered plan ({pricing.basePlans.ai_powered.display}/mo) includes all add-ons free! You'll save ${savings.toFixed(2)}/mo.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Component Grid - Free Section */}
      {pricing.components.free.length > 0 && (
        <div className="mb-6">
          <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-green-500/20 border border-green-500/50 flex items-center justify-center text-xs">✓</span>
            Free Components
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            {pricing.components.free.map((component) => {
              const isSelected = selectedComponents.has(component.id);
              return (
                <div
                  key={component.id}
                  className={`
                    glass-card p-5 rounded-xl transition-all duration-300
                    ${isSelected ? 'border-green-500/50 shadow-[0_0_20px_rgba(34,197,94,0.3)]' : ''}
                    hover:shadow-[0_0_15px_rgba(34,197,94,0.2)] hover:-translate-y-1
                  `}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="text-3xl">{component.icon}</div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-white font-semibold">{component.name}</h3>
                          <span className="px-2 py-0.5 text-xs rounded-full bg-green-500/20 border border-green-500/50 text-green-400">FREE</span>
                        </div>
                        <p className="text-[var(--text-muted)] text-sm">{component.description}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => toggleComponent(component.id)}
                      className={`
                        relative w-12 h-6 rounded-full transition-colors duration-200 flex-shrink-0
                        ${isSelected ? 'bg-green-500' : 'bg-white/20'}
                      `}
                      aria-label={`Toggle ${component.name}`}
                    >
                      <div
                        className={`
                          absolute top-1 w-4 h-4 rounded-full bg-white transition-transform duration-200
                          ${isSelected ? 'left-7' : 'left-1'}
                        `}
                      />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Component Grid - Premium Section */}
      {pricing.components.premium.length > 0 && (
        <div className="mb-6">
          <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-yellow-500/20 border border-yellow-500/50 flex items-center justify-center text-xs">$</span>
            Premium Add-ons
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            {pricing.components.premium.map((component) => {
              const isSelected = selectedComponents.has(component.id);
              return (
                <div
                  key={component.id}
                  className={`
                    glass-card p-5 rounded-xl transition-all duration-300
                    ${isSelected ? 'border-yellow-500/50 shadow-[0_0_20px_rgba(234,179,8,0.3)]' : ''}
                    hover:shadow-[0_0_15px_rgba(234,179,8,0.2)] hover:-translate-y-1
                  `}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="text-3xl">{component.icon}</div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-white font-semibold">{component.name}</h3>
                          <span className="px-2 py-0.5 text-xs rounded-full bg-yellow-500/20 border border-yellow-500/50 text-yellow-400">
                            {component.priceDisplay}
                          </span>
                        </div>
                        <p className="text-[var(--text-muted)] text-sm">{component.description}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => toggleComponent(component.id)}
                      className={`
                        relative w-12 h-6 rounded-full transition-colors duration-200 flex-shrink-0
                        ${isSelected ? 'bg-[var(--color-accent)]' : 'bg-white/20'}
                      `}
                      aria-label={`Toggle ${component.name}`}
                    >
                      <div
                        className={`
                          absolute top-1 w-4 h-4 rounded-full bg-white transition-transform duration-200
                          ${isSelected ? 'left-7' : 'left-1'}
                        `}
                      />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Component Grid - AI Section */}
      {pricing.components.ai.length > 0 && (
        <div className="mb-6">
          <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-purple-500/20 border border-purple-500/50 flex items-center justify-center text-xs">🤖</span>
            AI Features
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            {pricing.components.ai.map((component) => {
              const isSelected = selectedComponents.has(component.id);
              return (
                <div
                  key={component.id}
                  className={`
                    glass-card p-5 rounded-xl transition-all duration-300
                    ${isSelected ? 'border-purple-500/50 shadow-[0_0_20px_rgba(168,85,247,0.3)]' : ''}
                    hover:shadow-[0_0_15px_rgba(168,85,247,0.2)] hover:-translate-y-1
                  `}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="text-3xl">{component.icon}</div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-white font-semibold">{component.name}</h3>
                          <span className="px-2 py-0.5 text-xs rounded-full bg-purple-500/20 border border-purple-500/50 text-purple-400">
                            AI
                          </span>
                          <span className="px-2 py-0.5 text-xs rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300">
                            {component.priceDisplay}
                          </span>
                        </div>
                        <p className="text-[var(--text-muted)] text-sm">{component.description}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => toggleComponent(component.id)}
                      className={`
                        relative w-12 h-6 rounded-full transition-colors duration-200 flex-shrink-0
                        ${isSelected ? 'bg-[var(--color-accent)]' : 'bg-white/20'}
                      `}
                      aria-label={`Toggle ${component.name}`}
                    >
                      <div
                        className={`
                          absolute top-1 w-4 h-4 rounded-full bg-white transition-transform duration-200
                          ${isSelected ? 'left-7' : 'left-1'}
                        `}
                      />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Component Grid - Infrastructure Section (if any) */}
      {pricing.components.infrastructure && pricing.components.infrastructure.length > 0 && (
        <div className="mb-6">
          <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-blue-500/20 border border-blue-500/50 flex items-center justify-center text-xs">🔧</span>
            Infrastructure
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            {pricing.components.infrastructure.map((component) => {
              const isSelected = selectedComponents.has(component.id);
              return (
                <div
                  key={component.id}
                  className={`
                    glass-card p-5 rounded-xl transition-all duration-300
                    ${isSelected ? 'border-blue-500/50 shadow-[0_0_20px_rgba(59,130,246,0.3)]' : ''}
                    hover:shadow-[0_0_15px_rgba(59,130,246,0.2)] hover:-translate-y-1
                  `}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="text-3xl">{component.icon}</div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-white font-semibold">{component.name}</h3>
                          <span className="px-2 py-0.5 text-xs rounded-full bg-blue-500/20 border border-blue-500/50 text-blue-400">
                            {component.priceDisplay}
                          </span>
                        </div>
                        <p className="text-[var(--text-muted)] text-sm">{component.description}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => toggleComponent(component.id)}
                      className={`
                        relative w-12 h-6 rounded-full transition-colors duration-200 flex-shrink-0
                        ${isSelected ? 'bg-[var(--color-accent)]' : 'bg-white/20'}
                      `}
                      aria-label={`Toggle ${component.name}`}
                    >
                      <div
                        className={`
                          absolute top-1 w-4 h-4 rounded-full bg-white transition-transform duration-200
                          ${isSelected ? 'left-7' : 'left-1'}
                        `}
                      />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Sticky Price Summary Bar */}
      <div className="fixed bottom-0 left-0 right-0 glass-card border-t border-[var(--color-accent)]/30 p-4 z-50 min-h-24">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <div className="text-sm text-[var(--text-muted)]">Total Monthly</div>
            <div className="text-2xl font-bold text-white">{totalPriceDisplay}</div>
          </div>
          <div className="flex gap-4">
            <button
              onClick={onSkip}
              className="border border-[var(--color-accent)]/50 text-white px-6 py-2 rounded-lg font-semibold transition-all hover:bg-[var(--color-accent)]/10 cursor-pointer"
            >
              Skip
            </button>
            <button
              onClick={handleContinue}
              className="bg-[var(--color-accent)] hover:bg-[var(--color-accent-light)] text-white px-8 py-2 rounded-lg font-semibold transition-all hover:scale-105 hover:shadow-[0_0_30px_var(--color-accent-glow)] cursor-pointer"
            >
              Preview My Site ({selectedComponents.size} selected)
            </button>
          </div>
        </div>
      </div>

      {/* Inline styles */}
      <style>{GLASS_CARD_STYLE}</style>
    </div>
  );
}
