import React from 'react';
import { EditableService } from '../../types/smartLedger.types';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { AlertTriangle, Clock, Tag } from 'lucide-react';
import { motion } from 'framer-motion';
import { useSwipeable } from 'react-swipeable';

interface ServiceCardProps {
  service: EditableService;
  onClick: () => void;
  onHover?: (isHovering: boolean) => void;
  onDelete?: () => void;
  className?: string;
}

export const ServiceCard = ({ service, onClick, onHover, onDelete, className }: ServiceCardProps) => {
  const isLowConfidence = service.confidence < 80;

  const handlers = useSwipeable({
    onSwipedLeft: () => onDelete?.(),
    trackMouse: false,
    delta: 50,
  });
  
  // Format price (cents to dollars)
  const formattedPrice = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(service.price / 100);

  // Format duration
  const formatDuration = (min: number) => {
    const hours = Math.floor(min / 60);
    const minutes = min % 60;
    if (hours > 0) {
      return `${hours}h${minutes > 0 ? ` ${minutes}m` : ''}`;
    }
    return `${minutes}m`;
  };

  return (
    <motion.div
      {...handlers}
      layoutId={`card-${service.id}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ scale: 1.01, transition: { duration: 0.2 } }}
      onMouseEnter={() => onHover?.(true)}
      onMouseLeave={() => onHover?.(false)}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={`Edit ${service.name || 'service'}, ${formattedPrice}`}
      className={cn("cursor-pointer touch-manipulation focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-lg", className)}
    >
      <Card className={cn(
        "relative overflow-hidden transition-all border shadow-sm hover:shadow-md",
        isLowConfidence 
          ? "border-amber-400/50 bg-amber-500/5 hover:border-amber-400" 
          : "border-border hover:border-primary/50"
      )}>
        {isLowConfidence && (
          <div className="absolute top-0 right-0 p-1.5 bg-amber-100 dark:bg-amber-900/30 rounded-bl-lg">
            <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          </div>
        )}
        
        <CardContent className="p-4 flex justify-between items-start gap-3">
          <div className="flex-1 space-y-1.5 min-w-0">
            <h3 className={cn(
              "font-medium leading-tight truncate pr-6",
              !service.name && "text-muted-foreground italic"
            )}>
              {service.name || "Unnamed Service"}
            </h3>
            
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              {service.category && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground font-medium">
                  <Tag className="h-3 w-3" />
                  {service.category}
                </span>
              )}
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatDuration(service.duration)}
              </span>
            </div>
            
            {isLowConfidence && (
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 flex items-center gap-1">
                Low confidence ({Math.round(service.confidence)}%)
              </p>
            )}
          </div>

          <div className="font-semibold text-right whitespace-nowrap">
            {formattedPrice}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
