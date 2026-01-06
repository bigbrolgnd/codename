import "@testing-library/jest-dom";
import { vi, beforeAll, afterAll } from 'vitest';

// Mock ResizeObserver for Radix UI
global.ResizeObserver = class ResizeObserver {
    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = vi.fn();
};

// Mock PointerEvent for Radix UI / shadcn
if (!global.PointerEvent) {
    class PointerEvent extends MouseEvent {
        constructor(type: string, props: MouseEventInit = {}) {
            super(type, props);
        }
    }
    global.PointerEvent = PointerEvent as any;
}

// Suppress known Framer Motion + jsdom false positive warnings
const originalError = console.error;
beforeAll(() => {
  console.error = (...args: unknown[]) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('React does not recognize the') ||
       args[0].includes('Received `false` for a non-boolean attribute') ||
       args[0].includes('Function components cannot be given refs'))
    ) {
      return; // Suppress these specific warnings
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});

