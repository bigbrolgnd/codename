import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, CreditCard, Users, Calendar as CalendarIcon } from 'lucide-react';
import { ActionFeed } from '../components/ActionFeed';
import { useTenant } from '@/contexts/TenantContext';

export const OverviewPage: React.FC = () => {
  const { tenantId } = useTenant();

  const statCards = [
    { title: "Today's Revenue", value: "$450.00", icon: CreditCard, change: "+20.1% from yesterday", color: 'violet' },
    { title: "Active Bookings", value: "12", icon: CalendarIcon, change: "+3 from yesterday", color: 'pink' },
    { title: "Total Customers", value: "240", icon: Users, change: "+12 this month", color: 'blue' },
    { title: "Site Health", value: "99.9%", icon: Activity, change: "All systems operational", color: 'violet' },
  ] as const;

  // Show error if tenant not available
  if (!tenantId) {
    return (
      <div className="p-6 flex flex-col items-center justify-center py-20 space-y-4">
        <p className="text-zinc-400">Tenant information not available. Please log in.</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-white font-serif">Welcome back, Boss.</h1>
        <p className="text-zinc-400">Here's what happened with your business today.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-8 space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {statCards.map((stat, i) => {
              const Icon = stat.icon;
              return (
                <Card key={i} className={`glass-card hover:glow-soft ${stat.color === 'violet' ? 'glass-violet' : stat.color === 'pink' ? 'glass-pink' : 'glass-blue'}`}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                    <CardTitle className="text-sm font-medium text-zinc-300">{stat.title}</CardTitle>
                    <div className="p-1.5 glass-frosted rounded-lg">
                      <Icon className="h-4 w-4 text-violet-400" />
                    </div>
                  </CardHeader>
                  <CardContent className="relative z-10">
                    <div className="text-2xl font-bold text-white font-mono">{stat.value}</div>
                    <p className="text-[10px] text-zinc-400 mt-1">{stat.change}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="h-64 rounded-2xl glass-card border border-white/5 flex items-center justify-center p-8">
             <div className="text-center space-y-2">
                <p className="text-zinc-400 font-medium italic">"Real-time chart visualization coming in Epic 4"</p>
                <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Pocket Data Scientist Placeholder</p>
             </div>
          </div>
        </div>

        <div className="lg:col-span-4">
          <ActionFeed tenantId={tenantId} />
        </div>
      </div>
    </div>
  );
};
