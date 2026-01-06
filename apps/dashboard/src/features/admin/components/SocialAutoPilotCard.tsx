import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Sparkles, Calendar, Globe, Instagram, Save, Rocket } from 'lucide-react';
import { MarketingSettings, UpdateMarketingSettings } from '@codename/api';
import { cn } from '@/lib/utils';

interface SocialAutoPilotCardProps {
  settings: MarketingSettings;
  onSave: (settings: UpdateMarketingSettings) => Promise<void>;
  isSaving?: boolean;
}

export const SocialAutoPilotCard: React.FC<SocialAutoPilotCardProps> = ({
  settings: initialSettings,
  onSave,
  isSaving = false
}) => {
  const [settings, setSettings] = useState<UpdateMarketingSettings>({
    autoPilotEnabled: initialSettings.autoPilotEnabled,
    frequency: initialSettings.frequency,
    tone: initialSettings.tone,
    platforms: initialSettings.platforms
  });

  const handleToggle = () => {
    setSettings(prev => ({ ...prev, autoPilotEnabled: !prev.autoPilotEnabled }));
  };

  const handleFrequencyChange = (value: string) => {
    if (value) setSettings(prev => ({ ...prev, frequency: value as any }));
  };

  const handleToneChange = (value: string) => {
    if (value) setSettings(prev => ({ ...prev, tone: value as any }));
  };

  const handlePlatformToggle = (platform: 'google' | 'instagram') => {
    setSettings(prev => {
      const platforms = prev.platforms.includes(platform)
        ? prev.platforms.filter(p => p !== platform)
        : [...prev.platforms, platform];
      return { ...prev, platforms };
    });
  };

  return (
    <Card className="bg-zinc-950 border-zinc-800 shadow-2xl overflow-hidden">
      <CardHeader className="border-b border-zinc-900 pb-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-xl font-bold text-white flex items-center gap-2">
              <Rocket size={20} className="text-emerald-500" /> Social Auto-Pilot
            </CardTitle>
            <p className="text-xs text-zinc-500">Automate your business growth on social media</p>
          </div>
          <Button
            variant={settings.autoPilotEnabled ? "default" : "outline"}
            onClick={handleToggle}
            className={cn(
              "rounded-full px-6 transition-all",
              settings.autoPilotEnabled 
                ? "bg-emerald-600 hover:bg-emerald-500 text-white" 
                : "border-zinc-800 text-zinc-500 hover:text-white"
            )}
          >
            {settings.autoPilotEnabled ? 'Enabled' : 'Disabled'}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-8">
        {/* Frequency & Tone */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-zinc-500">
              <Calendar size={14} /> Posting Frequency
            </div>
            <Select 
              value={settings.frequency} 
              onValueChange={handleFrequencyChange}
              disabled={!settings.autoPilotEnabled}
            >
              <SelectTrigger className="bg-zinc-900/50 border-zinc-800 text-zinc-200 h-12">
                <SelectValue placeholder="Select frequency" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-200">
                <SelectItem value="weekly">Every Week (Recommended)</SelectItem>
                <SelectItem value="bi-weekly">Every Two Weeks</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-zinc-500">
              <Sparkles size={14} /> Content Tone
            </div>
            <ToggleGroup 
              type="single" 
              value={settings.tone} 
              onValueChange={handleToneChange}
              disabled={!settings.autoPilotEnabled}
              className="justify-start gap-2"
            >
              {['professional', 'enthusiastic', 'educational'].map((tone) => (
                <ToggleGroupItem 
                  key={tone} 
                  value={tone}
                  className="h-10 px-4 bg-zinc-900/50 border border-zinc-800 data-[state=on]:bg-emerald-600 data-[state=on]:text-white text-zinc-400 text-xs capitalize"
                >
                  {tone}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>
        </div>

        {/* Platforms */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-zinc-500">
            <Globe size={14} /> Target Platforms
          </div>
          <div className="flex gap-4">
            <button
              disabled={!settings.autoPilotEnabled}
              onClick={() => handlePlatformToggle('google')}
              className={cn(
                "flex-1 p-4 rounded-xl border transition-all flex flex-col items-center gap-3",
                settings.platforms.includes('google')
                  ? "bg-emerald-500/10 border-emerald-500 text-emerald-500"
                  : "bg-zinc-900/30 border-zinc-800 text-zinc-500 opacity-50"
              )}
            >
              <div className={cn("p-2 rounded-lg", settings.platforms.includes('google') ? "bg-emerald-500 text-zinc-950" : "bg-zinc-800")}>
                <Globe size={20} />
              </div>
              <span className="text-xs font-bold">Google Business</span>
            </button>

            <button
              disabled={!settings.autoPilotEnabled}
              onClick={() => handlePlatformToggle('instagram')}
              className={cn(
                "flex-1 p-4 rounded-xl border transition-all flex flex-col items-center gap-3",
                settings.platforms.includes('instagram')
                  ? "bg-pink-500/10 border-pink-500 text-pink-500"
                  : "bg-zinc-900/30 border-zinc-800 text-zinc-500 opacity-50"
              )}
            >
              <div className={cn("p-2 rounded-lg", settings.platforms.includes('instagram') ? "bg-pink-500 text-white" : "bg-zinc-800")}>
                <Instagram size={20} />
              </div>
              <span className="text-xs font-bold">Instagram Feed</span>
            </button>
          </div>
        </div>

        {initialSettings.nextPostAt && settings.autoPilotEnabled && (
          <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3 text-emerald-500">
              <Calendar size={18} />
              <div className="text-xs">
                <span className="font-bold block">Auto-Pilot Active</span>
                <span className="opacity-70">Next post scheduled for {new Date(initialSettings.nextPostAt).toLocaleDateString()}</span>
              </div>
            </div>
            <Badge variant="outline" className="bg-emerald-500/10 border-emerald-500/20 text-emerald-500 text-[10px] uppercase font-bold tracking-widest">
              Growth Tier
            </Badge>
          </div>
        )}
      </CardContent>

      <CardFooter className="p-6 border-t border-zinc-900 bg-zinc-900/20 flex justify-end">
        <Button 
          onClick={() => onSave(settings)}
          disabled={isSaving}
          className="bg-zinc-100 hover:bg-white text-zinc-950 font-bold px-8 gap-2"
        >
          {isSaving ? 'Saving...' : <><Save size={16} /> Save Configuration</>}
        </Button>
      </CardFooter>
    </Card>
  );
};
