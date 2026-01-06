/**
 * Publish Confirm Dialog Component
 * Confirmation dialog before publishing theme changes.
 */

import { useState } from 'react';
import { Loader2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useThemeEditor } from '../hooks/useThemeEditor';
import { canPublishTheme, getContrastSummary } from '../utils/contrast-checker';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';

interface PublishConfirmDialogProps {
  children: React.ReactNode;
  disabled?: boolean;
  tenantId?: string;
}

export function PublishConfirmDialog({ 
  children, 
  disabled, 
  tenantId = 'tenant_default' 
}: PublishConfirmDialogProps) {
  const { themeState, themeId, saveCheckpoint, markClean } = useThemeEditor();
  const [publishResult, setPublishResult] = useState<'idle' | 'success' | 'error'>('idle');

  const currentStyles = themeState.styles[themeState.currentMode];
  const canPublish = canPublishTheme(currentStyles) && !!themeId;
  const contrastSummary = getContrastSummary(currentStyles);

  const publishMutation = trpc.admin.publishTheme.useMutation({
    onSuccess: () => {
      saveCheckpoint();
      markClean();
      setPublishResult('success');
      toast.success('Theme published successfully!');
    },
    onError: (error) => {
      console.error('Failed to publish theme:', error);
      setPublishResult('error');
      toast.error(`Failed to publish: ${error.message}`);
    },
  });

  const handlePublish = async () => {
    if (!themeId) {
      toast.error('Please wait for the theme to finish saving before publishing.');
      return;
    }
    setPublishResult('idle');
    publishMutation.mutate({ tenantId, themeId });
  };

  const isPublishing = publishMutation.isLoading;

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild disabled={disabled}>
        {children}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Publish Theme Changes?</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4">
              <p>
                This will apply your theme changes to your live website. Your visitors will see
                the new design immediately.
              </p>

              {/* Contrast Summary */}
              <div className="rounded-lg border p-3 space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  {canPublish ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span>Accessibility Check Passed</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                      <span className="text-destructive">Accessibility Issues Found</span>
                    </>
                  )}
                </div>
                <div className="text-xs text-muted-foreground">
                  {contrastSummary.passing} of {contrastSummary.total} color pairs meet WCAG AA
                  standards.
                  {contrastSummary.criticalFailing > 0 && (
                    <span className="text-destructive block mt-1">
                      {contrastSummary.criticalFailing} critical issue
                      {contrastSummary.criticalFailing > 1 ? 's' : ''} must be fixed before
                      publishing.
                    </span>
                  )}
                </div>
              </div>

              {/* Result Messages */}
              {publishResult === 'success' && (
                <div className="rounded-lg bg-green-500/10 border border-green-500/20 p-3">
                  <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                    <CheckCircle2 className="h-4 w-4" />
                    Theme published successfully!
                  </div>
                </div>
              )}

              {publishResult === 'error' && (
                <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3">
                  <div className="flex items-center gap-2 text-sm text-destructive">
                    <AlertTriangle className="h-4 w-4" />
                    Failed to publish. Please try again.
                  </div>
                </div>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPublishing}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handlePublish();
            }}
            disabled={isPublishing || !canPublish}
            className={!canPublish ? 'opacity-50 cursor-not-allowed' : ''}
          >
            {isPublishing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Publishing...
              </>
            ) : (
              'Confirm & Publish'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
