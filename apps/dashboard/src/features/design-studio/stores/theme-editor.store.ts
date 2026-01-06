import { createStore } from 'zustand/vanilla';
import { useStore } from 'zustand';
import { devtools, persist, createJSONStorage } from 'zustand/middleware';
import type { 
  ThemeStyles, 
  ThemeStyleProps, 
  HSLAdjustments, 
  ThemeEditorState 
} from '../types/theme';
import { defaultThemeEditorState } from '../config/default-theme';
import { createDebouncedStorage } from '../middleware/persistence.middleware';

/**
 * History entry with timestamp for debouncing
 */
interface HistoryEntry {
  state: ThemeEditorState;
  timestamp: number;
}

/**
 * Theme editor store interface
 */
export interface ThemeEditorStore {
  // Tenant scoping
  tenantId: string | null;
  setTenantId: (id: string) => void;

  // Current state metadata
  themeId: string | null;

  // Current state
  themeState: ThemeEditorState;

  // Checkpoint for detecting unsaved changes
  checkpoint: ThemeEditorState | null;

  // Undo/redo stacks
  history: HistoryEntry[];
  future: HistoryEntry[];

  // Dirty state (has unsaved changes)
  isDirty: boolean;

  // Loading state
  isLoading: boolean;
  isSaving: boolean;

  // Actions - Style Updates
  setStyles: (mode: 'light' | 'dark', styles: Partial<ThemeStyleProps>) => void;
  setStyleProperty: (mode: 'light' | 'dark', key: keyof ThemeStyleProps, value: string) => void;
  setBothModeStyles: (lightStyles: Partial<ThemeStyleProps>, darkStyles: Partial<ThemeStyleProps>) => void;

  // Actions - HSL Adjustments
  setHSLAdjustments: (adjustments: Partial<HSLAdjustments>) => void;
  resetHSLAdjustments: () => void;

  // Actions - Mode
  setCurrentMode: (mode: 'light' | 'dark') => void;
  toggleMode: () => void;

  // Actions - Presets
  applyPreset: (presetId: string, styles: ThemeStyles) => void;

  // Actions - History
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  clearHistory: () => void;

  // Actions - Checkpoint
  saveCheckpoint: () => void;
  restoreCheckpoint: () => void;
  hasUnsavedChanges: () => boolean;

  // Actions - Loading/Saving
  setLoading: (loading: boolean) => void;
  setSaving: (saving: boolean) => void;
  markClean: () => void;

  // Actions - Reset
  reset: () => void;
  loadTheme: (state: any) => void;
}

// Configuration
const MAX_HISTORY = 30;
const DEBOUNCE_MS = 500;

// Track last history timestamp for debouncing
let lastHistoryTimestamp = 0;

/**
 * Deep equality check for theme states
 */
function isDeepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (typeof a !== typeof b) return false;
  if (typeof a !== 'object' || a === null || b === null) return false;

  const keysA = Object.keys(a as object);
  const keysB = Object.keys(b as object);

  if (keysA.length !== keysB.length) return false;

  for (const key of keysA) {
    if (!keysB.includes(key)) return false;
    if (!isDeepEqual((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key])) {
      return false;
    }
  }

  return true;
}

/**
 * Theme editor vanilla store
 */
export const themeEditorStore = createStore<ThemeEditorStore>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        tenantId: null,
        themeId: null,
        themeState: defaultThemeEditorState,
        checkpoint: null,
        history: [],
        future: [],
        isDirty: false,
        isLoading: false,
        isSaving: false,

        setTenantId: (tenantId) => set({ tenantId }),

        // Style Updates
        setStyles: (mode, newStyles) => {
          const now = Date.now();
          const shouldAddHistory = now - lastHistoryTimestamp > DEBOUNCE_MS;

          set((state) => {
            const updatedStyles: ThemeStyles = {
              ...state.themeState.styles,
              [mode]: { ...state.themeState.styles[mode], ...newStyles },
            };

            const newThemeState: ThemeEditorState = {
              ...state.themeState,
              styles: updatedStyles,
              presetId: null, // Clear preset on manual change
            };

            if (shouldAddHistory) {
              lastHistoryTimestamp = now;
              return {
                themeState: newThemeState,
                history: [
                  ...state.history.slice(-MAX_HISTORY + 1),
                  { state: state.themeState, timestamp: now },
                ],
                future: [],
                isDirty: true,
              };
            }

            return { themeState: newThemeState, isDirty: true };
          });
        },

        setStyleProperty: (mode, key, value) => {
          get().setStyles(mode, { [key]: value } as Partial<ThemeStyleProps>);
        },

        setBothModeStyles: (lightStyles, darkStyles) => {
          const now = Date.now();
          lastHistoryTimestamp = now;

          set((state) => ({
            themeState: {
              ...state.themeState,
              styles: {
                light: { ...state.themeState.styles.light, ...lightStyles },
                dark: { ...state.themeState.styles.dark, ...darkStyles },
              },
              presetId: null,
            },
            history: [
              ...state.history.slice(-MAX_HISTORY + 1),
              { state: state.themeState, timestamp: now },
            ],
            future: [],
            isDirty: true,
          }));
        },

        // HSL Adjustments
        setHSLAdjustments: (adjustments) => {
          set((state) => ({
            themeState: { 
              ...state.themeState, 
              hslAdjustments: { ...state.themeState.hslAdjustments, ...adjustments },
              presetId: null,
            },
            isDirty: true,
          }));
        },

        resetHSLAdjustments: () => {
          set((state) => ({
            themeState: {
              ...state.themeState,
              hslAdjustments: { hueShift: 0, saturationScale: 1, lightnessScale: 1 },
            },
            isDirty: true,
          }));
        },

        // Mode
        setCurrentMode: (mode) => {
          set((state) => ({
            themeState: { ...state.themeState, currentMode: mode },
          }));
        },

        toggleMode: () => {
          set((state) => ({
            themeState: {
              ...state.themeState,
              currentMode: state.themeState.currentMode === 'light' ? 'dark' : 'light',
            },
          }));
        },

        // Presets
        applyPreset: (presetId, styles) => {
          const now = Date.now();
          lastHistoryTimestamp = now;

          set((state) => ({
            themeState: {
              ...state.themeState,
              styles,
              presetId,
              hslAdjustments: { hueShift: 0, saturationScale: 1, lightnessScale: 1 },
            },
            history: [
              ...state.history.slice(-MAX_HISTORY + 1),
              { state: state.themeState, timestamp: now },
            ],
            future: [],
            isDirty: true,
          }));
        },

        // History - Undo
        undo: () => {
          const { history, themeState, future } = get();
          if (history.length === 0) return;

          const previous = history[history.length - 1];

          set({
            themeState: {
              ...previous.state,
              currentMode: themeState.currentMode, // Preserve mode
            },
            history: history.slice(0, -1),
            future: [{ state: themeState, timestamp: Date.now() }, ...future],
            isDirty: true,
          });
        },

        // History - Redo
        redo: () => {
          const { future, themeState, history } = get();
          if (future.length === 0) return;

          const next = future[0];

          set({
            themeState: {
              ...next.state,
              currentMode: themeState.currentMode, // Preserve mode
            },
            history: [...history, { state: themeState, timestamp: Date.now() }],
            future: future.slice(1),
            isDirty: true,
          });
        },

        canUndo: () => get().history.length > 0,
        canRedo: () => get().future.length > 0,

        clearHistory: () => {
          set({ history: [], future: [] });
        },

        // Checkpoint
        saveCheckpoint: () => {
          set({ checkpoint: JSON.parse(JSON.stringify(get().themeState)) });
        },

        restoreCheckpoint: () => {
          const { checkpoint, themeState, history } = get();
          if (!checkpoint) return;

          set({
            themeState: JSON.parse(JSON.stringify(checkpoint)),
            history: [...history, { state: themeState, timestamp: Date.now() }],
            future: [],
            isDirty: false,
          });
        },

        hasUnsavedChanges: () => {
          const { themeState, checkpoint } = get();
          if (!checkpoint) return get().isDirty;
          return !isDeepEqual(themeState.styles, checkpoint.styles);
        },

        // Loading/Saving
        setLoading: (loading) => set({ isLoading: loading }),
        setSaving: (saving) => set({ isSaving: saving }),
        markClean: () => set({ isDirty: false }),

        // Reset
        reset: () => {
          lastHistoryTimestamp = 0;
          set({
            themeId: null,
            themeState: defaultThemeEditorState,
            checkpoint: null,
            history: [],
            future: [],
            isDirty: false,
            isLoading: false,
            isSaving: false,
          });
        },

        // Load external theme
        loadTheme: (state) => {
          set({
            themeId: state.id || null,
            themeState: {
              styles: state.styles,
              hslAdjustments: state.hslAdjustments,
              currentMode: 'light',
              presetId: state.presetId,
            },
            checkpoint: {
              styles: state.styles,
              hslAdjustments: state.hslAdjustments,
              currentMode: 'light',
              presetId: state.presetId,
            },
            history: [],
            future: [],
            isDirty: false,
          });
        },
      }),
      {
        name: 'theme-editor-storage',
        storage: createJSONStorage(() => createDebouncedStorage(localStorage)),
        partialize: (state) => ({
          themeState: state.themeState,
          checkpoint: state.checkpoint,
          tenantId: state.tenantId,
          themeId: state.themeId,
        }),
      }
    ),
    { name: 'ThemeEditorStore' }
  )
);

/**
 * React hook for theme editor store
 */
export function useThemeEditorStore<T>(
  selector: (state: ThemeEditorStore) => T,
  equalityFn?: (a: T, b: T) => boolean
): T {
  return useStore(themeEditorStore, selector);
}