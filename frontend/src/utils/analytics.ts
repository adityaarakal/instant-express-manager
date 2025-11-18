/**
 * Analytics Utility
 * 
 * Provides privacy-friendly analytics tracking with optional integration with
 * external services (e.g., Plausible, Google Analytics). Analytics are disabled
 * by default and only enabled when explicitly configured.
 * 
 * Features:
 * - Privacy-first approach (disabled by default)
 * - Plausible integration (privacy-friendly, GDPR compliant)
 * - Google Analytics 4 integration (optional)
 * - Custom event tracking
 * - Page view tracking
 * - User consent management
 * - Configuration persistence (localStorage)
 * - No tracking without explicit configuration
 */

import localforage from 'localforage';

/**
 * Analytics configuration
 */
export interface AnalyticsConfig {
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

// Default configuration (disabled by default)
const defaultConfig: AnalyticsConfig = {
  enabled: false,
  provider: null,
  trackPageViews: false,
  userConsent: false,
};

let config: AnalyticsConfig = { ...defaultConfig };

// Storage instance for analytics config
const configStore = localforage.createInstance({
  name: 'instant-express-manager',
  storeName: 'analytics-config',
});

/**
 * Load analytics configuration from storage
 */
async function loadConfig(): Promise<AnalyticsConfig> {
  try {
    const stored = await configStore.getItem<AnalyticsConfig>('config');
    if (stored) {
      return { ...defaultConfig, ...stored };
    }
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn('Failed to load analytics config:', error);
    }
  }
  return { ...defaultConfig };
}

/**
 * Save analytics configuration to storage
 */
async function saveConfig(newConfig: AnalyticsConfig): Promise<void> {
  try {
    await configStore.setItem('config', newConfig);
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn('Failed to save analytics config:', error);
    }
  }
}

// Load config on module initialization
loadConfig().then(async (loadedConfig) => {
  config = loadedConfig;
  // Re-initialize if enabled
  if (config.enabled && config.userConsent && config.provider) {
    await initAnalytics(config);
  }
});

/**
 * Initialize analytics with configuration
 */
export async function initAnalytics(customConfig?: Partial<AnalyticsConfig>): Promise<void> {
  if (customConfig) {
    config = { ...defaultConfig, ...customConfig };
    await saveConfig(config);
  } else {
    config = await loadConfig();
  }
  
  if (!config.enabled || !config.userConsent || !config.provider) {
    return;
  }

  // Initialize Plausible
  if (config.provider === 'plausible' && config.providerConfig?.domain) {
    // Load Plausible script
    if (typeof window !== 'undefined' && !(window as { plausible?: unknown }).plausible) {
      const script = document.createElement('script');
      script.defer = true;
      script.dataset.domain = config.providerConfig.domain;
      script.src = 'https://plausible.io/js/script.js';
      document.head.appendChild(script);
    }
  }

  // Initialize Google Analytics 4
  if (config.provider === 'google-analytics' && config.providerConfig?.measurementId) {
    if (typeof window !== 'undefined' && !(window as { gtag?: unknown }).gtag) {
      // Load gtag.js
      const gtagScript = document.createElement('script');
      gtagScript.async = true;
      gtagScript.src = `https://www.googletagmanager.com/gtag/js?id=${config.providerConfig.measurementId}`;
      document.head.appendChild(gtagScript);

      // Initialize gtag
      (window as { dataLayer?: unknown[]; gtag?: (...args: unknown[]) => void }).dataLayer = 
        (window as { dataLayer?: unknown[] }).dataLayer || [];
      (window as { gtag?: (...args: unknown[]) => void }).gtag = function gtag(...args: unknown[]) {
        ((window as { dataLayer?: unknown[] }).dataLayer || []).push(args);
      };

      // Configure GA4
      (window as { gtag?: (...args: unknown[]) => void }).gtag?.('js', new Date());
      (window as { gtag?: (...args: unknown[]) => void }).gtag?.(
        'config',
        config.providerConfig.measurementId,
        {
          anonymize_ip: true, // Privacy: anonymize IP addresses
          allow_google_signals: false, // Privacy: disable Google signals
          allow_ad_personalization_signals: false, // Privacy: disable ad personalization
        }
      );
    }
  }

  // Track initial page view if enabled
  if (config.trackPageViews) {
    trackPageView();
  }
}

/**
 * Track a page view
 */
export function trackPageView(path?: string): void {
  if (!config.enabled || !config.userConsent || !config.provider) {
    return;
  }

  const pagePath = path || window.location.pathname + window.location.search;

  if (config.provider === 'plausible' && (window as { plausible?: (event: string, options?: { props?: Record<string, unknown> }) => void }).plausible) {
    (window as { plausible?: (event: string, options?: { props?: Record<string, unknown> }) => void }).plausible?.('pageview', {
      props: {
        path: pagePath,
      },
    });
  } else if (config.provider === 'google-analytics' && (window as { gtag?: (...args: unknown[]) => void }).gtag) {
    (window as { gtag?: (...args: unknown[]) => void }).gtag?.('config', config.providerConfig?.measurementId, {
      page_path: pagePath,
    });
  } else if (config.provider === 'custom' && config.providerConfig?.customTrack) {
    config.providerConfig.customTrack('pageview', { path: pagePath });
  }
}

/**
 * Track a custom event
 */
export function trackEvent(
  eventName: string,
  properties?: Record<string, unknown>
): void {
  if (!config.enabled || !config.userConsent || !config.provider) {
    return;
  }

  // Sanitize properties (remove sensitive data)
  const sanitizedProperties = sanitizeProperties(properties);

  if (config.provider === 'plausible' && (window as { plausible?: (event: string, options?: { props?: Record<string, unknown> }) => void }).plausible) {
    (window as { plausible?: (event: string, options?: { props?: Record<string, unknown> }) => void }).plausible?.(eventName, {
      props: sanitizedProperties,
    });
  } else if (config.provider === 'google-analytics' && (window as { gtag?: (...args: unknown[]) => void }).gtag) {
    (window as { gtag?: (...args: unknown[]) => void }).gtag?.('event', eventName, sanitizedProperties);
  } else if (config.provider === 'custom' && config.providerConfig?.customTrack) {
    config.providerConfig.customTrack(eventName, sanitizedProperties);
  }
}

/**
 * Sanitize properties to remove sensitive information
 */
function sanitizeProperties(
  properties?: Record<string, unknown>
): Record<string, unknown> {
  if (!properties) {
    return {};
  }

  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(properties)) {
    // Skip sensitive keys
    if (
      key.toLowerCase().includes('password') ||
      key.toLowerCase().includes('token') ||
      key.toLowerCase().includes('secret') ||
      key.toLowerCase().includes('key') ||
      key.toLowerCase().includes('email') ||
      key.toLowerCase().includes('phone')
    ) {
      continue;
    }

    // Sanitize string values
    if (typeof value === 'string') {
      let sanitizedValue = value;
      
      // Remove URLs that might contain tokens
      sanitizedValue = sanitizedValue.replace(/https?:\/\/[^\s]+/g, '[REDACTED_URL]');
      
      // Remove potential tokens/keys
      sanitizedValue = sanitizedValue.replace(/[A-Za-z0-9]{32,}/g, '[REDACTED_TOKEN]');
      
      // Remove email addresses
      sanitizedValue = sanitizedValue.replace(/[^\s]+@[^\s]+/g, '[REDACTED_EMAIL]');
      
      sanitized[key] = sanitizedValue;
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Enable analytics (requires user consent)
 */
export async function enableAnalytics(userConsent: boolean = true): Promise<void> {
  if (!userConsent) {
    return;
  }

  config.userConsent = true;
  
  if (config.provider) {
    config.enabled = true;
    await saveConfig(config);
    await initAnalytics(config);
  }
}

/**
 * Disable analytics
 */
export async function disableAnalytics(): Promise<void> {
  config.enabled = false;
  config.userConsent = false;
  await saveConfig(config);
}

/**
 * Update analytics configuration
 */
export async function updateAnalyticsConfig(updates: Partial<AnalyticsConfig>): Promise<void> {
  config = { ...config, ...updates };
  await saveConfig(config);
  
  if (config.enabled && config.userConsent && config.provider) {
    await initAnalytics(config);
  }
}

/**
 * Get current analytics configuration
 */
export async function getAnalyticsConfig(): Promise<AnalyticsConfig> {
  // Ensure config is loaded
  if (!config || Object.keys(config).length === 0) {
    config = await loadConfig();
  }
  return { ...config };
}

/**
 * Check if analytics is enabled
 */
export async function isAnalyticsEnabled(): Promise<boolean> {
  // Ensure config is loaded
  if (!config || Object.keys(config).length === 0) {
    config = await loadConfig();
  }
  return config.enabled && config.userConsent && config.provider !== null;
}

