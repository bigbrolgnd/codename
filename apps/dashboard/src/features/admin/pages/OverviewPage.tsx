import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, CreditCard, Users, Calendar as CalendarIcon } from 'lucide-react';
import { ActionFeed } from '../components/ActionFeed';

export const OverviewPage: React.FC = () => {
  return (
    <div className="p-6 space-y-8">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-white font-serif">Welcome back, Boss.</h1>
        <p className="text-zinc-500">Here's what happened with your business today.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-8 space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[
              { title: "Today's Revenue", value: "$450.00", icon: CreditCard, change: "+20.1% from yesterday" },
              { title: "Active Bookings", value: "12", icon: CalendarIcon, change: "+3 from yesterday" },
              { title: "Total Customers", value: "240", icon: Users, change: "+12 this month" },
              { title: "Site Health", value: "99.9%", icon: Activity, change: "All systems operational" },
            ].map((stat, i) => (
              <Card key={i} className="bg-zinc-900 border-zinc-800">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-zinc-400">{stat.title}</CardTitle>
                  <stat.icon className="h-4 w-4 text-zinc-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white font-mono">{stat.value}</div>
                  <p className="text-[10px] text-zinc-500 mt-1">{stat.change}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="h-64 rounded-2xl border border-zinc-800 bg-zinc-900/50 flex items-center justify-center p-8 border-dashed">
             <div className="text-center space-y-2">
                <p className="text-zinc-500 font-medium italic">"Real-time chart visualization coming in Epic 4"</p>
                <p className="text-[10px] uppercase tracking-widest text-zinc-600 font-bold">Pocket Data Scientist Placeholder</p>
             </div>
          </div>
        </div>

        <div className="lg:col-span-4">
          <ActionFeed tenantId="tenant_default" />
        </div>
      </div>
    </div>
  );
};
