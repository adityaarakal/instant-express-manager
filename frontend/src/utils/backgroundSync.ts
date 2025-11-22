/**
 * Background Sync Utility
 * Handles background sync for scheduled exports when the app is closed
 */

import type { ExportSchedule } from '../store/useExportSchedulesStore';

// Extend ServiceWorkerRegistration to include sync API
interface ExtendedServiceWorkerRegistration extends ServiceWorkerRegistration {
  sync?: {
    register(tag: string): Promise<void>;
    getTags(): Promise<string[]>;
  };
}

interface BackgroundSyncOptions {
  schedule: ExportSchedule;
  retryOnFailure?: boolean;
}

/**
 * Check if Background Sync API is supported
 */
export function isBackgroundSyncSupported(): boolean {
  return (
    'serviceWorker' in navigator &&
    'sync' in (ServiceWorkerRegistration.prototype as unknown as ExtendedServiceWorkerRegistration)
  );
}

/**
 * Register a background sync for scheduled export
 */
export async function registerBackgroundSync(options: BackgroundSyncOptions): Promise<boolean> {
  if (!isBackgroundSyncSupported()) {
    return false;
  }

  try {
    const registration = (await navigator.serviceWorker.ready) as ExtendedServiceWorkerRegistration;
    
    if (!registration.sync) {
      return false;
    }
    
    // Store schedule data in IndexedDB for the service worker to access
    const syncData = {
      id: `export-${options.schedule.id}`,
      type: 'scheduled-export',
      scheduleId: options.schedule.id,
      schedule: options.schedule,
      timestamp: new Date().toISOString(),
    };

    // Store in IndexedDB
    const db = await openSyncDatabase();
    const transaction = db.transaction('sync-queue', 'readwrite');
    const store = transaction.objectStore('sync-queue');
    await new Promise<void>((resolve, reject) => {
      const request = store.put(syncData);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });

    // Register background sync
    await registration.sync.register(`export-${options.schedule.id}`);
    
    return true;
  } catch (error) {
    console.error('Failed to register background sync:', error);
    return false;
  }
}

/**
 * Open IndexedDB for sync queue storage
 */
function openSyncDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('background-sync', 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('sync-queue')) {
        db.createObjectStore('sync-queue', { keyPath: 'id' });
      }
    };
  });
}

/**
 * Get pending sync registrations
 */
export async function getPendingSyncs(): Promise<string[]> {
  if (!isBackgroundSyncSupported()) {
    return [];
  }

  try {
    const registration = (await navigator.serviceWorker.ready) as ExtendedServiceWorkerRegistration;
    if (!registration.sync) {
      return [];
    }
    const tags = await registration.sync.getTags();
    return tags.filter((tag: string) => tag.startsWith('export-'));
  } catch (error) {
    console.error('Failed to get pending syncs:', error);
    return [];
  }
}

/**
 * Unregister a background sync
 */
export async function unregisterBackgroundSync(scheduleId: string): Promise<void> {
  if (!isBackgroundSyncSupported()) {
    return;
  }

  try {
    // Remove from IndexedDB
    const db = await openSyncDatabase();
    const transaction = db.transaction('sync-queue', 'readwrite');
    const store = transaction.objectStore('sync-queue');
    await new Promise<void>((resolve, reject) => {
      const request = store.delete(`export-${scheduleId}`);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
    
    // Note: There's no direct way to unregister a sync tag, but it will be cleaned up
    // when the sync event fires and finds no matching data
    await navigator.serviceWorker.ready; // Ensure service worker is ready
  } catch (error) {
    console.error('Failed to unregister background sync:', error);
  }
}

