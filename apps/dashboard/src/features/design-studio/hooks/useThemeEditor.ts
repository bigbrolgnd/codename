import { useThemeEditorStore } from '../stores/theme-editor.store';

/**
 * Hook to access the theme editor store.
 * Provides actions for updating styles, undo/redo, and checkpoint management.
 * 
 * @returns The theme editor store state and actions
 */
export const useThemeEditor = () => {
  return useThemeEditorStore((state) => state);
};

/**
 * Hook to get current styles for the active mode
 */
export function useCurrentModeStyles() {
  return useThemeEditorStore((state) => {
    const mode = state.themeState.currentMode;
    return state.themeState.styles[mode];
  });
}

/**
 * Hook to get undo/redo state
 */
export function useUndoRedo() {
  return useThemeEditorStore((state) => ({
    canUndo: state.history.length > 0,
    canRedo: state.future.length > 0,
    undo: state.undo,
    redo: state.redo,
  }));
}

/**
 * Hook to get dirty state
 */
export function useDirtyState() {
  return useThemeEditorStore((state) => ({
    isDirty: state.isDirty,
    hasUnsavedChanges: state.hasUnsavedChanges(),
    markClean: state.markClean,
  }));
}