# Error Tracking Guide

**Purpose**: Production-safe error logging and tracking system  
**Created**: 2025-01-15  
**Status**: ✅ **IMPLEMENTED**

---

## 🎯 Overview

The Instant Express Manager application includes a comprehensive error tracking system that provides production-safe error logging with optional integration with external services (e.g., Sentry, LogRocket). All errors are stored locally by default, respecting user privacy.

---

## ✅ Features

### 1. Production-Safe Logging
- **Development**: Full error details (stack traces, component trees, metadata)
- **Production**: Minimal logging (error name, message only)
- **Automatic Sanitization**: Sensitive data (URLs, tokens, emails) automatically redacted

### 2. Local Error Storage
- Errors stored in IndexedDB (`instant-express-manager` → `error-tracking` store)
- Maximum 100 errors stored (configurable)
- Automatic cleanup of old errors
- Viewable in Settings page → Error Tracking section

### 3. Global Error Handlers
- **Unhandled Errors**: Catches all JavaScript errors
- **Unhandled Promise Rejections**: Catches async errors
- **React Error Boundaries**: Integrated with ErrorBoundary component

### 4. Error Severity Levels
- **LOW**: Warnings, non-critical issues
- **MEDIUM**: Issues that affect functionality but don't break the app
- **HIGH**: Errors that break features but don't crash the app
- **CRITICAL**: Errors that crash the app or cause data loss

### 5. External Service Integration (Optional)
- Ready for Sentry, LogRocket, or similar services
- Configurable via `initErrorTracking()`
- Errors only sent if explicitly configured
- User privacy respected (no data sent by default)

---

## 🔧 Implementation

### Files Created
- `frontend/src/utils/errorTracking.ts` - Core error tracking utility
- `frontend/src/components/common/ErrorTrackingDialog.tsx` - UI component for viewing errors

### Files Updated
- `frontend/src/components/common/ErrorBoundary.tsx` - Integrated error tracking
- `frontend/src/providers/AppProviders.tsx` - Initialized error tracking on app startup
- `frontend/src/pages/Transactions.tsx` - Updated export error handling
- `frontend/src/pages/Settings.tsx` - Added Error Tracking section

---

## 📊 Usage

### Basic Error Tracking

```typescript
import { captureException, ErrorSeverity } from '../utils/errorTracking';

// Track an exception
try {
  // Some operation
} catch (error) {
  captureException(error, {
    component: 'MyComponent',
    action: 'save-data',
    metadata: { userId: '123' },
  }, ErrorSeverity.MEDIUM);
}
```

### Track Messages (Non-Errors)

```typescript
import { captureMessage, ErrorSeverity } from '../utils/errorTracking';

// Track a message
captureMessage(
  'User performed action X',
  ErrorSeverity.LOW,
  {
    component: 'MyComponent',
    action: 'user-action',
  }
);
```

### View Stored Errors

1. Navigate to **Settings** page
2. Scroll to **Error Tracking** section
3. Click **"View Error Logs"** button
4. View, expand, and clear errors as needed

---

## 🔒 Privacy & Security

### Automatic Data Sanitization
- URLs with tokens are redacted: `https://api.example.com/token/abc123` → `[REDACTED_URL]`
- Potential tokens/keys are redacted: `32+ character strings` → `[REDACTED_TOKEN]`
- Email addresses are redacted: `user@example.com` → `[REDACTED_EMAIL]`

### Local Storage Only (Default)
- All errors stored locally in IndexedDB
- Never sent to external servers unless explicitly configured
- User privacy respected by default

### Production-Safe Logging
- Stack traces only included in development mode
- Component trees only included in development mode
- Minimal console logging in production

---

## 🔌 External Service Integration

### Sentry Integration Example

```typescript
import * as Sentry from '@sentry/react';

initErrorTracking({
  enabled: true,
  storeLocally: true,
  maxStoredErrors: 100,
  includeStackInProduction: false,
  externalService: {
    captureException: (error, context) => {
      Sentry.captureException(error, {
        contexts: {
          custom: context,
        },
      });
    },
    captureMessage: (message, level, context) => {
      Sentry.captureMessage(message, {
        level: level === 'critical' ? 'error' : level,
        contexts: {
          custom: context,
        },
      });
    },
  },
});
```

### LogRocket Integration Example

```typescript
import LogRocket from 'logrocket';

initErrorTracking({
  enabled: true,
  storeLocally: true,
  maxStoredErrors: 100,
  includeStackInProduction: false,
  externalService: {
    captureException: (error, context) => {
      LogRocket.captureException(error, {
        tags: context,
      });
    },
    captureMessage: (message, level, context) => {
      LogRocket.captureMessage(message, {
        level,
        tags: context,
      });
    },
  },
});
```

---

## 📝 Configuration

### Error Tracking Config

```typescript
interface ErrorTrackingConfig {
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
```

### Default Configuration

```typescript
{
  enabled: true,
  storeLocally: true,
  maxStoredErrors: 100,
  includeStackInProduction: false,
}
```

---

## 🎯 Error Context

### ErrorContext Interface

```typescript
interface ErrorContext {
  /** Component or module where error occurred */
  component?: string;
  /** Action or operation that triggered the error */
  action?: string;
  /** Additional context data (sanitized) */
  metadata?: Record<string, unknown>;
  /** User ID (if available, should be anonymized) */
  userId?: string;
  /** Session ID (auto-generated) */
  sessionId?: string;
  /** Timestamp (auto-generated) */
  timestamp?: Date;
}
```

### Example Usage

```typescript
captureException(error, {
  component: 'TransactionForm',
  action: 'save-transaction',
  metadata: {
    transactionType: 'income',
    amount: 1000,
    // Sensitive data automatically redacted
  },
}, ErrorSeverity.MEDIUM);
```

---

## 📊 Tracked Error Information

### TrackedError Interface

```typescript
interface TrackedError {
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
```

---

## 🛠️ API Reference

### Functions

#### `initErrorTracking(config?: Partial<ErrorTrackingConfig>)`
Initialize error tracking with custom configuration. Sets up global error handlers.

#### `captureException(error: Error | unknown, context?: ErrorContext, severity?: ErrorSeverity)`
Capture and track an exception/error.

#### `captureMessage(message: string, level?: ErrorSeverity, context?: ErrorContext)`
Capture and track a message (non-error).

#### `getStoredErrors(): Promise<TrackedError[]>`
Get all stored errors from local storage.

#### `clearStoredErrors(): Promise<void>`
Clear all stored errors from local storage.

#### `getErrorTrackingConfig(): ErrorTrackingConfig`
Get current error tracking configuration.

#### `updateErrorTrackingConfig(updates: Partial<ErrorTrackingConfig>): void`
Update error tracking configuration.

---

## ✅ Task Completion

### Task 3.3.1: Add Error Tracking ✅
- ✅ Created `errorTracking.ts` utility
- ✅ Production-safe logging implemented
- ✅ Local error storage in IndexedDB
- ✅ Global error handlers set up
- ✅ External service integration ready (Sentry/LogRocket)
- ✅ Error sanitization for privacy

### Task 3.3.2: Configure Production-Safe Error Logging ✅
- ✅ Production vs development logging modes
- ✅ Automatic data sanitization
- ✅ Stack traces only in development
- ✅ Minimal console logging in production
- ✅ Privacy-first approach (local storage only by default)
- ✅ ErrorTrackingDialog component for viewing errors
- ✅ Integrated into Settings page

---

## 🎯 Benefits

1. **Production Monitoring**: Track errors in production without exposing sensitive data
2. **Debugging**: View error logs locally for debugging
3. **Privacy First**: All errors stored locally by default
4. **Extensible**: Ready for external service integration when needed
5. **User-Friendly**: Errors viewable in Settings page
6. **Automatic**: Global error handlers catch unhandled errors

---

## 📝 Notes

- Errors are automatically cleaned up after reaching `maxStoredErrors` limit
- External service integration is optional and disabled by default
- Sensitive data is automatically redacted from error messages
- Stack traces are only included in development mode
- User privacy is respected (no data sent to external servers by default)

---

**Last Updated**: 2025-01-15  
**Status**: ✅ **COMPLETED**

