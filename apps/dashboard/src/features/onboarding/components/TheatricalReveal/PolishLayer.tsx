import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Sparkles, Image as ImageIcon } from 'lucide-react';

export const PolishLayer = () => {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: [0, 1, 0], scale: [0.5, 1.2, 1.5] }}
        transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
        className="text-emerald-400/30"
      >
        <Shield className="w-32 h-32" />
      </motion.div>
      
      <div className="absolute top-1/4 right-1/4">
        <motion.div
          animate={{ rotate: 360, scale: [1, 1.2, 1] }}
          transition={{ duration: 4, repeat: Infinity }}
          className="text-amber-400/40"
        >
          <Sparkles className="w-8 h-8" />
        </motion.div>
      </div>

      <div className="absolute inset-0 p-4 opacity-20">
         <svg viewBox="0 0 220 300" className="w-full h-full">
            <motion.rect 
              x="20" y="50" width="40" height="40" rx="4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              fill="currentColor"
              className="text-zinc-600"
            />
         </svg>
      </div>
    </div>
  );
};
