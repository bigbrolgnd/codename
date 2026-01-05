import { useReducer, useMemo, useCallback } from 'react';
import type { ExtractionResult, ExtractedService } from '@codename/api';
import type {
  EditableService,
  ServiceCategory,
  SmartLedgerState,
  SmartLedgerAction,
  UseServiceEditorReturn,
  ServiceValidationError,
} from '../types/smartLedger.types';

/**
 * Validates a service and returns validation errors
 */
function validateService(service: EditableService): ServiceValidationError[] {
  const errors: ServiceValidationError[] = [];

  if (!service.name || service.name.trim() === '') {
    errors.push({ field: 'name', message: 'Service name is required' });
  } else if (service.name.length > 100) {
    errors.push({ field: 'name', message: 'Service name must be 100 characters or less' });
  }

  if (service.price < 0) {
    errors.push({ field: 'price', message: 'Price must be non-negative' });
  } else if (service.price > 1000000) {
    errors.push({ field: 'price', message: 'Price must be less than $10,000' });
  }

  if (service.duration < 15) {
    errors.push({ field: 'duration', message: 'Duration must be at least 15 minutes' });
  } else if (service.duration > 480) {
    errors.push({ field: 'duration', message: 'Duration must be 8 hours or less' });
  }

  return errors;
}

/**
 * Converts an ExtractedService to an EditableService
 */
function toEditableService(service: ExtractedService): EditableService {
  const editable: EditableService = {
    ...service,
    isEditing: false,
    isNew: false,
    isDeleted: false,
    hasChanges: false,
    validationErrors: [],
  };
  editable.validationErrors = validateService(editable);
  return editable;
}

/**
 * Generates a unique ID for new services
 */
function generateId(): string {
  return `new-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Reducer for Smart Ledger state management
 */
function smartLedgerReducer(
  state: SmartLedgerState,
  action: SmartLedgerAction
): SmartLedgerState {
  switch (action.type) {
    case 'UPDATE_SERVICE': {
      const newServices = state.services.map((service) => {
        if (service.id !== action.id) return service;

        const updated: EditableService = {
          ...service,
          ...action.updates,
          hasChanges: true,
        };
        updated.validationErrors = validateService(updated);
        return updated;
      });

      return {
        ...state,
        services: newServices,
        history: [...state.history.slice(0, state.historyIndex + 1), state.services],
        historyIndex: state.historyIndex + 1,
      };
    }

    case 'DELETE_SERVICE': {
      const newServices = state.services.map((service) =>
        service.id === action.id ? { ...service, isDeleted: true } : service
      );

      return {
        ...state,
        services: newServices,
        history: [...state.history.slice(0, state.historyIndex + 1), state.services],
        historyIndex: state.historyIndex + 1,
      };
    }

    case 'RESTORE_SERVICE': {
      const newServices = state.services.map((service) =>
        service.id === action.id ? { ...service, isDeleted: false } : service
      );

      return {
        ...state,
        services: newServices,
        history: [...state.history.slice(0, state.historyIndex + 1), state.services],
        historyIndex: state.historyIndex + 1,
      };
    }

    case 'ADD_SERVICE': {
      const newService: EditableService = {
        ...action.service,
        id: generateId(),
        isEditing: false,
        isNew: true,
        isDeleted: false,
        hasChanges: true,
        validationErrors: [],
      };
      newService.validationErrors = validateService(newService);

      return {
        ...state,
        services: [...state.services, newService],
        history: [...state.history.slice(0, state.historyIndex + 1), state.services],
        historyIndex: state.historyIndex + 1,
      };
    }

    case 'SET_EDITING': {
      return {
        ...state,
        editingServiceId: action.id,
      };
    }

    case 'UNDO': {
      if (state.historyIndex < 0) return state;

      return {
        ...state,
        services: state.history[state.historyIndex],
        historyIndex: state.historyIndex - 1,
      };
    }

    case 'CONFIRM_ALL': {
      const newServices = state.services.map((service) => ({
        ...service,
        hasChanges: false,
      }));

      return {
        ...state,
        services: newServices,
        history: [],
        historyIndex: -1,
      };
    }

    default:
      return state;
  }
}

/**
 * Hook for managing editable services in the Smart Ledger UI
 */
export function useServiceEditor(
  extractionResult: ExtractionResult
): UseServiceEditorReturn {
  const initialState: SmartLedgerState = useMemo(
    () => ({
      services: extractionResult.services.map(toEditableService),
      editingServiceId: null,
      history: [],
      historyIndex: -1,
    }),
    [extractionResult]
  );

  const [state, dispatch] = useReducer(smartLedgerReducer, initialState);

  // CRUD operations
  const updateService = useCallback(
    (id: string, updates: Partial<Omit<EditableService, 'id'>>) => {
      dispatch({ type: 'UPDATE_SERVICE', id, updates });
    },
    []
  );

  const deleteService = useCallback((id: string) => {
    dispatch({ type: 'DELETE_SERVICE', id });
  }, []);

  const restoreService = useCallback((id: string) => {
    dispatch({ type: 'RESTORE_SERVICE', id });
  }, []);

  const addService = useCallback((service: Omit<ExtractedService, 'id'>) => {
    dispatch({ type: 'ADD_SERVICE', service });
  }, []);

  const setEditing = useCallback((id: string | null) => {
    dispatch({ type: 'SET_EDITING', id });
  }, []);

  const confirmAll = useCallback(() => {
    dispatch({ type: 'CONFIRM_ALL' });
  }, []);

  const undo = useCallback(() => {
    dispatch({ type: 'UNDO' });
  }, []);

  // Derived state
  const validServices = useMemo(
    () => state.services.filter((s) => !s.isDeleted),
    [state.services]
  );

  const validServiceCount = validServices.length;

  const hasValidationErrors = useMemo(
    () => validServices.some((s) => s.validationErrors.length > 0),
    [validServices]
  );

  const hasUnsavedChanges = useMemo(
    () => state.services.some((s) => s.hasChanges || s.isNew || s.isDeleted),
    [state.services]
  );

  const lowConfidenceCount = useMemo(
    () => validServices.filter((s) => s.confidence < 80).length,
    [validServices]
  );

  const canUndo = state.historyIndex >= 0;

  // Group services by category
  const categories = useMemo((): ServiceCategory[] => {
    const categoryMap = new Map<string, EditableService[]>();

    for (const service of validServices) {
      const categoryName = service.category || 'Uncategorized';
      const existing = categoryMap.get(categoryName) || [];
      categoryMap.set(categoryName, [...existing, service]);
    }

    return Array.from(categoryMap.entries()).map(([name, services]) => ({
      name,
      services,
      isExpanded: true,
    }));
  }, [validServices]);

  return {
    services: state.services,
    categories,
    editingServiceId: state.editingServiceId,

    // CRUD operations
    updateService,
    deleteService,
    restoreService,
    addService,
    setEditing,

    // Bulk operations
    confirmAll,

    // Derived state
    validServices,
    validServiceCount,
    hasValidationErrors,
    hasUnsavedChanges,
    lowConfidenceCount,

    // History
    undo,
    canUndo,
  };
}
