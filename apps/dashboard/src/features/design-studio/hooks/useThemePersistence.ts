import { useEffect } from 'react';
import { trpc } from '@/lib/trpc';
import { useThemeEditor } from './useThemeEditor';
import { themeEditorStore } from '../stores/theme-editor.store';
import { toast } from 'sonner';

export function useThemePersistence(tenantId: string) {
  const { themeState, loadTheme, setSaving, setLoading, isDirty, markClean } = useThemeEditor();

  // 1. Initial Load
  const { data, isLoading } = trpc.admin.getTheme.useQuery(
    { tenantId },
    {
      enabled: !!tenantId,
      refetchOnWindowFocus: false,
      onSuccess: (data) => {
        if (data?.theme) {
          loadTheme(data.theme);
        }
      },
    }
  );

  useEffect(() => {
    setLoading(isLoading);
  }, [isLoading, setLoading]);

  // 2. Auto-Save Mutation
  const saveMutation = trpc.admin.saveTheme.useMutation({
    onSuccess: (data) => {
      // Update the ID in the store if it was just created/updated
      if (data.theme?.id) {
        themeEditorStore.setState({ themeId: data.theme.id });
      }
      markClean();
      setSaving(false);
      toast.success('Theme saved');
    },
    onError: (error) => {
      setSaving(false);
      toast.error(`Failed to save theme: ${error.message}`);
    },
  });

  // Debounced save function
  const debouncedSave = useEffect(() => {
    if (!isDirty || !tenantId) return;

    const timer = setTimeout(() => {
      setSaving(true);
      saveMutation.mutate({
        tenantId,
        theme: {
          styles: themeState.styles,
          hslAdjustments: themeState.hslAdjustments,
          presetId: themeState.presetId,
        } as any,
      });
    }, 2000); // 2 second debounce for backend saves

    return () => clearTimeout(timer);
  }, [themeState, isDirty, tenantId]);

  return {
    isLoading,
    isSaving: saveMutation.isLoading,
  };
}
