import React from 'react';
import { ExtractionResult } from '@codename/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle, Info, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ExtractionConfidenceBannerProps {
  extractionResult: ExtractionResult;
  lowConfidenceCount?: number;
  onReviewLowConfidence?: () => void;
  className?: string;
}

export const ExtractionConfidenceBanner = ({
  extractionResult,
  lowConfidenceCount = 0,
  onReviewLowConfidence,
  className
}: ExtractionConfidenceBannerProps) => {
  const { overallConfidence, services, categories } = extractionResult;
  
  // Determine status color and icon
  let statusColor = "bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-400";
  let icon = <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />;
  let title = "High Confidence Extraction";
  
  if (overallConfidence < 70) {
    statusColor = "bg-red-500/10 border-red-500/20 text-red-700 dark:text-red-400";
    icon = <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />;
    title = "Low Confidence Extraction";
  } else if (overallConfidence < 90 || lowConfidenceCount > 0) {
    statusColor = "bg-amber-500/10 border-amber-500/20 text-amber-700 dark:text-amber-400";
    icon = <Info className="h-5 w-5 text-amber-600 dark:text-amber-400" />;
    title = "Review Suggested";
  }

  return (
    <div className={cn("rounded-lg border px-4 py-3 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between", statusColor, className)}>
      <div className="flex gap-3 items-center">
        {icon}
        <div>
          <h4 className="font-semibold text-sm flex items-center gap-2">
            {title}
            <span className="text-xs font-normal opacity-80 border border-current px-1.5 rounded-full">
              {Math.round(overallConfidence)}% Score
            </span>
          </h4>
          <p className="text-xs opacity-90 mt-0.5">
            I found {services.length} services across {categories.length} categories.
          </p>
        </div>
      </div>
      
      {lowConfidenceCount > 0 && onReviewLowConfidence && (
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onReviewLowConfidence}
          className="bg-background/50 hover:bg-background/80 border-current/30 text-current whitespace-nowrap w-full sm:w-auto"
        >
          Review {lowConfidenceCount} Items
        </Button>
      )}
    </div>
  );
};
