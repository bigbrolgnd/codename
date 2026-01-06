import React from 'react';
import { SocialAutoPilotCard } from '../components/SocialAutoPilotCard';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { Loader2, TrendingUp, Users, Target } from 'lucide-react';

interface MarketingPageProps {
  tenantId: string;
}

export const MarketingPage: React.FC<MarketingPageProps> = ({ tenantId }) => {
  const { data: settings, isLoading, refetch } = trpc.marketing.getSettings.useQuery({ tenantId });
  const updateMutation = trpc.marketing.updateSettings.useMutation({
    onSuccess: () => {
      toast.success('Marketing settings saved successfully!');
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to save settings: ${error.message}`);
    }
  });

  if (isLoading || !settings) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="animate-spin text-emerald-500" size={32} />
        <p className="text-zinc-500 text-sm font-medium">Loading your marketing engine...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-black tracking-tighter text-white uppercase italic">Marketing Hub</h1>
        <p className="text-zinc-400 text-sm">Configure automated growth and engagement strategies.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <SocialAutoPilotCard 
            settings={settings} 
            onSave={async (newSettings) => { await updateMutation.mutateAsync({ tenantId, settings: newSettings }); }}
            isSaving={updateMutation.isLoading}
          />
        </div>

        <div className="space-y-6">
          {/* Quick Stats / Tips */}
          <div className="bg-zinc-900/30 border border-zinc-800 rounded-2xl p-6 space-y-6">
            <h3 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
              <TrendingUp size={16} className="text-emerald-500" /> Growth Tips
            </h3>
            
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="h-8 w-8 rounded-lg bg-zinc-800 flex items-center justify-center shrink-0">
                  <Users size={16} className="text-zinc-400" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold text-zinc-200">Consistency is Key</p>
                  <p className="text-[10px] text-zinc-500 leading-relaxed">Businesses that post weekly see 3x more engagement than those that post monthly.</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="h-8 w-8 rounded-lg bg-zinc-800 flex items-center justify-center shrink-0">
                  <Target size={16} className="text-zinc-400" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold text-zinc-200">Multi-Channel Reach</p>
                  <p className="text-[10px] text-zinc-500 leading-relaxed">Cross-posting to Google Business helps your local SEO visibility significantly.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
