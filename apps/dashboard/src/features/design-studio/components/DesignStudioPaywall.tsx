import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, Palette, Type, Layout, CheckCircle2, Loader2 } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';

interface DesignStudioPaywallProps {
  tenantId: string;
  onSuccess: () => void;
  price?: string;
}

export const DesignStudioPaywall: React.FC<DesignStudioPaywallProps> = ({ 
  tenantId, 
  onSuccess,
  price = '$15'
}) => {
  const subscribeMutation = trpc.admin.subscribeToDesignStudio.useMutation({
    onSuccess: () => {
      toast.success('Subscription activated! Welcome to Design Studio.');
      onSuccess();
    },
    onError: (error) => {
      toast.error(`Failed to activate subscription: ${error.message}`);
    },
  });

  const handleSubscribe = () => {
    subscribeMutation.mutate({ tenantId });
  };

  const features = [
    {
      icon: Palette,
      title: 'Full Color Control',
      description: 'Customize every brand color with OKLCH precision.',
    },
    {
      icon: Type,
      title: 'Typography Editor',
      description: 'Choose from premium font stacks and adjust spacing.',
    },
    {
      icon: Layout,
      title: 'Shape & Shadows',
      description: 'Fine-tune border radius and visual depth of your site.',
    },
    {
      icon: Sparkles,
      title: 'Theme Presets',
      description: 'One-click professional themes designed by experts.',
    },
  ];

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] p-6 max-w-4xl mx-auto space-y-12">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs font-bold uppercase tracking-widest animate-bounce">
          Premium Feature
        </div>
        <h1 className="text-5xl font-black tracking-tighter uppercase italic">
          High-Fidelity <span className="text-emerald-500">Expression</span>
        </h1>
        <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
          Take total control over your brand aesthetic. The Design Studio is for creators who
          value aesthetics over everything.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
        {features.map((feature) => (
          <Card key={feature.title} className="bg-zinc-900/50 border-zinc-800">
            <CardHeader className="flex flex-row items-center gap-4 space-y-0">
              <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                <feature.icon size={20} />
              </div>
              <div className="space-y-1">
                <CardTitle className="text-base font-bold">{feature.title}</CardTitle>
                <CardDescription className="text-xs">{feature.description}</CardDescription>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>

      <Card className="w-full bg-emerald-500 border-none shadow-2xl shadow-emerald-500/20">
        <CardContent className="p-8 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-2 text-white text-center md:text-left">
            <h3 className="text-2xl font-bold italic">Design Studio Add-on</h3>
            <p className="text-emerald-100 font-medium">
              Unlimited customization for your digital presence.
            </p>
            <div className="flex items-center gap-4 pt-2">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider">
                <CheckCircle2 size={14} /> WCAG Accessibility
              </div>
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider">
                <CheckCircle2 size={14} /> Live Previews
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center gap-4 shrink-0">
            <div className="text-center">
              <span className="text-4xl font-black text-white">{price}</span>
              <span className="text-emerald-100 font-bold">/mo</span>
            </div>
            <Button
              size="lg"
              className="bg-white text-emerald-600 hover:bg-zinc-100 font-black uppercase italic tracking-tighter px-8 h-12 text-lg"
              onClick={handleSubscribe}
              disabled={subscribeMutation.isLoading}
            >
              {subscribeMutation.isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Processing...
                </>
              ) : (
                'Unlock Now'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">
        Included automatically in the <span className="text-zinc-300">AI-Powered Plan ($79/mo)</span>
      </p>
    </div>
  );
};
