import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  sanitizeString,
  safeJsonParse,
  validateFile,
  validateBackupStructure,
  containsMaliciousPattern,
  escapeHtml,
  isSecureContext,
  getSecurityHeaders,
} from '../security';

describe('security', () => {
  describe('sanitizeString', () => {
    it('should remove HTML tags', () => {
      expect(sanitizeString('<script>alert("xss")</script>')).not.toContain('<script>');
    });

    it('should escape HTML entities', () => {
      // Note: '<>' is treated as an HTML tag and removed, so we test with characters that don't form tags
      const result1 = sanitizeString('&"\'/');
      expect(result1).toContain('&amp;');
      expect(result1).toContain('&quot;');
      
      // Test with angle brackets that don't form a tag (have content between them)
      const result2 = sanitizeString('<test>');
      expect(result2).not.toContain('<test>'); // Tag should be removed
      
      // Test standalone angle brackets that escape properly (won't match tag pattern if they're separate)
      const result3 = sanitizeString('a < b > c');
      expect(result3).toContain('&lt;');
      expect(result3).toContain('&gt;');
    });

    it('should remove JavaScript event handlers', () => {
      const result = sanitizeString('<div onclick="alert(1)">test</div>');
      expect(result).not.toContain('onclick');
    });

    it('should remove javascript: protocol', () => {
      const result = sanitizeString('javascript:alert(1)');
      expect(result).not.toContain('javascript:');
    });

    it('should handle empty string', () => {
      expect(sanitizeString('')).toBe('');
    });

    it('should handle non-string input', () => {
      expect(sanitizeString(null as unknown as string)).toBe('');
      expect(sanitizeString(undefined as unknown as string)).toBe('');
    });
  });

  describe('safeJsonParse', () => {
    it('should parse valid JSON', () => {
      const result = safeJsonParse('{"key": "value"}');
      expect(result).toEqual({ key: 'value' });
    });

    it('should return null for invalid JSON', () => {
      const result = safeJsonParse('invalid json');
      expect(result).toBeNull();
    });

    it('should return null for too large JSON', () => {
      const largeJson = JSON.stringify({ data: 'x'.repeat(11 * 1024 * 1024) }); // 11MB
      const result = safeJsonParse(largeJson, 10 * 1024 * 1024); // 10MB max
      expect(result).toBeNull();
    });

    it('should filter out prototype pollution attempts', () => {
      const maliciousJson = '{"__proto__": {"isAdmin": true}}';
      const result = safeJsonParse(maliciousJson);
      // __proto__ should be filtered out, result should be empty object or null
      if (result && typeof result === 'object') {
        expect(result).not.toHaveProperty('__proto__');
      } else {
        expect(result).toBeNull();
      }
    });

    it('should return null for non-string input', () => {
      expect(safeJsonParse(null as unknown as string)).toBeNull();
      expect(safeJsonParse(undefined as unknown as string)).toBeNull();
    });

    it('should handle empty string', () => {
      expect(safeJsonParse('')).toBeNull();
    });
  });

  describe('validateFile', () => {
    let mockFile: File;

    beforeEach(() => {
      mockFile = new File(['content'], 'test.json', { type: 'application/json' });
    });

    it('should validate correct file type and size', () => {
      const result = validateFile(mockFile, ['application/json'], 1000);
      expect(result.valid).toBe(true);
    });

    it('should reject invalid file type', () => {
      const result = validateFile(mockFile, ['image/png'], 1000);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid file type');
    });

    it('should reject file that is too large', () => {
      const largeFile = new File(['x'.repeat(2000)], 'test.json', { type: 'application/json' });
      const result = validateFile(largeFile, ['application/json'], 1000);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('exceeds maximum');
    });

    it('should reject empty file', () => {
      const emptyFile = new File([], 'test.json', { type: 'application/json' });
      const result = validateFile(emptyFile, ['application/json'], 1000);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('empty');
    });

    it('should reject null file', () => {
      const result = validateFile(null as unknown as File, ['application/json'], 1000);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('No file provided');
    });
  });

  describe('validateBackupStructure', () => {
    it('should validate correct backup structure', () => {
      const backup = {
        version: '1.0.0',
        timestamp: '2025-01-01T00:00:00Z',
        data: {
          banks: [],
          bankAccounts: [],
          incomeTransactions: [],
          expenseTransactions: [],
          savingsInvestmentTransactions: [],
          expenseEMIs: [],
          savingsInvestmentEMIs: [],
          recurringIncomes: [],
          recurringExpenses: [],
          recurringSavingsInvestments: [],
        },
      };

      const result = validateBackupStructure(backup);
      expect(result.valid).toBe(true);
    });

    it('should reject backup without version', () => {
      const backup = {
        timestamp: '2025-01-01T00:00:00Z',
        data: {},
      };

      const result = validateBackupStructure(backup);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('version');
    });

    it('should reject backup with non-array data field', () => {
      const backup = {
        version: '1.0.0',
        timestamp: '2025-01-01T00:00:00Z',
        data: {
          banks: 'not an array',
        },
      };

      const result = validateBackupStructure(backup);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('array');
    });

    it('should reject non-object input', () => {
      const result = validateBackupStructure('not an object');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('object');
    });
  });

  describe('containsMaliciousPattern', () => {
    it('should detect script tags', () => {
      expect(containsMaliciousPattern('<script>alert(1)</script>')).toBe(true);
    });

    it('should detect javascript: protocol', () => {
      expect(containsMaliciousPattern('javascript:alert(1)')).toBe(true);
    });

    it('should detect event handlers', () => {
      expect(containsMaliciousPattern('<div onclick="alert(1)">')).toBe(true);
    });

    it('should return false for safe content', () => {
      expect(containsMaliciousPattern('Hello, world!')).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(containsMaliciousPattern('')).toBe(false);
    });
  });

  describe('escapeHtml', () => {
    it('should escape HTML entities', () => {
      const result = escapeHtml('<>&"\'/');
      expect(result).toContain('&lt;');
      expect(result).toContain('&gt;');
      expect(result).toContain('&amp;');
    });

    it('should handle normal text', () => {
      expect(escapeHtml('Hello, world!')).toBe('Hello, world!');
    });

    it('should handle empty string', () => {
      expect(escapeHtml('')).toBe('');
    });

    it('should handle non-string input', () => {
      expect(escapeHtml(null as unknown as string)).toBe('');
      expect(escapeHtml(undefined as unknown as string)).toBe('');
    });
  });

  describe('isSecureContext', () => {
    it('should return true for HTTPS', () => {
      // Mock window.location
      const originalLocation = window.location;
      delete (window as { location?: Location }).location;
      (window as { location: Location }).location = {
        ...originalLocation,
        protocol: 'https:',
        hostname: 'example.com',
      } as Location;

      const result = isSecureContext();
      expect(result).toBe(true);

      // Restore
      window.location = originalLocation;
    });

    it('should return true for localhost', () => {
      const originalLocation = window.location;
      delete (window as { location?: Location }).location;
      (window as { location: Location }).location = {
        ...originalLocation,
        protocol: 'http:',
        hostname: 'localhost',
      } as Location;

      const result = isSecureContext();
      expect(result).toBe(true);

      // Restore
      window.location = originalLocation;
    });

    it('should return false for non-secure HTTP', () => {
      const originalLocation = window.location;
      delete (window as { location?: Location }).location;
      (window as { location: Location }).location = {
        ...originalLocation,
        protocol: 'http:',
        hostname: 'example.com',
      } as Location;

      const result = isSecureContext();
      expect(result).toBe(false);

      // Restore
      window.location = originalLocation;
    });
  });

  describe('getSecurityHeaders', () => {
    it('should return security headers object', () => {
      const headers = getSecurityHeaders();
      expect(headers).toHaveProperty('Content-Security-Policy');
      expect(headers).toHaveProperty('X-Content-Type-Options');
      expect(headers).toHaveProperty('X-Frame-Options');
      expect(headers).toHaveProperty('X-XSS-Protection');
    });

    it('should include CSP with proper directives', () => {
      const headers = getSecurityHeaders();
      expect(headers['Content-Security-Policy']).toContain("default-src 'self'");
      expect(headers['Content-Security-Policy']).toContain("script-src 'self'");
    });
  });
});

