import { describe, it, expect } from 'vitest';
import {
  formatErrorMessage,
  createRetryableError,
  getUserFriendlyError,
  ErrorMessages,
} from '../errorHandling';

describe('errorHandling', () => {
  describe('formatErrorMessage', () => {
    it('should handle network errors', () => {
      const error = new Error('Network request failed');
      const result = formatErrorMessage(error, 'Default error');
      
      expect(result).toBe(ErrorMessages.NETWORK);
    });

    it('should handle fetch errors', () => {
      const error = new Error('Failed to fetch');
      const result = formatErrorMessage(error, 'Default error');
      
      expect(result).toBe(ErrorMessages.NETWORK);
    });

    it('should handle connection errors', () => {
      const error = new Error('Connection timeout');
      const result = formatErrorMessage(error, 'Default error');
      
      expect(result).toBe(ErrorMessages.NETWORK);
    });

    it('should handle storage quota errors', () => {
      const error = new Error('QuotaExceededError: Storage quota exceeded');
      const result = formatErrorMessage(error, 'Default error');
      
      expect(result).toBe(ErrorMessages.STORAGE);
    });

    it('should handle storage errors', () => {
      const error = new Error('LocalForage storage error');
      const result = formatErrorMessage(error, 'Default error');
      
      expect(result).toBe(ErrorMessages.STORAGE);
    });

    it('should handle validation errors', () => {
      const error = new Error('Validation failed: Name is required');
      const result = formatErrorMessage(error, 'Default error');
      
      expect(result).toBe('Validation failed: Name is required');
    });

    it('should handle invalid input errors', () => {
      const error = new Error('Invalid data provided');
      const result = formatErrorMessage(error, 'Default error');
      
      expect(result).toBe('Invalid data provided');
    });

    it('should handle permission errors', () => {
      const error = new Error('Permission denied');
      const result = formatErrorMessage(error, 'Default error');
      
      expect(result).toBe(ErrorMessages.PERMISSION);
    });

    it('should handle unauthorized errors', () => {
      const error = new Error('Unauthorized access');
      const result = formatErrorMessage(error, 'Default error');
      
      expect(result).toBe(ErrorMessages.PERMISSION);
    });

    it('should return user-friendly error message if short and simple', () => {
      const error = new Error('Item not found');
      const result = formatErrorMessage(error, 'Default error');
      
      expect(result).toBe('Item not found');
    });

    it('should use default message for long error messages', () => {
      const error = new Error(
        'This is a very long error message that exceeds one hundred characters ' +
        'and contains technical details that are not user-friendly'
      );
      const result = formatErrorMessage(error, 'Default error');
      
      expect(result).toBe('Default error');
    });

    it('should use default message for error messages with "Error:" prefix', () => {
      const error = new Error('Error: Technical error details');
      const result = formatErrorMessage(error, 'Default error');
      
      expect(result).toBe('Default error');
    });

    it('should handle non-Error objects', () => {
      const error = { message: 'String error' };
      const result = formatErrorMessage(error, 'Default error');
      
      expect(result).toBe('Default error');
    });

    it('should handle null/undefined errors', () => {
      const result = formatErrorMessage(null, 'Default error');
      
      expect(result).toBe('Default error');
    });

    it('should handle string errors', () => {
      const error = 'String error message';
      const result = formatErrorMessage(error, 'Default error');
      
      expect(result).toBe('Default error');
    });
  });

  describe('createRetryableError', () => {
    it('should create retryable error with default retry label', () => {
      const retryFn = () => {};
      const error = createRetryableError('Test error', retryFn);
      
      expect(error.message).toBe('Test error');
      expect(error.retry).toBe(retryFn);
      expect(error.retryLabel).toBe('Retry');
    });

    it('should create retryable error with custom retry label', () => {
      const retryFn = () => {};
      const error = createRetryableError('Test error', retryFn, 'Try Again');
      
      expect(error.message).toBe('Test error');
      expect(error.retry).toBe(retryFn);
      expect(error.retryLabel).toBe('Try Again');
    });

    it('should support async retry function', () => {
      const retryFn = async () => {
        await Promise.resolve();
      };
      const error = createRetryableError('Test error', retryFn);
      
      expect(error.message).toBe('Test error');
      expect(error.retry).toBe(retryFn);
    });
  });

  describe('getUserFriendlyError', () => {
    it('should format network error with context', () => {
      const error = new Error('Network request failed');
      const result = getUserFriendlyError(error, 'load data');
      
      expect(result).toBe(ErrorMessages.NETWORK);
    });

    it('should format storage error with context', () => {
      const error = new Error('QuotaExceededError');
      const result = getUserFriendlyError(error, 'save data');
      
      expect(result).toBe(ErrorMessages.STORAGE);
    });

    it('should use default message format when error is unknown', () => {
      const error = new Error('Unknown technical error');
      const result = getUserFriendlyError(error, 'process transaction');
      
      // Error message is short and doesn't contain "Error:", so it's returned as-is
      expect(result).toBe('Unknown technical error');
    });

    it('should handle non-Error objects with context', () => {
      const error = { code: 'UNKNOWN' };
      const result = getUserFriendlyError(error, 'export backup');
      
      expect(result).toBe('Failed to export backup. Please try again.');
    });
  });

  describe('ErrorMessages constants', () => {
    it('should have all required error message constants', () => {
      expect(ErrorMessages.NETWORK).toBeDefined();
      expect(ErrorMessages.STORAGE).toBeDefined();
      expect(ErrorMessages.VALIDATION).toBeDefined();
      expect(ErrorMessages.PERMISSION).toBeDefined();
      expect(ErrorMessages.NOT_FOUND).toBeDefined();
      expect(ErrorMessages.DUPLICATE).toBeDefined();
      expect(ErrorMessages.INVALID_DATA).toBeDefined();
      expect(ErrorMessages.UNKNOWN).toBeDefined();
    });

    it('should have user-friendly error messages', () => {
      expect(ErrorMessages.NETWORK).toContain('Network');
      expect(ErrorMessages.STORAGE).toContain('Storage');
      expect(ErrorMessages.VALIDATION).toContain('check your input');
      expect(ErrorMessages.PERMISSION).toContain('Permission');
    });
  });
});

