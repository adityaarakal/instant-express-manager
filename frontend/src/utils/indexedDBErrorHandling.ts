/**
 * IndexedDB Error Handling Utilities
 * Provides error handling and recovery for IndexedDB persistence failures
 */

import { useToastStore } from '../store/useToastStore';

export interface IndexedDBError {
  error: Error;
  operation: string;
  storeName?: string;
  timestamp: string;
}

/**
 * Handle IndexedDB errors gracefully
 * Shows user-friendly error messages and logs details
 */
export function handleIndexedDBError(
  error: unknown,
  operation: string,
  storeName?: string,
): IndexedDBError {
  const errorObj: IndexedDBError = {
    error: error instanceof Error ? error : new Error(String(error)),
    operation,
    storeName,
    timestamp: new Date().toISOString(),
  };

  // Log error for debugging
  console.error('IndexedDB Error:', errorObj);

  // Show user-friendly error message
  const { showError } = useToastStore.getState();
  let message = `Failed to ${operation}`;
  
  if (storeName) {
    message += ` in ${storeName}`;
  }

  // Provide specific error messages for common issues
  if (error instanceof Error) {
    if (error.name === 'QuotaExceededError') {
      message += ': Storage quota exceeded. Please free up space.';
    } else if (error.name === 'InvalidStateError') {
      message += ': Database connection lost. Please refresh the page.';
    } else if (error.name === 'DataError') {
      message += ': Invalid data format. Please check your data.';
    } else {
      message += `: ${error.message}`;
    }
  }

  showError(message, 8000);

  return errorObj;
}

/**
 * Retry an IndexedDB operation with exponential backoff
 */
export async function retryIndexedDBOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000,
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      if (attempt < maxRetries - 1) {
        // Exponential backoff: 1s, 2s, 4s
        const delay = initialDelay * Math.pow(2, attempt);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}

/**
 * Check if IndexedDB is available
 */
export function isIndexedDBAvailable(): boolean {
  return typeof window !== 'undefined' && 'indexedDB' in window;
}

/**
 * Get IndexedDB storage usage estimate (if available)
 */
export async function getStorageUsage(): Promise<{
  quota: number | null;
  usage: number | null;
  available: number | null;
}> {
  if (!('storage' in navigator && 'estimate' in navigator.storage)) {
    return { quota: null, usage: null, available: null };
  }

  try {
    const estimate = await navigator.storage.estimate();
    return {
      quota: estimate.quota ?? null,
      usage: estimate.usage ?? null,
      available: estimate.quota && estimate.usage ? estimate.quota - estimate.usage : null,
    };
  } catch (error) {
    console.error('Failed to get storage usage:', error);
    return { quota: null, usage: null, available: null };
  }
}

/**
 * Clear all IndexedDB data (use with caution)
 */
export async function clearAllIndexedDBData(): Promise<void> {
  if (!isIndexedDBAvailable()) {
    throw new Error('IndexedDB is not available');
  }

  // This would need to be implemented based on your storage structure
  // For now, it's a placeholder
  console.warn('clearAllIndexedDBData is not fully implemented');
}

