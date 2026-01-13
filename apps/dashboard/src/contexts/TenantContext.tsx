import React, { createContext, useContext, useState, useEffect } from 'react';

/**
 * Tenant Context
 *
 * Provides the current tenant ID for the authenticated user.
 * This is a placeholder implementation - in production, this would come from:
 * - JWT token decoded from auth session
 * - Server-side session data
 * - OAuth provider claims
 *
 * For now, we store in localStorage to allow manual tenant switching
 * during development and testing.
 */

interface TenantContextValue {
  tenantId: string | null;
  setTenantId: (tenantId: string) => void;
  isLoading: boolean;
}

const TenantContext = createContext<TenantContextValue | undefined>(undefined);

const TENANT_STORAGE_KEY = 'znapsite_current_tenant';

export function TenantProvider({ children }: { children: React.ReactNode }) {
  const [tenantId, setTenantIdState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load tenant ID from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(TENANT_STORAGE_KEY);
    if (stored) {
      setTenantIdState(stored);
    } else {
      // Default to demo tenant for development
      setTenantIdState('tenant_default');
    }
    setIsLoading(false);
  }, []);

  const setTenantId = (newTenantId: string) => {
    setTenantIdState(newTenantId);
    localStorage.setItem(TENANT_STORAGE_KEY, newTenantId);
  };

  return (
    <TenantContext.Provider value={{ tenantId, setTenantId, isLoading }}>
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  const context = useContext(TenantContext);
  if (context === undefined) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
}
