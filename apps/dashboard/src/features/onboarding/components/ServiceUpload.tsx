import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, FileText, Upload, AlertCircle } from 'lucide-react';
import { validateFile, MAX_FILE_SIZE, formatFileSize } from '../utils/fileValidation';
import { useVisionExtraction } from '../hooks/useVisionExtraction';
import { ExtractionProgress } from './ExtractionProgress';
import { ExtractionErrorUI } from './ExtractionError';
import { ExtractionResult } from '@codename/api';
import { trpc } from '@/lib/trpc';

interface ServiceUploadProps {
  onUploadComplete: (result: ExtractionResult) => void;
  onManualEntry: () => void;
}

type InputMode = 'upload' | 'text';

const ServiceUpload: React.FC<ServiceUploadProps> = ({ onUploadComplete, onManualEntry }) => {
  const [file, setFile] = useState<File | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [inputMode, setInputMode] = useState<InputMode>('upload');
  const [textDescription, setTextDescription] = useState('');
  
  const analytics = trpc.analytics.trackEvent.useMutation();

  React.useEffect(() => {
      analytics.mutate({ eventName: 'funnel_step', properties: { step: 'hero_view' } });
  }, []);

  const { extract, status, isProcessing, reset } = useVisionExtraction({
    onComplete: (result) => {
      analytics.mutate({ eventName: 'funnel_step', properties: { step: 'extraction_complete' } });
      // Keep "complete" state visible briefly before transition
      setTimeout(() => {
        onUploadComplete(result);
      }, 1500);
    }
  });

  const processFile = useCallback(async (selectedFile: File) => {
    analytics.mutate({ eventName: 'funnel_step', properties: { step: 'upload_start' } });
    const validation = validateFile(selectedFile);

    if (!validation.valid) {
      setErrorMessage(validation.error ?? 'Invalid file');
      return;
    }

    setFile(selectedFile);
    setErrorMessage('');
    await extract(selectedFile);
  }, [extract]);

  const handleTextSubmit = async () => {
    if (!textDescription.trim()) {
      setErrorMessage('Please enter a description of your services');
      return;
    }

    setErrorMessage('');
    // Mock file for text input
    const blob = new Blob([textDescription], { type: 'text/plain' });
    const textFile = new File([blob], 'services.txt', { type: 'text/plain' });
    
    // Clear file state for preview purposes if previously set
    setFile(null); 
    await extract(textFile);
  };

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: unknown[]) => {
    if (rejectedFiles.length > 0) {
      setErrorMessage('Only JPG, PNG, and WEBP images under 10MB are accepted');
      return;
    }

    if (acceptedFiles.length > 0) {
      processFile(acceptedFiles[0]);
    }
  }, [processFile]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp'],
    },
    maxSize: MAX_FILE_SIZE,
    multiple: false,
  });

  const resetError = () => {
    setErrorMessage('');
    reset();
  };

  // 1. Error State
  if (status?.phase === 'error' && status.error) {
    return (
        <ExtractionErrorUI 
            error={status.error}
            onRetry={() => file ? processFile(file) : handleTextSubmit()}
            onManualEntry={onManualEntry}
            onUploadNew={resetError}
        />
    );
  }

  // 2. Processing State (Progress UI)
  if (isProcessing && status) {
    return (
        <ExtractionProgress 
            status={status}
            imagePreview={file ? URL.createObjectURL(file) : ''}
            onCancel={reset}
        />
    );
  }

  // 3. Idle / Input State
  return (
    <div className="w-full max-w-xl mx-auto">
      <AnimatePresence mode="wait">
        {inputMode === 'upload' && !errorMessage && (
          <motion.div
            key="idle-upload"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="space-y-6"
          >
            <div className="text-center space-y-2">
              <h1 className="text-3xl font-bold tracking-tight text-white">Let's see your menu.</h1>
              <p className="text-zinc-400">Snap a photo of your price list or drag & drop an image.</p>
            </div>

            <div
              {...getRootProps()}
              className={`relative block group cursor-pointer ${
                isDragActive ? 'ring-2 ring-pink-500 ring-offset-2 ring-offset-zinc-950' : ''
              }`}
            >
              <div className={`w-full aspect-[4/3] rounded-2xl border-2 border-dashed ${
                isDragActive ? 'border-pink-500 bg-pink-500/10' : 'border-zinc-800 group-hover:border-pink-500/50 bg-zinc-900/50'
              } flex flex-col items-center justify-center transition-all overflow-hidden`}>
                <div className="absolute inset-0 bg-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />

                <div className="relative flex flex-col items-center space-y-4">
                  <div className={`p-4 rounded-full ${
                    isDragActive ? 'bg-pink-500/20 scale-110' : 'bg-zinc-800'
                  } text-pink-500 group-hover:scale-110 transition-transform`}>
                    {isDragActive ? <Upload size={48} /> : <Camera size={48} />}
                  </div>
                  <div className="text-center">
                    <span className="block text-lg font-medium text-white">
                      {isDragActive ? 'Drop your image here' : 'Take a photo or drag & drop'}
                    </span>
                    <span className="text-sm text-zinc-500">
                      JPG, PNG, WEBP up to {formatFileSize(MAX_FILE_SIZE)}
                    </span>
                  </div>
                </div>

                <input {...getInputProps()} />
              </div>
            </div>

            <div className="flex items-center justify-center space-x-4 text-sm text-zinc-500">
              <button
                onClick={() => setInputMode('text')}
                className="hover:text-pink-500 transition-colors flex items-center space-x-2"
              >
                <FileText size={16} />
                <span>I don't have a price list handy</span>
              </button>
            </div>
          </motion.div>
        )}

        {inputMode === 'text' && !errorMessage && (
          <motion.div
            key="idle-text"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="space-y-6"
          >
            <div className="text-center space-y-2">
              <h1 className="text-3xl font-bold tracking-tight text-white">Describe your services.</h1>
              <p className="text-zinc-400">List your services and prices. We'll organize them for you.</p>
            </div>

            <div className="space-y-4">
              <textarea
                value={textDescription}
                onChange={(e) => setTextDescription(e.target.value)}
                placeholder="Example:
Haircut - $25
Color - $75
Highlights - $120
Blowout - $45"
                className="w-full h-48 rounded-xl bg-zinc-900 border border-zinc-800 p-4 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500/50 resize-none"
              />

              <button
                onClick={handleTextSubmit}
                disabled={!textDescription.trim()}
                className="w-full py-4 bg-pink-600 hover:bg-pink-500 disabled:bg-zinc-700 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all shadow-lg shadow-pink-900/20 active:scale-95 glow-soft"
              >
                Analyze Services
              </button>
            </div>

            <div className="flex items-center justify-center space-x-4 text-sm text-zinc-500">
              <button
                onClick={() => setInputMode('upload')}
                className="hover:text-pink-500 transition-colors flex items-center space-x-2"
              >
                <Camera size={16} />
                <span>Upload an image instead</span>
              </button>
            </div>
          </motion.div>
        )}

        {errorMessage && (
          <motion.div
            key="error"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex flex-col items-center justify-center space-y-6 py-12 text-center"
          >
            <div className="p-4 rounded-full bg-red-500/10 text-red-500">
              <AlertCircle size={64} />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-white">Something went wrong</h2>
              <p className="text-zinc-400">{errorMessage}</p>
            </div>
            <button
              onClick={() => setErrorMessage('')}
              className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-medium rounded-xl transition-colors"
            >
              Try again
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ServiceUpload;