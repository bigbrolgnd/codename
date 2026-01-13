import React from 'react';
import {
  LayoutDashboard,
  BarChart3,
  Calendar as CalendarIcon,
  Users,
  Rocket,
  Settings as SettingsIcon,
  ChevronRight,
  Star
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { AdminRoute, ADMIN_ROUTES } from '../constants/routes';
import { Branding } from './Branding';
import { trpc } from '@/lib/trpc';
import { useTenant } from '@/contexts/TenantContext';

interface SidebarProps {
  currentRoute: AdminRoute;
  onNavigate: (route: AdminRoute) => void;
  isMobile?: boolean;
  tenantId?: string; // Optional prop for testing - context is used by default
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentRoute,
  onNavigate,
  isMobile,
  tenantId: propTenantId // Use prop if provided (for testing), otherwise use context
}) => {
  const { tenantId: contextTenantId } = useTenant();
  const tenantId = propTenantId ?? contextTenantId;

  const { data: usage } = trpc.admin.getUsageStatus.useQuery(
    { tenantId: tenantId ?? '' },
    { enabled: !!tenantId, refetchInterval: 30000 } // Refresh every 30s
  );

  const aiPercentage = usage?.aiPercentage ?? 0;
  const isCapped = usage?.isCapped ?? false;

  const menuItems = [
    { id: ADMIN_ROUTES.OVERVIEW, label: 'Overview', icon: LayoutDashboard },
    { id: ADMIN_ROUTES.INSIGHTS, label: 'Insights', icon: BarChart3 },
    { id: ADMIN_ROUTES.CALENDAR, label: 'Calendar', icon: CalendarIcon },
    { id: ADMIN_ROUTES.STAFF, label: 'Staff Management', icon: Users },
    { id: ADMIN_ROUTES.MARKETING, label: 'Marketing Hub', icon: Rocket },
    { id: ADMIN_ROUTES.ADDONS, label: 'Add-ons', icon: Star },
    { id: ADMIN_ROUTES.SETTINGS, label: 'Settings', icon: SettingsIcon },
  ] as const;
  return (
    <aside className={cn(
      "glass-surface border-r border-white/5 flex flex-col h-full",
      isMobile ? "w-full" : "w-64"
    )}>
      <div className="p-6">
        <Branding className="mb-8" />

        <nav className="space-y-1.5">
          {menuItems.map((item) => {
            const isActive = currentRoute === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  "w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-300 group relative overflow-hidden",
                  isActive
                    ? "glass-violet text-white glow-violet"
                    : "text-zinc-400 hover:text-white glass-dark"
                )}
              >
                {isActive && (
                  <div className="absolute inset-0 bg-gradient-to-r from-violet-500/20 to-transparent" />
                )}
                <div className="flex items-center gap-3 relative z-10">
                  <Icon size={18} className={cn(
                    "transition-colors",
                    isActive ? "text-violet-400" : "group-hover:text-violet-300"
                  )} />
                  <span className="text-sm font-medium">{item.label}</span>
                </div>
                {isActive && <ChevronRight size={14} className="text-violet-400 relative z-10" />}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="mt-auto p-6">
        <div className="glass-panel p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-zinc-400">Plan: Growth</span>
            <span className={cn(
              "text-[10px] uppercase font-bold",
              aiPercentage >= 100 ? "text-red-400" : "text-violet-400"
            )}>
              {aiPercentage >= 100 ? 'Capped' : 'Active'}
            </span>
          </div>
          <div className="h-1.5 w-full bg-zinc-800/50 rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500",
                aiPercentage >= 90
                  ? "bg-gradient-to-r from-red-500 to-orange-500"
                  : "bg-gradient-to-r from-violet-500 to-fuchsia-500"
              )}
              style={{ width: `${aiPercentage}%` }}
            />
          </div>
          <p className="text-[10px] text-zinc-400 leading-tight">
            {aiPercentage}% of your AI token limit used.
          </p>
        </div>
      </div>
    </aside>
  );
};
