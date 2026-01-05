import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Rocket, ExternalLink, ArrowRight } from 'lucide-react';

interface CompletionCelebrationProps {
  siteUrl: string;
  onViewSite: () => void;
  onGoToDashboard: () => void;
}

export const CompletionCelebration = ({
  siteUrl,
  onViewSite,
  onGoToDashboard
}: CompletionCelebrationProps) => {
  useEffect(() => {
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

    const interval: any = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
    }, 250);

    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-zinc-950/60 backdrop-blur-xl"
    >
      <div className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-3xl p-8 shadow-2xl text-center relative overflow-hidden">
        {/* Background Glow */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-emerald-500/20 blur-[100px] rounded-full" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-blue-500/20 blur-[100px] rounded-full" />

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="w-20 h-20 bg-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-emerald-500/20">
            <Rocket className="w-10 h-10 text-emerald-500" />
          </div>
          
          <h2 className="text-3xl font-bold text-zinc-100 mb-2">Your Business is Live!</h2>
          <p className="text-zinc-400 mb-8">
            I've deployed your site to the edge. It's fast, secure, and ready for customers.
          </p>

          <div className="bg-zinc-950/50 border border-zinc-800 rounded-xl p-4 mb-8 flex items-center justify-between group cursor-pointer hover:border-zinc-700 transition-colors" onClick={onViewSite}>
            <div className="text-left overflow-hidden">
              <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-1">Production URL</p>
              <p className="text-emerald-400 font-medium truncate">{siteUrl.replace('https://', '')}</p>
            </div>
            <ExternalLink className="w-4 h-4 text-zinc-500 group-hover:text-emerald-400 transition-colors" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Button size="lg" variant="outline" onClick={onGoToDashboard} className="w-full border-zinc-800 hover:bg-zinc-800">
              Go to Dashboard
            </Button>
            <Button size="lg" onClick={onViewSite} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/20">
              View My Site
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};
