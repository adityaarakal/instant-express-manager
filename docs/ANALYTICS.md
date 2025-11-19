# Analytics Integration Guide

**Purpose**: Privacy-friendly analytics tracking with optional external service integration  
**Created**: 2025-01-15  
**Status**: ✅ **IMPLEMENTED**

---

## 🎯 Overview

The Instant Express Manager application includes a privacy-friendly analytics system that supports optional integration with external analytics services (Plausible, Google Analytics). Analytics are **disabled by default** and only enabled when explicitly configured by the user.

---

## ✅ Features

### 1. Privacy-First Approach
- **Disabled by default**: No tracking until explicitly enabled
- **User consent required**: Analytics only works with explicit user consent
- **No data sent by default**: No external requests made until configured
- **Data sanitization**: Sensitive data automatically redacted from events

### 2. Supported Providers

#### Plausible Analytics (Recommended)
- ✅ Privacy-friendly (GDPR compliant)
- ✅ No cookies required
- ✅ Open-source
- ✅ Lightweight and fast
- ✅ Simple setup (domain-based)

#### Google Analytics 4
- ✅ Industry standard
- ✅ Comprehensive features
- ✅ IP anonymization enabled
- ✅ Privacy settings configured

### 3. Automatic Tracking
- **Page views**: Automatically tracked on route changes
- **Custom events**: Can be tracked manually via `trackEvent()`
- **Configuration persistence**: Settings saved in IndexedDB

### 4. Data Sanitization
- URLs with tokens are redacted: `https://api.example.com/token/abc123` → `[REDACTED_URL]`
- Potential tokens/keys are redacted: `32+ character strings` → `[REDACTED_TOKEN]`
- Email addresses are redacted: `user@example.com` → `[REDACTED_EMAIL]`
- Sensitive keys automatically filtered (password, token, secret, key, email, phone)

---

## 🔧 Implementation

### Files Created
- `frontend/src/utils/analytics.ts` - Core analytics utility
- `frontend/src/routes/AppRoutes.tsx` - Page view tracking integration
- `frontend/src/pages/Settings.tsx` - Analytics configuration UI

---

## 📊 Usage

### Configure Analytics (Settings Page)

1. Navigate to **Settings** page
2. Scroll to **Analytics** section
3. Select analytics provider (Plausible or Google Analytics)
4. Enter provider configuration:
   - **Plausible**: Enter your domain (e.g., `yourdomain.com`)
   - **Google Analytics**: Enter Measurement ID (e.g., `G-XXXXXXXXXX`)
5. Enable analytics toggle
6. Analytics will start tracking page views automatically

### Track Custom Events

```typescript
import { trackEvent } from '../utils/analytics';

// Track a custom event
trackEvent('transaction_created', {
  transaction_type: 'income',
  amount: 1000,
  // Sensitive data automatically redacted
});
```

### Track Page Views

Page views are automatically tracked on route changes when analytics is enabled. To manually track a page view:

```typescript
import { trackPageView } from '../utils/analytics';

// Track current page
trackPageView();

// Track specific path
trackPageView('/custom-path?query=value');
```

---

## 🔒 Privacy & Security

### Data Sanitization
- All event properties are automatically sanitized before sending
- Sensitive information (passwords, tokens, emails) is automatically redacted
- URLs with potential tokens are redacted
- Large alphanumeric strings (potential tokens) are redacted

### Privacy Settings

#### Plausible
- No cookies used
- GDPR compliant
- Open-source
- Data stored in EU (configurable)

#### Google Analytics 4
- IP anonymization enabled
- Google signals disabled
- Ad personalization disabled
- Standard data retention policies apply

---

## 🔌 Provider Setup

### Plausible Analytics Setup

1. **Create Plausible account**:
   - Visit [plausible.io](https://plausible.io)
   - Create an account
   - Add your domain

2. **Configure in app**:
   - Go to Settings → Analytics
   - Select "Plausible (Privacy-friendly, recommended)"
   - Enter your domain (e.g., `yourdomain.com`)
   - Enable analytics

3. **Verify**:
   - Check Plausible dashboard for page views
   - Should see data within a few minutes

### Google Analytics 4 Setup

1. **Create GA4 property**:
   - Visit [Google Analytics](https://analytics.google.com)
   - Create a new GA4 property
   - Get Measurement ID (format: `G-XXXXXXXXXX`)

2. **Configure in app**:
   - Go to Settings → Analytics
   - Select "Google Analytics 4"
   - Enter Measurement ID (e.g., `G-XXXXXXXXXX`)
   - Enable analytics

3. **Verify**:
   - Check GA4 Real-Time reports
   - Should see data immediately

---

## 📝 API Reference

### Functions

#### `initAnalytics(config?: Partial<AnalyticsConfig>)`
Initialize analytics with configuration. Loads saved config if none provided.

#### `trackPageView(path?: string)`
Track a page view. Uses current path if not provided.

#### `trackEvent(eventName: string, properties?: Record<string, unknown>)`
Track a custom event with optional properties.

#### `enableAnalytics(userConsent?: boolean)`
Enable analytics (requires user consent).

#### `disableAnalytics()`
Disable analytics.

#### `updateAnalyticsConfig(updates: Partial<AnalyticsConfig>)`
Update analytics configuration.

#### `getAnalyticsConfig(): Promise<AnalyticsConfig>`
Get current analytics configuration.

#### `isAnalyticsEnabled(): Promise<boolean>`
Check if analytics is currently enabled.

---

## 🎯 Configuration

### AnalyticsConfig Interface

```typescript
interface AnalyticsConfig {
  /** Whether analytics is enabled */
  enabled: boolean;
  /** Analytics provider */
  provider: 'plausible' | 'google-analytics' | 'custom' | null;
  /** Provider-specific configuration */
  providerConfig?: {
    /** Plausible: Domain for Plausible Analytics */
    domain?: string;
    /** Google Analytics: Measurement ID (G-XXXXXXXXXX) */
    measurementId?: string;
    /** Custom: Custom tracking function */
    customTrack?: (event: string, properties?: Record<string, unknown>) => void;
  };
  /** Whether to track page views */
  trackPageViews: boolean;
  /** Whether user has consented to analytics */
  userConsent: boolean;
}
```

### Default Configuration

```typescript
{
  enabled: false,
  provider: null,
  trackPageViews: false,
  userConsent: false,
}
```

---

## ✅ Task Completion

### Task 3.4.1: Add Analytics ✅
- ✅ Created `analytics.ts` utility
- ✅ Plausible Analytics integration (privacy-friendly)
- ✅ Google Analytics 4 integration
- ✅ Automatic page view tracking
- ✅ Custom event tracking
- ✅ Configuration persistence (IndexedDB)
- ✅ Data sanitization for privacy
- ✅ Settings page UI for configuration
- ✅ User consent management
- ✅ Privacy-first approach (disabled by default)

---

## 🎯 Benefits

1. **Privacy-First**: Disabled by default, respects user privacy
2. **Flexible**: Supports multiple analytics providers
3. **Easy to Use**: Simple UI in Settings page
4. **Secure**: Automatic data sanitization
5. **Persistent**: Configuration saved in IndexedDB
6. **Automatic**: Page views tracked automatically

---

## 📝 Notes

- Analytics are **disabled by default** - no tracking until explicitly enabled
- User must provide explicit consent before analytics starts
- Configuration is persisted in IndexedDB
- Sensitive data is automatically redacted from events
- Page views are automatically tracked on route changes
- Custom events can be tracked manually via `trackEvent()`

---

**Last Updated**: 2025-01-15  
**Status**: ✅ **COMPLETED**

