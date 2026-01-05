import React from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowRight, CheckCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BuildFooterProps {
  serviceCount: number;
  isValid: boolean;
  isBuilding?: boolean;
  onBuild: () => void;
  className?: string;
  hasValidationErrors?: boolean;
}

export const BuildFooter = ({
  serviceCount,
  isValid,
  isBuilding = false,
  onBuild,
  className,
  hasValidationErrors = false,
}: BuildFooterProps) => {
  return (
    <div className={cn(
      "fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-md border-t z-50 flex justify-center",
      className
    )}>
      <div className="w-full max-w-4xl flex items-center justify-between gap-4">
        <div className="hidden sm:block text-sm text-muted-foreground">
          {hasValidationErrors ? (
            <span className="text-destructive font-medium">
              Please fix validation errors before proceeding.
            </span>
          ) : (
            <span>
              Review your services carefully. This will be the foundation of your site.
            </span>
          )}
        </div>
        
        <Button 
          size="lg" 
          onClick={onBuild}
          disabled={!isValid || isBuilding || serviceCount === 0}
          className="w-full sm:w-auto shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          {isBuilding ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Building Your Site...
            </>
          ) : (
            <>
              <CheckCheck className="mr-2 h-5 w-5" />
              Confirm {serviceCount} Services & Build
              <ArrowRight className="ml-2 h-4 w-4 opacity-50" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
};
