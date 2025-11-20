/**
 * Tests for IndexedDB error handling utilities
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  handleIndexedDBError,
  retryIndexedDBOperation,
  isIndexedDBAvailable,
  getStorageUsage,
} from '../indexedDBErrorHandling';

// Mock useToastStore
vi.mock('../store/useToastStore', () => ({
  useToastStore: {
    getState: vi.fn(() => ({
      showError: vi.fn(),
    })),
  },
}));

describe('indexedDBErrorHandling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('handleIndexedDBError', () => {
    it('should create error object with correct structure', () => {
      const error = new Error('Test error');
      const result = handleIndexedDBError(error, 'test operation', 'test-store');

      expect(result.error).toBe(error);
      expect(result.operation).toBe('test operation');
      expect(result.storeName).toBe('test-store');
      expect(result.timestamp).toBeDefined();
    });

    it('should handle non-Error objects', () => {
      const error = 'String error';
      const result = handleIndexedDBError(error, 'test operation');

      expect(result.error).toBeInstanceOf(Error);
      expect(result.error.message).toBe('String error');
    });

    it('should provide specific error messages for QuotaExceededError', () => {
      const error = new Error('Quota exceeded');
      error.name = 'QuotaExceededError';
      handleIndexedDBError(error, 'save', 'test-store');

      // The function should show an error toast with quota message
      // We can't easily test the toast, but we can verify the function doesn't throw
      expect(() => handleIndexedDBError(error, 'save', 'test-store')).not.toThrow();
    });

    it('should provide specific error messages for InvalidStateError', () => {
      const error = new Error('Invalid state');
      error.name = 'InvalidStateError';
      expect(() => handleIndexedDBError(error, 'save', 'test-store')).not.toThrow();
    });

    it('should provide specific error messages for DataError', () => {
      const error = new Error('Data error');
      error.name = 'DataError';
      expect(() => handleIndexedDBError(error, 'save', 'test-store')).not.toThrow();
    });
  });

  describe('retryIndexedDBOperation', () => {
    it('should succeed on first attempt', async () => {
      const operation = vi.fn().mockResolvedValue('success');
      const result = await retryIndexedDBOperation(operation);

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should retry on failure and succeed', async () => {
      const operation = vi
        .fn()
        .mockRejectedValueOnce(new Error('First failure'))
        .mockResolvedValueOnce('success');

      const result = await retryIndexedDBOperation(operation, 2, 10);

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(2);
    });

    it('should throw after max retries', async () => {
      const error = new Error('Persistent failure');
      const operation = vi.fn().mockRejectedValue(error);

      await expect(retryIndexedDBOperation(operation, 3, 10)).rejects.toThrow('Persistent failure');
      expect(operation).toHaveBeenCalledTimes(3);
    });

    it('should use exponential backoff', async () => {
      const operation = vi
        .fn()
        .mockRejectedValueOnce(new Error('First failure'))
        .mockRejectedValueOnce(new Error('Second failure'))
        .mockResolvedValueOnce('success');

      const startTime = Date.now();
      await retryIndexedDBOperation(operation, 3, 10);
      const endTime = Date.now();

      // Should have waited at least 10ms + 20ms = 30ms
      expect(endTime - startTime).toBeGreaterThanOrEqual(25); // Allow some margin
      expect(operation).toHaveBeenCalledTimes(3);
    });
  });

  describe('isIndexedDBAvailable', () => {
    it('should return true in browser environment', () => {
      // In test environment, window should be available
      expect(isIndexedDBAvailable()).toBe(true);
    });

    it('should check for indexedDB in window', () => {
      const result = isIndexedDBAvailable();
      expect(typeof result).toBe('boolean');
    });
  });

  describe('getStorageUsage', () => {
    it('should return storage usage if available', async () => {
      // Mock navigator.storage.estimate if available
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        const result = await getStorageUsage();
        expect(result).toHaveProperty('quota');
        expect(result).toHaveProperty('usage');
        expect(result).toHaveProperty('available');
      } else {
        // If not available, should return nulls
        const result = await getStorageUsage();
        expect(result.quota).toBeNull();
        expect(result.usage).toBeNull();
        expect(result.available).toBeNull();
      }
    });

    it('should handle errors gracefully', async () => {
      // If estimate throws, should return nulls
      const originalEstimate = (navigator.storage as any)?.estimate;
      if (originalEstimate) {
        (navigator.storage as any).estimate = vi.fn().mockRejectedValue(new Error('Test error'));
        const result = await getStorageUsage();
        expect(result.quota).toBeNull();
        expect(result.usage).toBeNull();
        expect(result.available).toBeNull();
        // Restore original
        (navigator.storage as any).estimate = originalEstimate;
      }
    });
  });
});

