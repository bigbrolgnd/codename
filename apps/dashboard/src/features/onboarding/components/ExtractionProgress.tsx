import { motion } from 'framer-motion';
import { CloudUpload, Sparkles, Eye, Grid, CheckCircle } from 'lucide-react';
import { ExtractionStatus } from '@codename/api';

interface ExtractionProgressProps {
  status: ExtractionStatus;
  imagePreview: string;
  onCancel: () => void;
}

const phases = {
  uploading: { icon: CloudUpload, message: "Uploading your image...", subMessage: "Hang tight, almost there", progress: 20 },
  enhancing: { icon: Sparkles, message: "Enhancing image quality...", subMessage: "Making sure I can read everything", progress: 35 },
  reading: { icon: Eye, message: "Reading your price list...", subMessage: "I see items so far...", progress: 60 },
  structuring: { icon: Grid, message: "Organizing your services...", subMessage: "Grouping by category", progress: 85 },
  complete: { icon: CheckCircle, message: "Got it!", subMessage: "Found services", progress: 100 },
  error: { icon: CloudUpload, message: "Error", subMessage: "Something went wrong", progress: 0 }
};

export function ExtractionProgress({ status, imagePreview, onCancel }: ExtractionProgressProps) {
  const currentPhaseKey = status.phase;
  const phaseConfig = phases[currentPhaseKey] || phases.uploading;
  const Icon = phaseConfig.icon;

  let subMessage = phaseConfig.subMessage;
  if (status.phase === 'complete') {
      subMessage = `Found ${status.result.services.length} services`;
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-zinc-950/90 backdrop-blur-sm">
      <motion.div 
        layoutId="extraction-container"
        className="relative w-full max-w-md overflow-hidden rounded-2xl bg-zinc-900 border border-zinc-800 shadow-2xl p-8 flex flex-col items-center text-center"
      >
        {/* Scan Line Animation over Image Preview */}
        <div className="relative w-32 h-32 mb-8 rounded-lg overflow-hidden border border-zinc-700">
           <img src={imagePreview} alt="Preview" className="w-full h-full object-cover opacity-50" />
           {status.phase !== 'complete' && status.phase !== 'error' && (
             <motion.div
               className="absolute top-0 left-0 right-0 h-1 bg-pink-500 shadow-[0_0_10px_rgba(213,82,183,0.8)]"
               animate={{ top: ['0%', '100%'] }}
               transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
             />
           )}
        </div>

        {/* Icon Pulse */}
        <div className="mb-6 relative">
             <motion.div
               key={currentPhaseKey}
               initial={{ scale: 0.8, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               exit={{ scale: 0.8, opacity: 0 }}
               transition={{ type: "spring" }}
               className="p-4 rounded-full bg-zinc-800/50 border border-zinc-700 text-pink-400"
             >
                <Icon size={48} />
             </motion.div>
             {status.phase !== 'complete' && (
                 <motion.div
                   className="absolute inset-0 rounded-full border-2 border-pink-500/30"
                   animate={{ scale: [1, 1.2], opacity: [1, 0] }}
                   transition={{ duration: 1.5, repeat: Infinity }}
                 />
             )}
        </div>

        {/* Text */}
        <motion.h2 
            key={phaseConfig.message}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl font-bold text-white mb-2 font-serif"
        >
            {phaseConfig.message}
        </motion.h2>
        <motion.p
            key={subMessage}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-zinc-400 mb-8"
        >
            {subMessage}
        </motion.p>

        {/* Progress Bar */}
        <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden mb-8">
            <motion.div
                className="h-full bg-pink-500"
                initial={{ width: 0 }}
                animate={{ width: `${phaseConfig.progress}%` }}
                transition={{ duration: 0.5 }}
            />
        </div>
        
        <button 
            onClick={onCancel}
            className="text-sm text-zinc-500 hover:text-white transition-colors"
        >
            Cancel Extraction
        </button>

      </motion.div>
    </div>
  );
}
