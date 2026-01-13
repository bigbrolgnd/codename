import React from 'react';
import { AlertCircle, TrendingDown, Users, DollarSign } from 'lucide-react';

interface Metrics {
    conversion: number;
    kFactor: number;
    nps: number;
    ltvCac: number;
}

export const MetricAlarmBells = ({ metrics }: { metrics: Metrics }) => {
    const alarms = [];

    if (metrics.conversion < 0.01) {
        alarms.push({
            id: 'conv',
            title: 'Free tier burning cash',
            desc: 'Conversion < 1%',
            icon: <TrendingDown className="h-4 w-4" />
        });
    }

    if (metrics.kFactor < 0.2) {
        alarms.push({
            id: 'viral',
            title: 'Not viral, relying on paid acquisition',
            desc: 'K-factor < 0.2',
            icon: <Users className="h-4 w-4" />
        });
    }

    if (metrics.nps < 20) {
        alarms.push({
            id: 'nps',
            title: 'Users unhappy, churn will spike',
            desc: 'NPS < 20',
            icon: <AlertCircle className="h-4 w-4" />
        });
    }

    if (metrics.ltvCac < 1) {
        alarms.push({
            id: 'ltvcac',
            title: 'Losing money on every customer',
            desc: 'LTV/CAC < 1',
            icon: <DollarSign className="h-4 w-4" />
        });
    }

    if (alarms.length === 0) return null;

    return (
        <div className="space-y-3" data-testid="metric-alarms">
            {alarms.map(alarm => (
                <div key={alarm.id} className="flex items-start gap-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500">
                    <div className="mt-0.5">{alarm.icon}</div>
                    <div>
                        <div className="text-sm font-bold">{alarm.title}</div>
                        <div className="text-xs opacity-80">{alarm.desc}</div>
                    </div>
                </div>
            ))}
        </div>
    );
};