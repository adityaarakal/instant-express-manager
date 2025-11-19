/**
 * Storage Monitoring Utilities
 * 
 * Provides utilities to monitor IndexedDB storage usage and quota information.
 * This helps users understand their storage consumption and prevent hitting storage limits.
 */

/**
 * Storage quota information
 */
export interface StorageQuota {
  /** Total available storage quota (in bytes) */
  quota: number;
  /** Currently used storage (in bytes) */
  usage: number;
  /** Available storage (quota - usage) in bytes */
  available: number;
  /** Usage percentage (0-100) */
  usagePercentage: number;
}

/**
 * Storage estimation result
 */
export interface StorageEstimation {
  /** Quota information */
  quota: StorageQuota;
  /** Storage breakdown by database (if available) */
  breakdown?: Record<string, number>;
  /** Warning level: 'none', 'warning', 'critical' */
  warningLevel: 'none' | 'warning' | 'critical';
}

/**
 * Get storage quota and usage information
 * 
 * Uses the Storage API (navigator.storage.estimate) to get quota and usage.
 * Falls back to IndexedDB-specific estimation if Storage API is not available.
 * 
 * @returns Promise resolving to storage quota information
 * 
 * @example
 * ```typescript
 * const quota = await getStorageQuota();
 * console.log(`Using ${quota.usagePercentage.toFixed(1)}% of available storage`);
 * ```
 */
export async function getStorageQuota(): Promise<StorageQuota> {
  try {
    // Use Storage API if available (modern browsers)
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      
      const quota = estimate.quota || 0;
      const usage = estimate.usage || 0;
      const available = quota - usage;
      const usagePercentage = quota > 0 ? (usage / quota) * 100 : 0;

      return {
        quota,
        usage,
        available,
        usagePercentage,
      };
    }

    // Fallback: Estimate based on IndexedDB (less accurate)
    return await estimateIndexedDBStorage();
  } catch (error) {
    console.error('Error getting storage quota:', error);
    // Return safe defaults on error
    return {
      quota: 0,
      usage: 0,
      available: 0,
      usagePercentage: 0,
    };
  }
}

/**
 * Estimate IndexedDB storage usage
 * 
 * This is a fallback method that attempts to estimate IndexedDB usage
 * by querying known databases. Less accurate than Storage API but works
 * in older browsers.
 * 
 * @returns Promise resolving to estimated storage quota
 */
async function estimateIndexedDBStorage(): Promise<StorageQuota> {
  try {
    // Try to get database size from known databases
    const dbName = 'instant-express-manager'; // Main database name
    
    // Get all databases (this is async and may not be supported in all browsers)
    const databases = await (indexedDB.databases ? indexedDB.databases() : []);
    
    // Estimate based on known database
    // This is a rough estimate - actual usage may vary
    const estimatedUsage = databases
      .filter(db => db.name === dbName)
      .reduce((total, db) => total + (db.version || 0) * 1024, 0); // Rough estimate

    // Use default quota estimate (typically 50MB for PWAs)
    const defaultQuota = 50 * 1024 * 1024; // 50MB
    const usage = estimatedUsage || 0;
    const available = defaultQuota - usage;
    const usagePercentage = (usage / defaultQuota) * 100;

    return {
      quota: defaultQuota,
      usage,
      available,
      usagePercentage,
    };
  } catch (error) {
    console.error('Error estimating IndexedDB storage:', error);
    return {
      quota: 50 * 1024 * 1024, // Default 50MB
      usage: 0,
      available: 50 * 1024 * 1024,
      usagePercentage: 0,
    };
  }
}

/**
 * Get storage breakdown by database
 * 
 * Attempts to get storage usage breakdown by database name.
 * This is only available in browsers that support indexedDB.databases().
 * 
 * @returns Promise resolving to storage breakdown by database
 */
export async function getStorageBreakdown(): Promise<Record<string, number>> {
  try {
    if (indexedDB.databases) {
      const databases = await indexedDB.databases();
      const breakdown: Record<string, number> = {};
      
      // Get estimate for each database
      // Note: This is approximate as we can't directly query each database's size
      for (const db of databases) {
        if (db.name) {
          breakdown[db.name] = (db.version || 0) * 1024; // Rough estimate
        }
      }
      
      return breakdown;
    }
    
    return {};
  } catch (error) {
    console.error('Error getting storage breakdown:', error);
    return {};
  }
}

/**
 * Get complete storage estimation with warnings
 * 
 * Returns storage quota information along with warning level based on usage.
 * - 'none': Usage < 50%
 * - 'warning': Usage >= 50% and < 80%
 * - 'critical': Usage >= 80%
 * 
 * @returns Promise resolving to storage estimation with warnings
 * 
 * @example
 * ```typescript
 * const estimation = await getStorageEstimation();
 * if (estimation.warningLevel === 'critical') {
 *   alert('Storage is almost full!');
 * }
 * ```
 */
export async function getStorageEstimation(): Promise<StorageEstimation> {
  const quota = await getStorageQuota();
  const breakdown = await getStorageBreakdown();
  
  let warningLevel: 'none' | 'warning' | 'critical' = 'none';
  if (quota.usagePercentage >= 80) {
    warningLevel = 'critical';
  } else if (quota.usagePercentage >= 50) {
    warningLevel = 'warning';
  }

  return {
    quota,
    breakdown,
    warningLevel,
  };
}

/**
 * Format bytes to human-readable string
 * 
 * @param bytes - Number of bytes
 * @returns Formatted string (e.g., "1.5 MB")
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Format percentage with one decimal place
 * 
 * @param percentage - Percentage value (0-100)
 * @returns Formatted string (e.g., "45.5%")
 */
export function formatPercentage(percentage: number): string {
  return `${percentage.toFixed(1)}%`;
}

