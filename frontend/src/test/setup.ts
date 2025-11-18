/**
 * Vitest test setup file
 * Configures test environment with necessary mocks and utilities
 */

import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock localforage for tests
vi.mock('localforage', () => {
  const memoryStore: Record<string, unknown> = {};
  return {
    default: {
      createInstance: () => ({
        getItem: vi.fn((key: string) => Promise.resolve(memoryStore[key] || null)),
        setItem: vi.fn((key: string, value: unknown) => {
          memoryStore[key] = value;
          return Promise.resolve(value);
        }),
        removeItem: vi.fn((key: string) => {
          delete memoryStore[key];
          return Promise.resolve();
        }),
        clear: vi.fn(() => {
          Object.keys(memoryStore).forEach((key) => delete memoryStore[key]);
          return Promise.resolve();
        }),
        keys: vi.fn(() => Promise.resolve(Object.keys(memoryStore))),
      }),
    },
  };
});

// Mock window.matchMedia for Material-UI components
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  takeRecords() {
    return [];
  }
  unobserve() {}
} as unknown as typeof IntersectionObserver;

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
} as typeof ResizeObserver;
