/**
 * Billing and Usage Constants
 */
export const BILLING_CONFIG = {
  AI_COST_CAP_CENTS: 2000, // $20.00 hard limit
  VISIT_LIMIT: 50000,      // Monthly visit limit before overages
  OVERAGE_INCREMENT: 10000, // 10k visit blocks
  OVERAGE_FEE_CENTS: 1000,  // $10.00 per 10k visits
  
  CACHE_TTL_SECONDS: 300,   // 5 minutes for usage stats
};
