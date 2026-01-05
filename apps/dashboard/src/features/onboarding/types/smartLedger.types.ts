import type { ExtractedService, ExtractionResult } from '@codename/api';

/**
 * Extended service with edit state for the Smart Ledger UI
 */
export interface EditableService extends ExtractedService {
  isEditing: boolean;
  isNew: boolean;           // User-added, not AI-extracted
  isDeleted: boolean;       // Soft delete for undo
  hasChanges: boolean;      // Modified from original
  validationErrors: ServiceValidationError[];
}

export interface ServiceValidationError {
  field: 'name' | 'price' | 'duration' | 'category';
  message: string;
}

/**
 * Category grouping for large lists (>50 services)
 */
export interface ServiceCategory {
  name: string;
  services: EditableService[];
  isExpanded: boolean;
}

/**
 * Smart suggestions from AI for service improvements
 */
export interface SmartSuggestion {
  id: string;
  type: 'missing_price' | 'add_service' | 'merge_duplicate' | 'adjust_duration';
  message: string;
  actionLabel: string;
  targetServiceId?: string;
  suggestedValue?: string | number;
}

/**
 * Duration options in 30-minute intervals
 */
export const DURATION_OPTIONS = [
  { value: 15, label: '15 min' },
  { value: 30, label: '30 min' },
  { value: 45, label: '45 min' },
  { value: 60, label: '1 hour' },
  { value: 90, label: '1.5 hours' },
  { value: 120, label: '2 hours' },
  { value: 150, label: '2.5 hours' },
  { value: 180, label: '3 hours' },
  { value: 240, label: '4 hours' },
  { value: 300, label: '5 hours' },
  { value: 360, label: '6 hours' },
  { value: 480, label: '8 hours' },
] as const;

export type DurationValue = (typeof DURATION_OPTIONS)[number]['value'];

/**
 * State for the Smart Ledger reducer
 */
export interface SmartLedgerState {
  services: EditableService[];
  editingServiceId: string | null;
  history: EditableService[][]; // For undo functionality
  historyIndex: number;
}

/**
 * Actions for the Smart Ledger reducer
 */
export type SmartLedgerAction =
  | { type: 'UPDATE_SERVICE'; id: string; updates: Partial<Omit<EditableService, 'id'>> }
  | { type: 'DELETE_SERVICE'; id: string }
  | { type: 'RESTORE_SERVICE'; id: string }
  | { type: 'ADD_SERVICE'; service: Omit<ExtractedService, 'id'> }
  | { type: 'SET_EDITING'; id: string | null }
  | { type: 'APPLY_SUGGESTION'; suggestion: SmartSuggestion }
  | { type: 'UNDO' }
  | { type: 'CONFIRM_ALL' };

/**
 * Props for the main SmartLedger component
 */
export interface SmartLedgerProps {
  extractionResult: ExtractionResult;
  onBuild: (services: EditableService[]) => void;
  onBack: () => void;
}

/**
 * Return type for useServiceEditor hook
 */
export interface UseServiceEditorReturn {
  services: EditableService[];
  categories: ServiceCategory[];
  editingServiceId: string | null;

  // CRUD operations
  updateService: (id: string, updates: Partial<Omit<EditableService, 'id'>>) => void;
  deleteService: (id: string) => void;
  restoreService: (id: string) => void;
  addService: (service: Omit<ExtractedService, 'id'>) => void;
  setEditing: (id: string | null) => void;

  // Bulk operations
  confirmAll: () => void;

  // Derived state
  validServices: EditableService[];
  validServiceCount: number;
  hasValidationErrors: boolean;
  hasUnsavedChanges: boolean;
  lowConfidenceCount: number;

  // History
  undo: () => void;
  canUndo: boolean;
}
