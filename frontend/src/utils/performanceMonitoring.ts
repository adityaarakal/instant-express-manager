/**
 * Performance Monitoring Utility
 * Tracks Web Vitals and operation performance metrics
 */

export interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  type: 'web-vital' | 'operation' | 'custom';
  metadata?: Record<string, unknown>;
}

export interface OperationMetrics {
  [operationName: string]: {
    count: number;
    totalTime: number;
    averageTime: number;
    minTime: number;
    maxTime: number;
  };
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private operationTimings: Map<string, number[]> = new Map();
  private isEnabled: boolean = true;
  private readonly MAX_METRICS = 100; // Keep last 100 metrics

  constructor() {
    // Enable in production, or if explicitly enabled
    this.isEnabled = import.meta.env.PROD || 
      (typeof window !== 'undefined' && 
       (window.localStorage.getItem('enable-perf-monitoring') === 'true'));
  }

  /**
   * Track a performance metric
   */
  trackMetric(metric: PerformanceMetric): void {
    if (!this.isEnabled) return;

    this.metrics.push(metric);
    
    // Keep only the last MAX_METRICS
    if (this.metrics.length > this.MAX_METRICS) {
      this.metrics.shift();
    }

    // Log metrics in development for visibility
    if (import.meta.env.DEV) {
      // Performance monitoring logs are intentional for debugging
      console.debug(`[Performance] ${metric.name}: ${metric.value}${metric.type === 'web-vital' ? 'ms' : ''}`, metric.metadata || '');
    }
  }

  /**
   * Track operation duration
   */
  trackOperation<T>(operationName: string, operation: () => T): T {
    if (!this.isEnabled) {
      return operation();
    }

    const startTime = performance.now();
    try {
      const result = operation();
      const duration = performance.now() - startTime;
      
      this.recordOperationTiming(operationName, duration);
      
      // Track slow operations (>100ms)
      if (duration > 100) {
        this.trackMetric({
          name: `slow-operation:${operationName}`,
          value: duration,
          timestamp: Date.now(),
          type: 'operation',
          metadata: { operation: operationName },
        });
      }

      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      this.recordOperationTiming(operationName, duration);
      throw error;
    }
  }

  /**
   * Track async operation duration
   */
  async trackOperationAsync<T>(operationName: string, operation: () => Promise<T>): Promise<T> {
    if (!this.isEnabled) {
      return operation();
    }

    const startTime = performance.now();
    try {
      const result = await operation();
      const duration = performance.now() - startTime;
      
      this.recordOperationTiming(operationName, duration);
      
      // Track slow operations (>100ms)
      if (duration > 100) {
        this.trackMetric({
          name: `slow-operation:${operationName}`,
          value: duration,
          timestamp: Date.now(),
          type: 'operation',
          metadata: { operation: operationName },
        });
      }

      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      this.recordOperationTiming(operationName, duration);
      throw error;
    }
  }

  /**
   * Record operation timing
   */
  private recordOperationTiming(operationName: string, duration: number): void {
    if (!this.operationTimings.has(operationName)) {
      this.operationTimings.set(operationName, []);
    }
    
    const timings = this.operationTimings.get(operationName)!;
    timings.push(duration);
    
    // Keep only last 50 timings per operation
    if (timings.length > 50) {
      timings.shift();
    }
  }

  /**
   * Get operation metrics summary
   */
  getOperationMetrics(): OperationMetrics {
    const summary: OperationMetrics = {};

    this.operationTimings.forEach((timings, operationName) => {
      const count = timings.length;
      const totalTime = timings.reduce((sum, time) => sum + time, 0);
      const averageTime = totalTime / count;
      const minTime = Math.min(...timings);
      const maxTime = Math.max(...timings);

      summary[operationName] = {
        count,
        totalTime,
        averageTime,
        minTime,
        maxTime,
      };
    });

    return summary;
  }

  /**
   * Get all metrics
   */
  getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  /**
   * Clear all metrics
   */
  clearMetrics(): void {
    this.metrics = [];
    this.operationTimings.clear();
  }

  /**
   * Enable/disable monitoring
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    if (typeof window !== 'undefined') {
      if (enabled) {
        window.localStorage.setItem('enable-perf-monitoring', 'true');
      } else {
        window.localStorage.removeItem('enable-perf-monitoring');
      }
    }
  }

  /**
   * Check if monitoring is enabled
   */
  getEnabled(): boolean {
    return this.isEnabled;
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor();

/**
 * Track Web Vitals manually (since we don't want to add web-vitals package for bundle size)
 */
export function trackWebVitals(): void {
  if (typeof window === 'undefined' || typeof performance === 'undefined') {
    return;
  }

  // Track Largest Contentful Paint (LCP)
  if ('PerformanceObserver' in window) {
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'largest-contentful-paint') {
            const lcpEntry = entry as PerformanceEntry & { renderTime?: number; loadTime?: number };
            const value = lcpEntry.renderTime || lcpEntry.loadTime || 0;
            
            performanceMonitor.trackMetric({
              name: 'LCP',
              value,
              timestamp: Date.now(),
              type: 'web-vital',
              metadata: { renderTime: lcpEntry.renderTime, loadTime: lcpEntry.loadTime },
            });
          }
        }
      });

      observer.observe({ entryTypes: ['largest-contentful-paint'] });
    } catch {
      // PerformanceObserver not supported or error
    }

    // Track First Input Delay (FID)
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'first-input') {
            const fidEntry = entry as PerformanceEntry & { processingStart?: number; startTime?: number };
            const delay = fidEntry.processingStart ? fidEntry.processingStart - fidEntry.startTime : 0;
            
            performanceMonitor.trackMetric({
              name: 'FID',
              value: delay,
              timestamp: Date.now(),
              type: 'web-vital',
              metadata: { processingStart: fidEntry.processingStart, startTime: fidEntry.startTime },
            });
          }
        }
      });

      observer.observe({ entryTypes: ['first-input'] });
    } catch {
      // PerformanceObserver not supported or error
    }

    // Track Cumulative Layout Shift (CLS)
    try {
      let clsValue = 0;
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const layoutShiftEntry = entry as PerformanceEntry & { value?: number };
          if (layoutShiftEntry.value) {
            clsValue += layoutShiftEntry.value;
          }
        }
      });

      observer.observe({ entryTypes: ['layout-shift'] });

      // Report CLS when page is about to unload
      window.addEventListener('beforeunload', () => {
        if (clsValue > 0) {
          performanceMonitor.trackMetric({
            name: 'CLS',
            value: clsValue,
            timestamp: Date.now(),
            type: 'web-vital',
          });
        }
      });
    } catch {
      // PerformanceObserver not supported or error
    }
  }

  // Track First Contentful Paint (FCP) from paint timing
  try {
    const paintEntries = performance.getEntriesByType('paint');
    const fcpEntry = paintEntries.find((entry) => entry.name === 'first-contentful-paint');
    if (fcpEntry) {
      performanceMonitor.trackMetric({
        name: 'FCP',
        value: fcpEntry.startTime,
        timestamp: Date.now(),
        type: 'web-vital',
      });
    }
  } catch {
    // getEntriesByType not supported
  }

  // Track Time to First Byte (TTFB)
  try {
    const navigationEntry = performance.getEntriesByType('navigation')[0] as 
      PerformanceNavigationTiming | undefined;
    
    if (navigationEntry) {
      const ttfb = navigationEntry.responseStart - navigationEntry.requestStart;
      performanceMonitor.trackMetric({
        name: 'TTFB',
        value: ttfb,
        timestamp: Date.now(),
        type: 'web-vital',
        metadata: {
          requestStart: navigationEntry.requestStart,
          responseStart: navigationEntry.responseStart,
        },
      });
    }
  } catch {
    // Navigation timing not supported
  }
}

/**
 * Bundle size information interface
 */
export interface BundleInfo {
  chunks: Array<{
    name: string;
    size: number;
    sizeFormatted: string;
    type: string;
  }>;
  totalSize: number;
  totalSizeFormatted: string;
  chunksCount: number;
}

/**
 * Get bundle size information (from build output)
 * Reads bundle-info.json generated at build time
 */
export async function getBundleInfo(): Promise<BundleInfo | null> {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    // Fetch bundle info from public folder (generated at build time)
    const response = await fetch('/bundle-info.json', {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
      },
    });

    if (response.ok) {
      const bundleInfo: BundleInfo = await response.json();
      return bundleInfo;
    }
    return null;
  } catch {
    return null;
  }
}

