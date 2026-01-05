import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useServiceEditor } from './useServiceEditor';
import type { ExtractionResult, ExtractedService } from '@codename/api';

// Mock extraction result for testing
const createMockExtractionResult = (services: Partial<ExtractedService>[] = []): ExtractionResult => ({
  id: 'test-extraction-id',
  services: services.map((s, i) => ({
    id: `service-${i + 1}`,
    name: s.name ?? `Service ${i + 1}`,
    price: s.price ?? 100,
    duration: s.duration ?? 60,
    category: s.category ?? 'General',
    confidence: s.confidence ?? 90,
    ...s,
  })),
  categories: ['General'],
  overallConfidence: 85,
  sourceImageUrl: 'https://example.com/image.jpg',
  processingTimeMs: 1500,
  warnings: [],
});

describe('useServiceEditor', () => {
  describe('initialization', () => {
    it('should initialize with services from extraction result', () => {
      const mockResult = createMockExtractionResult([
        { name: 'Haircut', price: 50 },
        { name: 'Coloring', price: 100 },
      ]);

      const { result } = renderHook(() => useServiceEditor(mockResult));

      expect(result.current.services).toHaveLength(2);
      expect(result.current.services[0].name).toBe('Haircut');
      expect(result.current.services[1].name).toBe('Coloring');
    });

    it('should mark all services as not editing, not new, not deleted initially', () => {
      const mockResult = createMockExtractionResult([{ name: 'Haircut' }]);

      const { result } = renderHook(() => useServiceEditor(mockResult));

      expect(result.current.services[0].isEditing).toBe(false);
      expect(result.current.services[0].isNew).toBe(false);
      expect(result.current.services[0].isDeleted).toBe(false);
      expect(result.current.services[0].hasChanges).toBe(false);
    });

    it('should compute valid service count excluding deleted services', () => {
      const mockResult = createMockExtractionResult([
        { name: 'Service 1' },
        { name: 'Service 2' },
        { name: 'Service 3' },
      ]);

      const { result } = renderHook(() => useServiceEditor(mockResult));

      expect(result.current.validServiceCount).toBe(3);
    });
  });

  describe('updateService', () => {
    it('should update a service by id', () => {
      const mockResult = createMockExtractionResult([{ name: 'Haircut', price: 50 }]);

      const { result } = renderHook(() => useServiceEditor(mockResult));

      act(() => {
        result.current.updateService('service-1', { name: 'Premium Haircut', price: 75 });
      });

      expect(result.current.services[0].name).toBe('Premium Haircut');
      expect(result.current.services[0].price).toBe(75);
      expect(result.current.services[0].hasChanges).toBe(true);
    });

    it('should not modify other services when updating one', () => {
      const mockResult = createMockExtractionResult([
        { name: 'Service 1' },
        { name: 'Service 2' },
      ]);

      const { result } = renderHook(() => useServiceEditor(mockResult));

      act(() => {
        result.current.updateService('service-1', { name: 'Updated Service 1' });
      });

      expect(result.current.services[0].name).toBe('Updated Service 1');
      expect(result.current.services[1].name).toBe('Service 2');
      expect(result.current.services[1].hasChanges).toBe(false);
    });
  });

  describe('deleteService', () => {
    it('should soft delete a service (set isDeleted to true)', () => {
      const mockResult = createMockExtractionResult([{ name: 'Haircut' }]);

      const { result } = renderHook(() => useServiceEditor(mockResult));

      act(() => {
        result.current.deleteService('service-1');
      });

      expect(result.current.services[0].isDeleted).toBe(true);
    });

    it('should reduce valid service count when service is deleted', () => {
      const mockResult = createMockExtractionResult([
        { name: 'Service 1' },
        { name: 'Service 2' },
      ]);

      const { result } = renderHook(() => useServiceEditor(mockResult));

      expect(result.current.validServiceCount).toBe(2);

      act(() => {
        result.current.deleteService('service-1');
      });

      expect(result.current.validServiceCount).toBe(1);
    });
  });

  describe('restoreService', () => {
    it('should restore a deleted service', () => {
      const mockResult = createMockExtractionResult([{ name: 'Haircut' }]);

      const { result } = renderHook(() => useServiceEditor(mockResult));

      act(() => {
        result.current.deleteService('service-1');
      });

      expect(result.current.services[0].isDeleted).toBe(true);

      act(() => {
        result.current.restoreService('service-1');
      });

      expect(result.current.services[0].isDeleted).toBe(false);
    });
  });

  describe('addService', () => {
    it('should add a new service with isNew flag', () => {
      const mockResult = createMockExtractionResult([{ name: 'Existing' }]);

      const { result } = renderHook(() => useServiceEditor(mockResult));

      act(() => {
        result.current.addService({
          name: 'New Service',
          price: 100,
          duration: 60,
          category: 'New',
          confidence: 100,
        });
      });

      expect(result.current.services).toHaveLength(2);
      expect(result.current.services[1].name).toBe('New Service');
      expect(result.current.services[1].isNew).toBe(true);
    });

    it('should generate a unique id for new services', () => {
      const mockResult = createMockExtractionResult([]);

      const { result } = renderHook(() => useServiceEditor(mockResult));

      act(() => {
        result.current.addService({
          name: 'Service A',
          price: 50,
          duration: 30,
          category: null,
          confidence: 100,
        });
      });

      act(() => {
        result.current.addService({
          name: 'Service B',
          price: 75,
          duration: 45,
          category: null,
          confidence: 100,
        });
      });

      expect(result.current.services[0].id).not.toBe(result.current.services[1].id);
    });
  });

  describe('setEditing', () => {
    it('should set the editing service id', () => {
      const mockResult = createMockExtractionResult([{ name: 'Haircut' }]);

      const { result } = renderHook(() => useServiceEditor(mockResult));

      act(() => {
        result.current.setEditing('service-1');
      });

      expect(result.current.editingServiceId).toBe('service-1');
    });

    it('should clear editing when set to null', () => {
      const mockResult = createMockExtractionResult([{ name: 'Haircut' }]);

      const { result } = renderHook(() => useServiceEditor(mockResult));

      act(() => {
        result.current.setEditing('service-1');
      });

      act(() => {
        result.current.setEditing(null);
      });

      expect(result.current.editingServiceId).toBeNull();
    });
  });

  describe('undo', () => {
    it('should undo the last action', () => {
      const mockResult = createMockExtractionResult([{ name: 'Haircut' }]);

      const { result } = renderHook(() => useServiceEditor(mockResult));

      act(() => {
        result.current.updateService('service-1', { name: 'Changed' });
      });

      expect(result.current.services[0].name).toBe('Changed');

      act(() => {
        result.current.undo();
      });

      expect(result.current.services[0].name).toBe('Haircut');
    });

    it('should not undo when canUndo is false', () => {
      const mockResult = createMockExtractionResult([{ name: 'Haircut' }]);

      const { result } = renderHook(() => useServiceEditor(mockResult));

      expect(result.current.canUndo).toBe(false);

      // Calling undo should not throw
      act(() => {
        result.current.undo();
      });

      expect(result.current.services[0].name).toBe('Haircut');
    });

    it('should track canUndo state correctly', () => {
      const mockResult = createMockExtractionResult([{ name: 'Haircut' }]);

      const { result } = renderHook(() => useServiceEditor(mockResult));

      expect(result.current.canUndo).toBe(false);

      act(() => {
        result.current.updateService('service-1', { name: 'Changed' });
      });

      expect(result.current.canUndo).toBe(true);
    });
  });

  describe('categories', () => {
    it('should group services by category', () => {
      const mockResult = createMockExtractionResult([
        { name: 'Service 1', category: 'Hair' },
        { name: 'Service 2', category: 'Hair' },
        { name: 'Service 3', category: 'Nails' },
      ]);

      const { result } = renderHook(() => useServiceEditor(mockResult));

      expect(result.current.categories).toHaveLength(2);
      expect(result.current.categories.find(c => c.name === 'Hair')?.services).toHaveLength(2);
      expect(result.current.categories.find(c => c.name === 'Nails')?.services).toHaveLength(1);
    });

    it('should handle services with null category', () => {
      const mockResult = createMockExtractionResult([
        { name: 'Service 1', category: null },
        { name: 'Service 2', category: 'Hair' },
      ]);

      const { result } = renderHook(() => useServiceEditor(mockResult));

      const uncategorized = result.current.categories.find(c => c.name === 'Uncategorized');
      expect(uncategorized?.services).toHaveLength(1);
    });
  });

  describe('derived state', () => {
    it('should compute hasUnsavedChanges correctly', () => {
      const mockResult = createMockExtractionResult([{ name: 'Haircut' }]);

      const { result } = renderHook(() => useServiceEditor(mockResult));

      expect(result.current.hasUnsavedChanges).toBe(false);

      act(() => {
        result.current.updateService('service-1', { name: 'Changed' });
      });

      expect(result.current.hasUnsavedChanges).toBe(true);
    });

    it('should compute lowConfidenceCount correctly', () => {
      const mockResult = createMockExtractionResult([
        { name: 'High', confidence: 95 },
        { name: 'Medium', confidence: 75 },
        { name: 'Low', confidence: 50 },
      ]);

      const { result } = renderHook(() => useServiceEditor(mockResult));

      // Services with confidence < 80% are low confidence
      expect(result.current.lowConfidenceCount).toBe(2);
    });

    it('should compute validServices excluding deleted services', () => {
      const mockResult = createMockExtractionResult([
        { name: 'Service 1' },
        { name: 'Service 2' },
      ]);

      const { result } = renderHook(() => useServiceEditor(mockResult));

      act(() => {
        result.current.deleteService('service-1');
      });

      expect(result.current.validServices).toHaveLength(1);
      expect(result.current.validServices[0].name).toBe('Service 2');
    });
  });

  describe('validation', () => {
    it('should validate service name is not empty', () => {
      const mockResult = createMockExtractionResult([{ name: 'Haircut' }]);

      const { result } = renderHook(() => useServiceEditor(mockResult));

      act(() => {
        result.current.updateService('service-1', { name: '' });
      });

      expect(result.current.services[0].validationErrors).toContainEqual(
        expect.objectContaining({ field: 'name' })
      );
      expect(result.current.hasValidationErrors).toBe(true);
    });

    it('should validate price is non-negative', () => {
      const mockResult = createMockExtractionResult([{ name: 'Haircut', price: 50 }]);

      const { result } = renderHook(() => useServiceEditor(mockResult));

      act(() => {
        result.current.updateService('service-1', { price: -10 });
      });

      expect(result.current.services[0].validationErrors).toContainEqual(
        expect.objectContaining({ field: 'price' })
      );
    });

    it('should clear validation errors when fixed', () => {
      const mockResult = createMockExtractionResult([{ name: 'Haircut' }]);

      const { result } = renderHook(() => useServiceEditor(mockResult));

      act(() => {
        result.current.updateService('service-1', { name: '' });
      });

      expect(result.current.hasValidationErrors).toBe(true);

      act(() => {
        result.current.updateService('service-1', { name: 'Fixed Name' });
      });

      expect(result.current.services[0].validationErrors).toHaveLength(0);
      expect(result.current.hasValidationErrors).toBe(false);
    });
  });

  describe('confirmAll', () => {
    it('should mark all services as having no changes after confirm', () => {
      const mockResult = createMockExtractionResult([
        { name: 'Service 1' },
        { name: 'Service 2' },
      ]);

      const { result } = renderHook(() => useServiceEditor(mockResult));

      act(() => {
        result.current.updateService('service-1', { name: 'Changed 1' });
        result.current.updateService('service-2', { name: 'Changed 2' });
      });

      expect(result.current.hasUnsavedChanges).toBe(true);

      act(() => {
        result.current.confirmAll();
      });

      expect(result.current.services[0].hasChanges).toBe(false);
      expect(result.current.services[1].hasChanges).toBe(false);
      expect(result.current.hasUnsavedChanges).toBe(false);
    });
  });
});
