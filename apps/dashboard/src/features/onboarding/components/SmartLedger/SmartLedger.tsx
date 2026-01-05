import React, { useState, useEffect } from 'react';
import type { ExtractionResult } from '@codename/api';
import type { EditableService } from '../../types/smartLedger.types';
import { useServiceEditor } from '../../hooks/useServiceEditor';
import { SourceImagePanel } from './SourceImagePanel';
import { ServiceListPanel } from './ServiceListPanel';
import { BuildFooter } from './BuildFooter';
import { AddServiceModal } from './AddServiceModal';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export interface SmartLedgerProps {
  extractionResult: ExtractionResult;
  onBuild: (services: EditableService[]) => void;
  onBack?: () => void;
}

export const SmartLedger = ({ extractionResult, onBuild, onBack }: SmartLedgerProps) => {
  const {
    services,
    categories,
    editingServiceId,
    updateService,
    deleteService,
    // restoreService,
    addService,
    setEditing,
    validServices,
    validServiceCount,
    hasValidationErrors,
    hasUnsavedChanges,
    lowConfidenceCount,
    undo,
    canUndo,
  } = useServiceEditor(extractionResult);

  const [hoveredServiceId, setHoveredServiceId] = useState<string | null>(null);
  const [isImageCollapsed, setIsImageCollapsed] = useState(false);
  const [isBuilding, setIsBuilding] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  // Global Undo Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if input/textarea is focused to avoid conflict with text undo
      const target = e.target as HTMLElement;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        if (canUndo) {
          e.preventDefault();
          undo();
          toast.success("Undid last action");
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, canUndo]);

  const handleBuild = async () => {
    if (hasValidationErrors) {
      toast.error("Please fix validation errors before building.");
      return;
    }
    
    setIsBuilding(true);
    
    // Animation delay to simulate "flying" before actual build
    await new Promise(resolve => setTimeout(resolve, 800));

    try {
      await onBuild(validServices);
    } catch (error) {
      toast.error("Failed to build site. Please try again.");
      setIsBuilding(false);
    }
  };

  const handleAddService = () => {
    setShowAddModal(true);
  };

  return (
    <div className="flex flex-col md:flex-row h-screen w-full bg-background overflow-hidden relative">
      {/* Left Panel (Source Image) */}
      <div 
        className={cn(
          "transition-all duration-300 ease-in-out bg-slate-900",
          isImageCollapsed 
            ? "h-14 md:h-full md:w-14 min-h-[3.5rem]" 
            : "h-[35vh] md:h-full md:w-[40%] min-h-[35vh]",
          "relative flex-shrink-0 z-20 border-r border-slate-800 shadow-xl"
        )}
      >
        <SourceImagePanel
          imageUrl={extractionResult.sourceImageUrl}
          services={validServices}
          hoveredServiceId={hoveredServiceId}
          onCollapse={() => setIsImageCollapsed(!isImageCollapsed)}
          isCollapsed={isImageCollapsed}
          isMobile={true} // Always show controls
        />
      </div>

      {/* Right Panel (Service List) */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        <ServiceListPanel
          services={validServices}
          categories={categories}
          extractionResult={extractionResult}
          editingServiceId={editingServiceId}
          lowConfidenceCount={lowConfidenceCount}
          onEdit={setEditing}
          onUpdate={updateService}
          onDelete={deleteService}
          onHover={setHoveredServiceId}
          onAddService={handleAddService}
          onUndo={undo}
          canUndo={canUndo}
          className="pb-20" // Padding for footer
        />
        
        <BuildFooter
          serviceCount={validServiceCount}
          isValid={!hasValidationErrors && validServiceCount > 0}
          hasValidationErrors={hasValidationErrors}
          isBuilding={isBuilding}
          onBuild={handleBuild}
        />
      </div>

      <AddServiceModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={addService}
      />
    </div>
  );
};
