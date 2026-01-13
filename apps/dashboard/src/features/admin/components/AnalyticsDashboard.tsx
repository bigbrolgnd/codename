import React from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { trpc } from '@/lib/trpc';

export const AnalyticsDashboard = () => {
    const { data: growth } = trpc.analytics.getGrowthMetrics.useQuery();
    const { data: viral } = trpc.analytics.getViralMetrics.useQuery();
    const { data: funnel } = trpc.analytics.getFunnelMetrics.useQuery();
    const { data: financial } = trpc.analytics.getFinancialMetrics.useQuery();

    return (
        <div className="p-6 space-y-6">
            <h1 className="text-3xl font-bold tracking-tight text-white font-serif">Platform Analytics</h1>
            
            <Tabs defaultValue="growth" className="w-full">
                <TabsList className="bg-zinc-950 border border-zinc-800">
                    <TabsTrigger value="growth">Growth</TabsTrigger>
                    <TabsTrigger value="viral">Viral</TabsTrigger>
                    <TabsTrigger value="funnel">Funnel</TabsTrigger>
                    <TabsTrigger value="financial">Financial</TabsTrigger>
                </TabsList>
                
                <TabsContent value="growth" className="mt-6 space-y-4">
                    <h2 className="text-xl font-bold text-white">Growth Metrics</h2>
                    <div className="grid gap-4 md:grid-cols-3">
                        <Card><CardHeader><CardTitle className="text-sm font-medium">Free Users</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{growth?.freeUsers || 0}</div></CardContent></Card>
                        <Card><CardHeader><CardTitle className="text-sm font-medium">Standard Users</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{growth?.standardUsers || 0}</div></CardContent></Card>
                        <Card><CardHeader><CardTitle className="text-sm font-medium">AI Users</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{growth?.aiUsers || 0}</div></CardContent></Card>
                    </div>
                </TabsContent>

                <TabsContent value="viral" className="mt-6 space-y-4">
                    <h2 className="text-xl font-bold text-white">Viral Metrics</h2>
                    <div className="grid gap-4 md:grid-cols-2">
                        <Card><CardHeader><CardTitle className="text-sm font-medium">K-Factor</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{viral?.kFactor || 0}</div></CardContent></Card>
                        <Card><CardHeader><CardTitle className="text-sm font-medium">Referrals</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{viral?.referralCount || 0}</div></CardContent></Card>
                    </div>
                </TabsContent>

                <TabsContent value="funnel" className="mt-6 space-y-4">
                    <h2 className="text-xl font-bold text-white">Funnel Metrics</h2>
                    <div className="grid gap-4">
                        {funnel?.stages?.length ? funnel.stages.map((stage: any) => (
                            <Card key={stage.name}>
                                <CardHeader><CardTitle className="text-sm font-medium">{stage.name}</CardTitle></CardHeader>
                                <CardContent><div className="text-2xl font-bold">{stage.count}</div></CardContent>
                            </Card>
                        )) : (
                            <Card><CardContent className="py-4">No funnel data available yet</CardContent></Card>
                        )}
                    </div>
                </TabsContent>

                <TabsContent value="financial" className="mt-6 space-y-4">
                    <h2 className="text-xl font-bold text-white">Financial Metrics</h2>
                    <div className="grid gap-4 md:grid-cols-2">
                        <Card><CardHeader><CardTitle className="text-sm font-medium">MRR</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">${financial?.mrr || 0}</div></CardContent></Card>
                        <Card><CardHeader><CardTitle className="text-sm font-medium">LTV/CAC</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{financial?.ltvCac || 0}</div></CardContent></Card>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
};
