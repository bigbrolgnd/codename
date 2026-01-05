import React, { useState } from 'react';
import { TransformWrapper, TransformComponent, useControls } from 'react-zoom-pan-pinch';
import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut, RotateCcw, Minimize2, Maximize2, Loader2, ImageOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { EditableService } from '../../types/smartLedger.types';

interface SourceImagePanelProps {
  imageUrl: string;
  services?: EditableService[];
  hoveredServiceId?: string | null;
  onCollapse?: () => void;
  isCollapsed?: boolean;
  className?: string;
  isMobile?: boolean;
}

const Controls = ({ onCollapse, isMobile }: { onCollapse?: () => void, isMobile?: boolean }) => {
  const { zoomIn, zoomOut, resetTransform } = useControls();
  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10 bg-black/70 p-1.5 rounded-full backdrop-blur-sm border border-white/10 shadow-lg">
       <Button 
         variant="ghost" 
         size="icon" 
         onClick={() => zoomIn()} 
         className="h-8 w-8 text-white hover:bg-white/20 hover:text-white rounded-full"
         title="Zoom In"
       >
         <ZoomIn className="h-4 w-4" />
       </Button>
       <Button 
         variant="ghost" 
         size="icon" 
         onClick={() => zoomOut()} 
         className="h-8 w-8 text-white hover:bg-white/20 hover:text-white rounded-full"
         title="Zoom Out"
       >
         <ZoomOut className="h-4 w-4" />
       </Button>
       <Button 
         variant="ghost" 
         size="icon" 
         onClick={() => resetTransform()} 
         className="h-8 w-8 text-white hover:bg-white/20 hover:text-white rounded-full"
         title="Reset Zoom"
       >
         <RotateCcw className="h-4 w-4" />
       </Button>
       {isMobile && onCollapse && (
         <Button 
           variant="ghost" 
           size="icon" 
           onClick={onCollapse} 
           className="h-8 w-8 text-white hover:bg-white/20 hover:text-white rounded-full"
           title="Collapse"
         >
           <Minimize2 className="h-4 w-4" />
         </Button>
       )}
    </div>
  );
};

export const SourceImagePanel = ({
  imageUrl,
  services = [],
  hoveredServiceId,
  onCollapse,
  isCollapsed = false,
  className,
  isMobile = false,
}: SourceImagePanelProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  if (isCollapsed) {
    return (
        <div className={cn("flex items-center justify-center bg-muted/20 p-4 rounded-lg border-2 border-dashed", className)}>
            <Button onClick={onCollapse} variant="outline" className="gap-2">
                <Maximize2 className="h-4 w-4" />
                Show Source Image
            </Button>
        </div>
    );
  }

  return (
    <div className={cn("relative overflow-hidden bg-slate-900 rounded-lg h-full w-full flex items-center justify-center", className)}>
      {hasError ? (
        <div className="text-center text-slate-400 p-6">
           <ImageOff className="h-12 w-12 mx-auto mb-2 opacity-50" />
           <p className="text-sm">Failed to load source image</p>
        </div>
      ) : (
        <TransformWrapper
          initialScale={1}
          minScale={0.5}
          maxScale={4}
          centerOnInit
          limitToBounds={false}
        >
          {({ zoomIn, zoomOut, resetTransform, ...rest }) => (
            <>
              {!isLoading && <Controls onCollapse={onCollapse} isMobile={isMobile} />}
              <TransformComponent
                wrapperClass="!w-full !h-full"
                contentClass="!w-full !h-full flex items-center justify-center"
              >
                <div className="relative inline-block shadow-2xl">
                  {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center z-50">
                       <Loader2 className="h-10 w-10 text-emerald-500 animate-spin" />
                    </div>
                  )}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imageUrl}
                    alt="Source Receipt"
                    className={cn("max-w-none transition-opacity duration-300", isLoading ? "opacity-0" : "opacity-100")}
                    style={{ display: 'block' }} 
                    onLoad={() => setIsLoading(false)}
                    onError={() => {
                        setIsLoading(false);
                        setHasError(true);
                    }}
                  />
                  
                  {!isLoading && services.map((service) => {
                    if (!service.boundingBox) return null;
                    
                    const isHovered = service.id === hoveredServiceId;
                    
                    return (
                      <div
                        key={service.id}
                        className={cn(
                          "absolute border-2 transition-all duration-200 pointer-events-none mix-blend-difference",
                          isHovered 
                            ? "border-yellow-400 bg-yellow-400/20 z-10" 
                            : "border-emerald-500/50 hover:border-emerald-400"
                        )}
                        style={{
                          left: service.boundingBox.x,
                          top: service.boundingBox.y,
                          width: service.boundingBox.width,
                          height: service.boundingBox.height,
                        }}
                      />
                    );
                  })}
                </div>
              </TransformComponent>
            </>
          )}
        </TransformWrapper>
      )}
    </div>
  );
};
