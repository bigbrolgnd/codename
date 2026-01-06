import { useState, useCallback, useRef, useEffect } from 'react';
import { ExtractionStatus, ExtractionResult, ExtractionError } from '@codename/api';
import { trpc } from '@/lib/trpc';

interface UseVisionExtractionOptions {
  onComplete?: (result: ExtractionResult) => void;
  onError?: (error: ExtractionError) => void;
  /** Polling interval in milliseconds (default: 1000) */
  pollInterval?: number;
  /** Use mock implementation for UI development (default: false) */
  useMock?: boolean;
}

// Mock implementation for local UI development without backend
async function runMockExtraction(
  setStatus: (status: ExtractionStatus) => void,
  onComplete?: (result: ExtractionResult) => void
): Promise<void> {
  setStatus({ phase: 'uploading', progress: 0 });
  await new Promise(r => setTimeout(r, 1000));
  setStatus({ phase: 'uploading', progress: 100 });

  await new Promise(r => setTimeout(r, 500));
  setStatus({ phase: 'enhancing', progress: 30 });

  await new Promise(r => setTimeout(r, 2000));
  setStatus({ phase: 'reading', progress: 60 });

  await new Promise(r => setTimeout(r, 2000));
  setStatus({ phase: 'structuring', progress: 90 });

  await new Promise(r => setTimeout(r, 1000));

  const mockResult: ExtractionResult = {
    id: 'mock-id-' + Date.now(),
    services: [
      { id: '1', name: 'Mock Cut', price: 2500, duration: 30, category: 'Hair', confidence: 99 },
      { id: '2', name: 'Mock Color', price: 8000, duration: 120, category: 'Color', confidence: 95 }
    ],
    categories: ['Hair', 'Color'],
    overallConfidence: 97,
    sourceImageUrl: '',
    processingTimeMs: 6500,
    warnings: []
  };

  setStatus({ phase: 'complete', result: mockResult });
  onComplete?.(mockResult);
}

export function useVisionExtraction({
  onComplete,
  onError,
  pollInterval = 1000,
  useMock = false
}: UseVisionExtractionOptions = {}) {
  const [status, setStatus] = useState<ExtractionStatus | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // tRPC mutations and queries
  const ingestMutation = trpc.site.ingestIntakeData.useMutation();
  const statusQuery = trpc.extraction.status.useQuery(
    { jobId: jobId ?? '' },
    {
      enabled: !!jobId && isProcessing,
      refetchInterval: pollInterval,
    }
  );

  // Handle status updates from polling
  useEffect(() => {
    if (statusQuery.data && isProcessing) {
      setStatus(statusQuery.data);

      if (statusQuery.data.phase === 'complete') {
        setIsProcessing(false);
        setJobId(null);
        onComplete?.(statusQuery.data.result);
      } else if (statusQuery.data.phase === 'error') {
        setIsProcessing(false);
        setJobId(null);
        onError?.(statusQuery.data.error);
      }
    }
  }, [statusQuery.data, isProcessing, onComplete, onError]);

  // Handle query errors
  useEffect(() => {
    if (statusQuery.error && isProcessing) {
      const error: ExtractionError = {
        code: 'SERVER_ERROR',
        message: statusQuery.error.message || 'Failed to get extraction status',
        canRetry: true
      };
      setStatus({ phase: 'error', error });
      setIsProcessing(false);
      setJobId(null);
      onError?.(error);
    }
  }, [statusQuery.error, isProcessing, onError]);

  const uploadImage = async (file: File): Promise<string> => {
    // TODO: Implement actual file upload to cloud storage
    // For now, create a temporary object URL
    // In production, this should upload to S3/Cloudflare R2/etc and return the URL
    return URL.createObjectURL(file);
  };

  const extract = useCallback(async (file: File) => {
    // Cancel any existing operation
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setIsProcessing(true);
    setStatus({ phase: 'uploading', progress: 0 });

    // Use mock implementation if enabled or if API is unavailable
    if (useMock) {
      try {
        await runMockExtraction(setStatus, onComplete);
      } catch (e) {
        const error: ExtractionError = {
          code: 'SERVER_ERROR',
          message: 'Mock extraction failed',
          canRetry: true
        };
        setStatus({ phase: 'error', error });
        onError?.(error);
      } finally {
        setIsProcessing(false);
      }
      return;
    }

    try {
      // Handle based on file type
      const isImage = file.type.startsWith('image/');
      
      // Upload the image first if it's an image
      setStatus({ phase: 'uploading', progress: 50 });
      let content = '';
      
      if (isImage) {
        content = await uploadImage(file);
      } else {
        // For text files (from text input mode), read content
        content = await file.text();
      }
      
      setStatus({ phase: 'uploading', progress: 100 });

      // Start the intake ingestion job
      const result = await ingestMutation.mutateAsync({ 
        method: isImage ? 'upload' : 'text',
        content: content
      });
      
      setJobId(result.extractionJobId);

      // Status polling will be handled by the useQuery hook above
      setStatus({ phase: 'enhancing', progress: 0 });

    } catch (e) {
      const error: ExtractionError = {
        code: 'SERVER_ERROR',
        message: e instanceof Error ? e.message : 'Failed to start extraction',
        canRetry: true
      };
      setStatus({ phase: 'error', error });
      setIsProcessing(false);
      onError?.(error);
    }
  }, [useMock, onComplete, onError, ingestMutation]);

  const reset = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
    }
    setStatus(null);
    setIsProcessing(false);
    setJobId(null);
  }, []);

  return { extract, status, isProcessing, reset };
}
