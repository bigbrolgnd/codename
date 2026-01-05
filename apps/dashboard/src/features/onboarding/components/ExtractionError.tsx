import { motion } from 'framer-motion';
import { ImageOff, SearchX, Clock, AlertTriangle } from 'lucide-react';
import { ExtractionError } from '@codename/api';

interface ExtractionErrorProps {
  error: ExtractionError;
  onRetry: () => void;
  onManualEntry: () => void;
  onUploadNew: () => void;
}

const errorConfig = {
  UNREADABLE_IMAGE: { icon: ImageOff, title: "I couldn't read that", primaryAction: "Try Another Photo", secondaryAction: "Type It Instead" },
  NO_SERVICES_FOUND: { icon: SearchX, title: "No services detected", primaryAction: "Upload Different Image", secondaryAction: "Enter Manually" },
  TIMEOUT: { icon: Clock, title: "Taking too long", primaryAction: "Retry", secondaryAction: "Try Later" },
  SERVER_ERROR: { icon: AlertTriangle, title: "Something went wrong", primaryAction: "Retry", secondaryAction: "Contact Support" }
};

export function ExtractionErrorUI({ error, onRetry, onManualEntry, onUploadNew }: ExtractionErrorProps) {
  const config = errorConfig[error.code] || errorConfig.SERVER_ERROR;
  const Icon = config.icon;

  const handlePrimary = () => {
    if (error.code === 'UNREADABLE_IMAGE' || error.code === 'NO_SERVICES_FOUND') {
      onUploadNew();
    } else {
      onRetry();
    }
  };

  const handleSecondary = () => {
      onManualEntry();
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-zinc-950/90 backdrop-blur-sm">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-md rounded-2xl bg-zinc-900 border border-red-900/50 shadow-2xl p-8 flex flex-col items-center text-center"
      >
        <div className="p-4 rounded-full bg-red-900/20 text-red-500 mb-6">
          <Icon size={48} />
        </div>

        <h2 className="text-2xl font-bold text-white mb-2 font-serif">{config.title}</h2>
        <p className="text-zinc-400 mb-8">{error.message}</p>

        <div className="flex gap-4 w-full">
            <button 
                onClick={handleSecondary}
                className="flex-1 py-3 px-4 rounded-lg border border-zinc-700 text-zinc-300 hover:bg-zinc-800 transition-colors"
            >
                {config.secondaryAction}
            </button>
            <button 
                onClick={handlePrimary}
                className="flex-1 py-3 px-4 rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 transition-colors font-medium shadow-lg shadow-emerald-900/20"
            >
                {config.primaryAction}
            </button>
        </div>

      </motion.div>
    </div>
  );
}
