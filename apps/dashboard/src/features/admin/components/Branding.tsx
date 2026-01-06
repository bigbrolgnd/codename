import React from 'react';
import { Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BrandingProps {
  className?: string;
}

export const Branding: React.FC<BrandingProps> = ({ className }) => {
  return (
    <div className={cn("flex items-center gap-2 px-2", className)}>
      <div className="p-1.5 rounded-lg bg-emerald-500 text-zinc-950">
        <Zap size={18} fill="currentColor" />
      </div>
      <span className="text-xl font-black tracking-tighter text-white">COMMAND</span>
    </div>
  );
};
