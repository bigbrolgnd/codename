import type { StateStorage } from 'zustand/middleware';

/**
 * Custom debounced storage to avoid excessive I/O
 */
export const createDebouncedStorage = (storage: StateStorage, delay = 500): StateStorage => {
  const timers = new Map<string, ReturnType<typeof setTimeout>>();

  return {
    getItem: (name: string) => storage.getItem(name),
    setItem: (name: string, value: string) => {
      if (timers.has(name)) {
        clearTimeout(timers.get(name));
      }

      timers.set(
        name,
        setTimeout(() => {
          storage.setItem(name, value);
          timers.delete(name);
        }, delay)
      );
    },
    removeItem: (name: string) => {
      if (timers.has(name)) {
        clearTimeout(timers.get(name));
        timers.delete(name);
      }
      storage.removeItem(name);
    },
  };
};

/**
 * Tenant-scoped key generator
 */
export const getTenantStorageKey = (tenantId: string) => `theme-editor-${tenantId}`;