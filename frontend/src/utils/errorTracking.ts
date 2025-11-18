/**
 * Error Tracking Utility
 * 
 * Provides production-safe error logging with optional integration with external services
 * (e.g., Sentry, LogRocket). In development, logs full error details. In production,
 * logs minimal information and stores errors locally for debugging.
 * 
 * Features:
 * - Production-safe logging (no sensitive data exposed)
 * - Local error storage (IndexedDB) as fallback
 * - Optional external service integration (Sentry-ready)
 * - User privacy respected (no personal data sent without consent)
 */

import localforage from 'localforage';

/**
 * Error severity levels
 */
export enum ErrorSeverity {
  /** Low severity - warnings, non-critical issues */
  LOW = 'low',
  /** Medium severity - issues that affect functionality but don't break the app */
  MEDIUM = 'medium',
  /** High severity - errors that break features but don't crash the app */
  HIGH = 'high',
  /** Critical severity - errors that crash the app or cause data loss */
  CRITICAL = 'critical',
}

/**
 * Error context information
 */
export interface ErrorContext {
  /** Component or module where error occurred */
  component?: string;
  /** Action or operation that triggered the error */
  action?: string;
  /** Additional context data (sanitized) */
  metadata?: Record<string, unknown>;
  /** User ID (if available, should be anonymized) */
  userId?: string;
  /** Session ID */
  sessionId?: string;
  /** Timestamp */
  timestamp?: Date;
}

/**
 * Tracked error information
 */
export interface TrackedError {
  /** Error message (sanitized) */
  message: string;
  /** Error name/type */
  name: string;
  /** Error severity */
  severity: ErrorSeverity;
  /** Stack trace (only in development or if explicitly enabled) */
  stack?: string;
  /** Context information */
  context?: ErrorContext;
  /** Whether error was reported to external service */
  reported: boolean;
  /** Timestamp */
  timestamp: Date;
  /** Error ID (for tracking) */
  id: string;
}

/**
 * Configuration for error tracking
 */
export interface ErrorTrackingConfig {
  /** Whether error tracking is enabled */
  enabled: boolean;
  /** Whether to store errors locally */
  storeLocally: boolean;
  /** Maximum number of errors to store locally */
  maxStoredErrors: number;
  /** Whether to include stack traces in production */
  includeStackInProduction: boolean;
  /** External service integration (optional) */
  externalService?: {
    captureException: (error: Error, context?: ErrorContext) => void;
    captureMessage: (message: string, level?: ErrorSeverity, context?: ErrorContext) => void;
  };
}

// Default configuration
const defaultConfig: ErrorTrackingConfig = {
  enabled: true,
  storeLocally: true,
  maxStoredErrors: 100,
  includeStackInProduction: false,
};

let config: ErrorTrackingConfig = { ...defaultConfig };

// Local storage instance for error tracking
const errorStore = localforage.createInstance({
  name: 'instant-express-manager',
  storeName: 'error-tracking',
});

/**
 * Initialize error tracking with configuration
 */
export function initErrorTracking(customConfig?: Partial<ErrorTrackingConfig>): void {
  config = { ...defaultConfig, ...customConfig };
  
  // Set up global error handlers
  if (typeof window !== 'undefined') {
    // Unhandled errors
    window.addEventListener('error', (event) => {
      captureException(
        event.error || new Error(event.message),
        {
          component: 'global',
          action: 'unhandled-error',
          metadata: {
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno,
          },
        },
        ErrorSeverity.HIGH
      );
    });

    // Unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      captureException(
        event.reason instanceof Error ? event.reason : new Error(String(event.reason)),
        {
          component: 'global',
          action: 'unhandled-rejection',
        },
        ErrorSeverity.HIGH
      );
    });
  }
}

/**
 * Sanitize error message to remove sensitive information
 */
function sanitizeError(error: Error | unknown): { message: string; name: string; stack?: string } {
  if (error instanceof Error) {
    let message = error.message;
    
    // Remove potential sensitive information
    // Remove URLs that might contain tokens
    message = message.replace(/https?:\/\/[^\s]+/g, '[REDACTED_URL]');
    // Remove potential tokens/keys
    message = message.replace(/[A-Za-z0-9]{32,}/g, '[REDACTED_TOKEN]');
    // Remove email addresses
    message = message.replace(/[^\s]+@[^\s]+/g, '[REDACTED_EMAIL]');
    
    return {
      message,
      name: error.name,
      stack: config.includeStackInProduction || import.meta.env.DEV ? error.stack : undefined,
    };
  }
  
  return {
    message: String(error),
    name: 'UnknownError',
    stack: undefined,
  };
}

/**
 * Generate unique error ID
 */
function generateErrorId(): string {
  return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Store error locally in IndexedDB
 */
async function storeErrorLocally(error: TrackedError): Promise<void> {
  if (!config.storeLocally) {
    return;
  }

  try {
    // Get existing errors
    const existingErrors = (await errorStore.getItem<TrackedError[]>('errors')) || [];
    
    // Add new error
    const updatedErrors = [error, ...existingErrors].slice(0, config.maxStoredErrors);
    
    // Store back
    await errorStore.setItem('errors', updatedErrors);
  } catch (storeError) {
    // Silently fail - don't throw errors from error tracking
    if (import.meta.env.DEV) {
      console.warn('Failed to store error locally:', storeError);
    }
  }
}

/**
 * Capture and track an exception/error
 */
export function captureException(
  error: Error | unknown,
  context?: ErrorContext,
  severity: ErrorSeverity = ErrorSeverity.MEDIUM
): void {
  if (!config.enabled) {
    return;
  }

  const sanitized = sanitizeError(error);
  const errorId = generateErrorId();

  const trackedError: TrackedError = {
    message: sanitized.message,
    name: sanitized.name,
    severity,
    stack: sanitized.stack,
    context: {
      ...context,
      timestamp: new Date(),
      sessionId: getSessionId(),
    },
    reported: false,
    timestamp: new Date(),
    id: errorId,
  };

  // Log to console (production-safe)
  if (import.meta.env.DEV) {
    // Full error logging in development
    console.error(`[Error Tracking] ${severity.toUpperCase()}:`, error, context);
  } else {
    // Minimal logging in production
    console.error(
      `[Error] ${sanitized.name}: ${sanitized.message}`,
      context?.component ? `[${context.component}]` : ''
    );
  }

  // Report to external service if configured
  if (config.externalService && error instanceof Error) {
    try {
      config.externalService.captureException(error, context);
      trackedError.reported = true;
    } catch (reportError) {
      // Silently fail - don't throw errors from error tracking
      if (import.meta.env.DEV) {
        console.warn('Failed to report error to external service:', reportError);
      }
    }
  }

  // Store locally
  storeErrorLocally(trackedError);
}

/**
 * Capture and track a message (non-error)
 */
export function captureMessage(
  message: string,
  level: ErrorSeverity = ErrorSeverity.LOW,
  context?: ErrorContext
): void {
  if (!config.enabled) {
    return;
  }

  const errorId = generateErrorId();

  const trackedError: TrackedError = {
    message,
    name: 'UserMessage',
    severity: level,
    context: {
      ...context,
      timestamp: new Date(),
      sessionId: getSessionId(),
    },
    reported: false,
    timestamp: new Date(),
    id: errorId,
  };

  // Log to console
  if (import.meta.env.DEV) {
    console.log(`[Error Tracking] ${level.toUpperCase()}:`, message, context);
  } else {
    console.log(`[Info] ${message}`, context?.component ? `[${context.component}]` : '');
  }

  // Report to external service if configured
  if (config.externalService) {
    try {
      config.externalService.captureMessage(message, level, context);
      trackedError.reported = true;
    } catch (reportError) {
      if (import.meta.env.DEV) {
        console.warn('Failed to report message to external service:', reportError);
      }
    }
  }

  // Store locally
  storeErrorLocally(trackedError);
}

/**
 * Get session ID (persists across page reloads)
 */
function getSessionId(): string {
  let sessionId = sessionStorage.getItem('error_tracking_session_id');
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('error_tracking_session_id', sessionId);
  }
  return sessionId;
}

/**
 * Get all stored errors
 */
export async function getStoredErrors(): Promise<TrackedError[]> {
  try {
    return (await errorStore.getItem<TrackedError[]>('errors')) || [];
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn('Failed to get stored errors:', error);
    }
    return [];
  }
}

/**
 * Clear all stored errors
 */
export async function clearStoredErrors(): Promise<void> {
  try {
    await errorStore.removeItem('errors');
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn('Failed to clear stored errors:', error);
    }
  }
}

/**
 * Get error tracking configuration
 */
export function getErrorTrackingConfig(): ErrorTrackingConfig {
  return { ...config };
}

/**
 * Update error tracking configuration
 */
export function updateErrorTrackingConfig(updates: Partial<ErrorTrackingConfig>): void {
  config = { ...config, ...updates };
}

