/**
 * Design Studio - Main Page Component
 *
 * Premium add-on feature for visual theme customization.
 * Allows users to customize colors, typography, and shadows
 * with real-time preview and accessibility validation.
 */

import { useEffect, useCallback } from 'react';
import { Undo2, Redo2, RotateCcw, Save, Eye, Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/lib/trpc';
import { useThemeEditor } from './hooks/useThemeEditor';
import { useThemePersistence } from './hooks/useThemePersistence';
import { ColorPaletteEditor } from './components/ColorPaletteEditor';
import { TypographyEditor } from './components/TypographyEditor';
import { ShapeEditor } from './components/ShapeEditor';
import { HSLAdjustmentPanel } from './components/HSLAdjustmentPanel';
import { ThemePresetSelector } from './components/ThemePresetSelector';
import { ContrastChecker } from './components/ContrastChecker';
import { ThemePreview } from './components/ThemePreview';
import { PublishConfirmDialog } from './components/PublishConfirmDialog';
import { DesignStudioPaywall } from './components/DesignStudioPaywall';
import { Loader2 } from 'lucide-react';

export function DesignStudio() {
  const tenantId = 'tenant_default'; // Standard fallback for now
  
  const { 
    data: subStatus, 
    isLoading: isSubLoading,
    refetch: refetchSub
  } = trpc.admin.getSubscriptionStatus.useQuery({ tenantId });

  const { 
    themeState, 
    themeId,
    setCurrentMode, 
    reset, 
    saveCheckpoint,
    canUndo,
    canRedo,
    undo,
    redo,
    isDirty,
    hasUnsavedChanges
  } = useThemeEditor();
  
  const { isSaving } = useThemePersistence(tenantId);

  // Save checkpoint on mount
  useEffect(() => {
    saveCheckpoint();
  }, [saveCheckpoint]);

  // Handle access gate
  if (isSubLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="animate-spin text-emerald-500" size={32} />
      </div>
    );
  }

  if (subStatus && !subStatus.canAccessDesignStudio) {
    return <DesignStudioPaywall tenantId={tenantId} onSuccess={refetchSub} />;
  }

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          if (canRedo()) redo();
        } else {
          if (canUndo()) undo();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, canUndo, canRedo]);

  const handleModeToggle = useCallback(() => {
    setCurrentMode(themeState.currentMode === 'light' ? 'dark' : 'light');
  }, [themeState.currentMode, setCurrentMode]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b bg-background">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-semibold">Design Studio</h1>
          {isSaving ? (
            <Badge variant="outline" className="text-xs animate-pulse">
              Saving...
            </Badge>
          ) : isDirty ? (
            <Badge variant="secondary" className="text-xs">
              Unsaved changes
            </Badge>
          ) : null}
        </div>

        <div className="flex items-center gap-2">
          {/* Undo/Redo */}
          <Button
            variant="ghost"
            size="icon"
            onClick={undo}
            disabled={!canUndo}
            title="Undo (Cmd+Z)"
          >
            <Undo2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={redo}
            disabled={!canRedo}
            title="Redo (Cmd+Shift+Z)"
          >
            <Redo2 className="h-4 w-4" />
          </Button>

          <Separator orientation="vertical" className="h-6" />

          {/* Mode Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleModeToggle}
            title={`Switch to ${themeState.currentMode === 'light' ? 'dark' : 'light'} mode`}
          >
            {themeState.currentMode === 'light' ? (
              <Moon className="h-4 w-4" />
            ) : (
              <Sun className="h-4 w-4" />
            )}
          </Button>

          <Separator orientation="vertical" className="h-6" />

          {/* Contrast Checker */}
          <ContrastChecker 
            styles={themeState.styles[themeState.currentMode]} 
            adjustments={themeState.hslAdjustments}
          />

          {/* Reset */}
          <Button variant="ghost" size="icon" onClick={reset} title="Reset to defaults">
            <RotateCcw className="h-4 w-4" />
          </Button>

          <Separator orientation="vertical" className="h-6" />

          {/* Publish */}
          <PublishConfirmDialog disabled={!hasUnsavedChanges}>
            <Button disabled={!hasUnsavedChanges}>
              <Save className="h-4 w-4 mr-2" />
              Publish
            </Button>
          </PublishConfirmDialog>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Editor Panel */}
        <aside className="w-96 border-r overflow-y-auto bg-muted/30">
          <div className="p-4 space-y-6">
            {/* Preset Selector */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Theme Preset</CardTitle>
                <CardDescription className="text-xs">
                  Start with a preset or build from scratch
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ThemePresetSelector />
              </CardContent>
            </Card>

            {/* HSL Adjustments */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Global Adjustments</CardTitle>
                <CardDescription className="text-xs">
                  Shift all colors at once
                </CardDescription>
              </CardHeader>
              <CardContent>
                <HSLAdjustmentPanel />
              </CardContent>
            </Card>

            {/* Detailed Editors */}
            <Tabs defaultValue="colors" className="w-full">
              <TabsList className="w-full">
                <TabsTrigger value="colors" className="flex-1">
                  Colors
                </TabsTrigger>
                <TabsTrigger value="typography" className="flex-1">
                  Type
                </TabsTrigger>
                <TabsTrigger value="shape" className="flex-1">
                  Shape
                </TabsTrigger>
              </TabsList>

              <TabsContent value="colors" className="mt-4">
                <ColorPaletteEditor mode={themeState.currentMode} />
              </TabsContent>

              <TabsContent value="typography" className="mt-4">
                <TypographyEditor mode={themeState.currentMode} />
              </TabsContent>

              <TabsContent value="shape" className="mt-4">
                <ShapeEditor mode={themeState.currentMode} />
              </TabsContent>
            </Tabs>
          </div>
        </aside>

        {/* Preview Panel */}
        <main className="flex-1 bg-muted/10 overflow-hidden">
          <ThemePreview />
        </main>
      </div>
    </div>
  );
}

export default DesignStudio;
