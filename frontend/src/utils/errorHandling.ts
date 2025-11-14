/**
 * Error handling utilities for user-friendly error messages and retry mechanisms
 */

export interface ErrorWithRetry {
  message: string;
  retry?: () => void | Promise<void>;
  retryLabel?: string;
}

/**
 * Formats error messages to be user-friendly
 */
export function formatErrorMessage(error: unknown, defaultMessage: string): string {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    // Network errors
    if (message.includes('network') || message.includes('fetch') || message.includes('connection')) {
      return 'Network error. Please check your internet connection and try again.';
    }

    // Storage errors (localforage)
    if (message.includes('quota') || message.includes('storage') || message.includes('localforage')) {
      return 'Storage error. Please free up some space and try again.';
    }

    // Validation errors
    if (message.includes('validation') || message.includes('invalid') || message.includes('required')) {
      return error.message; // Keep validation messages as-is
    }

    // Permission errors
    if (message.includes('permission') || message.includes('denied') || message.includes('unauthorized')) {
      return 'Permission denied. Please check your access rights.';
    }

    // Generic error - use the error message if it's user-friendly, otherwise use default
    if (error.message && error.message.length < 100 && !error.message.includes('Error:')) {
      return error.message;
    }
  }

  return defaultMessage;
}

/**
 * Creates a retryable error object
 */
export function createRetryableError(
  message: string,
  retry: () => void | Promise<void>,
  retryLabel: string = 'Retry'
): ErrorWithRetry {
  return {
    message,
    retry,
    retryLabel,
  };
}

/**
 * Common error messages
 */
export const ErrorMessages = {
  NETWORK: 'Network error. Please check your internet connection and try again.',
  STORAGE: 'Storage error. Please free up some space and try again.',
  VALIDATION: 'Please check your input and try again.',
  PERMISSION: 'Permission denied. Please check your access rights.',
  NOT_FOUND: 'The requested item was not found.',
  DUPLICATE: 'This item already exists.',
  INVALID_DATA: 'Invalid data provided. Please check your input.',
  UNKNOWN: 'An unexpected error occurred. Please try again.',
} as const;

/**
 * Gets a user-friendly error message based on error type
 */
export function getUserFriendlyError(error: unknown, context: string): string {
  const defaultMessage = `Failed to ${context}. Please try again.`;
  return formatErrorMessage(error, defaultMessage);
}

