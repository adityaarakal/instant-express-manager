/**
 * Security utilities
 * Provides helper functions for data sanitization, validation, and security checks
 */

/**
 * Sanitize string input to prevent XSS attacks
 * Removes potentially dangerous characters and HTML tags
 * @param input - The input string to sanitize
 * @returns Sanitized string safe for display
 */
export function sanitizeString(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  let sanitized = input;

  // Remove JavaScript event handlers (onclick, onerror, etc.)
  sanitized = sanitized.replace(/on\w+\s*=/gi, '');

  // Remove javascript: protocol
  sanitized = sanitized.replace(/javascript:/gi, '');

  // Remove data: URLs (except data:image for trusted images)
  sanitized = sanitized.replace(/data:(?!image\/[png|jpg|jpeg|gif|webp])/gi, '');

  // Remove HTML tags (require at least one alphanumeric character to be a valid tag)
  // This pattern matches <tag> or <tag attr="value"> but not standalone < or >
  sanitized = sanitized.replace(/<[a-zA-Z0-9][^>]*>/g, '');

  // Escape remaining HTML entities (this catches standalone < and >)
  sanitized = sanitized
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');

  return sanitized.trim();
}

/**
 * Validate JSON structure to prevent prototype pollution
 * Ensures the parsed object doesn't have dangerous prototype properties
 * @param jsonString - The JSON string to validate
 * @param maxSize - Maximum allowed JSON size in bytes (default: 10MB)
 * @returns Parsed object if valid, null if invalid
 */
export function safeJsonParse<T = unknown>(
  jsonString: string,
  maxSize: number = 10 * 1024 * 1024 // 10MB default
): T | null {
  if (!jsonString || typeof jsonString !== 'string') {
    return null;
  }

  // Check size
  const sizeInBytes = new Blob([jsonString]).size;
  if (sizeInBytes > maxSize) {
    return null;
  }

  try {
    // Use JSON.parse with reviver to filter out __proto__, constructor, etc.
    const parsed = JSON.parse(jsonString, (key, value) => {
      // Block prototype pollution attempts
      if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
        return undefined;
      }
      return value;
    });

    // Additional check: ensure parsed object doesn't have dangerous properties
    // Only check if parsed is an object (not null, array, or primitive)
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed) && parsed !== null) {
      // Check for dangerous properties that might have bypassed the reviver
      // Use Object.prototype.hasOwnProperty to check own properties (not inherited)
      if (Object.prototype.hasOwnProperty.call(parsed, '__proto__') || 
          Object.prototype.hasOwnProperty.call(parsed, 'prototype')) {
        return null;
      }
      // constructor is a normal property if it's the default Object constructor
      // Only reject if it's explicitly set to something other than Object
      if (Object.prototype.hasOwnProperty.call(parsed, 'constructor') && 
          parsed.constructor !== Object && parsed.constructor !== null) {
        return null;
      }
    }

    return parsed as T;
  } catch {
    return null;
  }
}

/**
 * Validate file type and size before processing
 * @param file - The file to validate
 * @param allowedTypes - Array of allowed MIME types
 * @param maxSize - Maximum file size in bytes
 * @returns Validation result with success flag and error message if failed
 */
export function validateFile(
  file: File,
  allowedTypes: string[],
  maxSize: number = 10 * 1024 * 1024 // 10MB default
): { valid: boolean; error?: string } {
  if (!file) {
    return { valid: false, error: 'No file provided' };
  }

  // Check file type
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: `Invalid file type. Allowed types: ${allowedTypes.join(', ')}` };
  }

  // Check file size
  if (file.size > maxSize) {
    const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(2);
    return { valid: false, error: `File size exceeds maximum allowed size of ${maxSizeMB}MB` };
  }

  // Check for empty file
  if (file.size === 0) {
    return { valid: false, error: 'File is empty' };
  }

  return { valid: true };
}

/**
 * Validate backup file structure
 * Ensures the backup data has the expected structure and types
 * @param data - The parsed backup data to validate
 * @returns Validation result with success flag and error message if failed
 */
export function validateBackupStructure(data: unknown): { valid: boolean; error?: string } {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'Backup data must be an object' };
  }

  const backup = data as Record<string, unknown>;

  // Check required fields
  if (typeof backup.version !== 'string') {
    return { valid: false, error: 'Backup must have a version field' };
  }

  if (typeof backup.timestamp !== 'string') {
    return { valid: false, error: 'Backup must have a timestamp field' };
  }

  if (!backup.data || typeof backup.data !== 'object') {
    return { valid: false, error: 'Backup must have a data field' };
  }

  const backupData = backup.data as Record<string, unknown>;

  // Check that data fields are arrays
  const requiredArrays = [
    'banks',
    'bankAccounts',
    'incomeTransactions',
    'expenseTransactions',
    'savingsInvestmentTransactions',
    'expenseEMIs',
    'savingsInvestmentEMIs',
    'recurringIncomes',
    'recurringExpenses',
    'recurringSavingsInvestments',
  ];

  for (const field of requiredArrays) {
    if (!Array.isArray(backupData[field])) {
      return { valid: false, error: `Backup data.${field} must be an array` };
    }
  }

  return { valid: true };
}

/**
 * Check if a string contains potentially malicious patterns
 * @param input - The string to check
 * @returns true if potentially malicious, false otherwise
 */
export function containsMaliciousPattern(input: string): boolean {
  if (!input || typeof input !== 'string') {
    return false;
  }

  const maliciousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /data:text\/html/i,
    /vbscript:/i,
    /<iframe/i,
    /<object/i,
    /<embed/i,
    /<link[^>]*rel\s*=\s*["']stylesheet["']/i,
    /<style/i,
    /@import/i,
    /expression\s*\(/i,
    /url\s*\(\s*["']?javascript:/i,
  ];

  return maliciousPatterns.some((pattern) => pattern.test(input));
}

/**
 * Escape HTML entities in a string
 * @param input - The string to escape
 * @returns Escaped string safe for HTML
 */
export function escapeHtml(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  const htmlEscapes: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  };

  return input.replace(/[&<>"'/]/g, (match) => htmlEscapes[match] || match);
}

/**
 * Check if the app is running in a secure context (HTTPS)
 * @returns true if secure context, false otherwise
 */
export function isSecureContext(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  // Check for HTTPS
  if (window.location.protocol === 'https:') {
    return true;
  }

  // Check for localhost (allowed for development)
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return true;
  }

  // Check for secure context API (if available)
  if ('isSecureContext' in window) {
    return (window as { isSecureContext?: boolean }).isSecureContext ?? false;
  }

  return false;
}

/**
 * Get security headers recommendations for deployment
 * @returns Object with recommended security headers
 */
export function getSecurityHeaders(): Record<string, string> {
  return {
    'Content-Security-Policy':
      "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self';",
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  };
}

