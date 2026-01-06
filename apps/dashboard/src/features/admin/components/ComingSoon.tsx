import React from 'react';
import { Button } from '@/components/ui/button';
import { Construction } from 'lucide-react';

interface ComingSoonProps {
  feature: string;
  onBack?: () => void;
}

export const ComingSoon: React.FC<ComingSoonProps> = ({ feature, onBack }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center space-y-6">
      <div className="p-6 rounded-full bg-zinc-900 border border-zinc-800 text-emerald-500 shadow-xl shadow-emerald-500/5">
        <Construction size={64} />
      </div>
      <div className="space-y-2">
        <h2 className="text-3xl font-bold tracking-tight text-white font-serif">{feature}</h2>
        <p className="text-zinc-400 max-w-sm mx-auto">
          We're polishing this part of the Command Center. Stay tuned for total business automation.
        </p>
      </div>
      {onBack && (
        <Button variant="outline" onClick={onBack} className="border-zinc-800 text-zinc-400 hover:text-white">
          Return to Overview
        </Button>
      )}
    </div>
  );
};
