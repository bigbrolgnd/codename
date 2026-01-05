import React, { useState } from 'react';
import { EditableService, ServiceCategory } from '../../types/smartLedger.types';
import { ServiceCard } from './ServiceCard';
import { ServiceCardExpanded } from './ServiceCardExpanded';
import { ExtractionConfidenceBanner } from './ExtractionConfidenceBanner';
import { ExtractionResult } from '@codename/api';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Plus, ChevronDown, ChevronRight, Layers, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';

interface ServiceListPanelProps {
  services: EditableService[];
  categories: ServiceCategory[];
  extractionResult: ExtractionResult;
  editingServiceId: string | null;
  lowConfidenceCount: number;
  onEdit: (id: string | null) => void;
  onUpdate: (id: string, updates: Partial<EditableService>) => void;
  onDelete: (id: string) => void;
  onHover: (id: string | null) => void;
  onAddService: () => void;
  onUndo?: () => void;
  canUndo?: boolean;
  className?: string;
}

const CategoryGroup = ({ 
  category, 
  children 
}: { 
  category: ServiceCategory; 
  children: React.ReactNode 
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="mb-4 border rounded-lg overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-3 bg-muted/30 hover:bg-muted/50 transition-colors"
      >
        <span className="font-medium flex items-center gap-2">
          {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          {category.name}
          <span className="text-muted-foreground text-xs font-normal">
            ({category.services.length})
          </span>
        </span>
      </button>
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="p-2 space-y-2 bg-background/50">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const ServiceListPanel = ({
  services,
  categories,
  extractionResult,
  editingServiceId,
  lowConfidenceCount,
  onEdit,
  onUpdate,
  onDelete,
  onHover,
  onAddService,
  onUndo,
  canUndo,
  className
}: ServiceListPanelProps) => {
  // Use grouping if more than 50 services
  const shouldGroup = services.length > 50;
  
  const renderService = (service: EditableService) => {
    if (service.isDeleted) return null; // Should be filtered out by parent usually, but just in case
    
    if (editingServiceId === service.id) {
      return (
        <ServiceCardExpanded
          key={service.id}
          service={service}
          onSave={(id, updates) => {
            onUpdate(id, updates);
            onEdit(null);
          }}
          onCancel={() => onEdit(null)}
          onDelete={onDelete}
        />
      );
    }
    
    return (
      <ServiceCard
        key={service.id}
        service={service}
        onClick={() => onEdit(service.id)}
        onHover={(isHovering) => onHover(isHovering ? service.id : null)}
        onDelete={() => onDelete(service.id)}
      />
    );
  };

  return (
    <div className={cn("flex flex-col h-full bg-background", className)}>
      <div className="p-4 border-b flex items-center justify-between bg-background/95 backdrop-blur z-10">
        <div>
           <h2 className="text-lg font-semibold flex items-center gap-2">
             <Layers className="h-5 w-5" />
             Extracted Services
           </h2>
           <p className="text-xs text-muted-foreground">
             {services.length} services found
           </p>
        </div>
        <div className="flex items-center gap-2">
          {canUndo && onUndo && (
            <Button 
              size="sm" 
              variant="outline" 
              onClick={onUndo} 
              className="gap-1 text-muted-foreground hover:text-foreground"
              title="Undo last action (Ctrl+Z)"
            >
              <RotateCcw className="h-4 w-4" />
              Undo
            </Button>
          )}
          <Button size="sm" onClick={onAddService} className="gap-1">
            <Plus className="h-4 w-4" />
            Add Service
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 pb-32 space-y-4">
          <ExtractionConfidenceBanner
            extractionResult={extractionResult}
            lowConfidenceCount={lowConfidenceCount}
            onReviewLowConfidence={() => {
                // Scroll to first low confidence item?
                // For now, we rely on user manually scrolling or implementing a ref map later
            }}
          />

          <AnimatePresence mode='popLayout'>
            {shouldGroup ? (
              categories.map(category => (
                <CategoryGroup key={category.name} category={category}>
                  {category.services.map(renderService)}
                </CategoryGroup>
              ))
            ) : (
              <div className="space-y-2">
                {services.map(renderService)}
              </div>
            )}
          </AnimatePresence>
          
          {services.length === 0 && (
             <div className="text-center py-12 text-muted-foreground">
               <p>No services found.</p>
               <Button variant="link" onClick={onAddService}>Add your first service</Button>
             </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
