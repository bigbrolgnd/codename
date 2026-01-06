import { BILLING_CONFIG } from './billing.constants';

/**
 * Simple in-memory cache to simulate Redis for high-frequency usage checks
 */
class UsageCache {
  private cache = new Map<string, { value: number, expires: number }>();

  async get(key: string): Promise<number | null> {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expires) {
      this.cache.delete(key);
      return null;
    }
    return entry.value;
  }

  async set(key: string, value: number, ttlSeconds: number) {
    this.cache.set(key, {
      value,
      expires: Date.now() + (ttlSeconds * 1000)
    });
  }

  async incr(key: string, amount: number) {
    const current = await this.get(key) || 0;
    await this.set(key, current + amount, BILLING_CONFIG.CACHE_TTL_SECONDS);
  }

  async delete(key: string) {
    this.cache.delete(key);
  }

  clear() {
    this.cache.clear();
  }
}

export const usageCache = new UsageCache();
