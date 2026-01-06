import React from 'react';
import {
  LayoutDashboard,
  BarChart3,
  Calendar as CalendarIcon,
  Users,
  Rocket,
  Settings as SettingsIcon,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { AdminRoute, ADMIN_ROUTES } from '../constants/routes';
import { Branding } from './Branding';
import { trpc } from '@/lib/trpc';

interface SidebarProps {
  currentRoute: AdminRoute;
  onNavigate: (route: AdminRoute) => void;
  isMobile?: boolean;
  tenantId?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentRoute,
  onNavigate,
  isMobile,
  tenantId = 'tenant_default'
}) => {
  const { data: usage } = trpc.admin.getUsageStatus.useQuery(
    { tenantId },
    { refetchInterval: 30000 } // Refresh every 30s
  );

  const aiPercentage = usage?.aiPercentage ?? 0;
  const isCapped = usage?.isCapped ?? false;

  const menuItems = [
    { id: ADMIN_ROUTES.OVERVIEW, label: 'Overview', icon: LayoutDashboard },
    { id: ADMIN_ROUTES.INSIGHTS, label: 'Insights', icon: BarChart3 },
    { id: ADMIN_ROUTES.CALENDAR, label: 'Calendar', icon: CalendarIcon },
    { id: ADMIN_ROUTES.STAFF, label: 'Staff Management', icon: Users },
    { id: ADMIN_ROUTES.MARKETING, label: 'Marketing Hub', icon: Rocket },
    { id: ADMIN_ROUTES.SETTINGS, label: 'Settings', icon: SettingsIcon },
  ] as const;
  return (
    <aside className={cn(
      "bg-zinc-950 border-r border-zinc-800 flex flex-col h-full",
      isMobile ? "w-full" : "w-64"
    )}>
      <div className="p-6">
        <Branding className="mb-8" />

        <nav className="space-y-1">
          {menuItems.map((item) => {
            const isActive = currentRoute === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-200 group",
                  isActive 
                    ? "bg-zinc-900 text-white shadow-lg" 
                    : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/50"
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon size={18} className={cn(
                    "transition-colors",
                    isActive ? "text-emerald-500" : "group-hover:text-zinc-300"
                  )} />
                  <span className="text-sm font-medium">{item.label}</span>
                </div>
                {isActive && <ChevronRight size={14} className="text-emerald-500" />}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="mt-auto p-6">
        <div className="p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-zinc-500">Plan: Growth</span>
            <span className={cn(
              "text-[10px] uppercase font-bold",
              aiPercentage >= 100 ? "text-destructive" : "text-emerald-500"
            )}>
              {aiPercentage >= 100 ? 'Capped' : 'Active'}
            </span>
          </div>
          <div className="h-1 w-full bg-zinc-800 rounded-full overflow-hidden">
            <div 
              className={cn(
                "h-full transition-all duration-500",
                aiPercentage >= 90 ? "bg-destructive" : "bg-emerald-500"
              )} 
              style={{ width: `${aiPercentage}%` }} 
            />
          </div>
          <p className="text-[10px] text-zinc-500 leading-tight">
            {aiPercentage}% of your AI token limit used.
          </p>
        </div>
      </div>
    </aside>
  );
};
