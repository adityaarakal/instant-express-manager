import { useEffect } from 'react';
import { checkAndExecuteSchedules, requestNotificationPermission } from '../utils/scheduledExports';
import { isBackgroundSyncSupported, registerBackgroundSync } from '../utils/backgroundSync';
import { useExportSchedulesStore } from '../store/useExportSchedulesStore';

/**
 * Hook to initialize and manage scheduled exports
 * Checks schedules on mount and periodically
 * Registers background sync for scheduled exports when supported
 */
export function useScheduledExports() {
  useEffect(() => {
    // Request notification permission on app load
    requestNotificationPermission().catch(() => {
      // Silently fail if permission is denied
    });

    // Register background sync for all enabled schedules if supported
    if (isBackgroundSyncSupported()) {
      const { getEnabledSchedules } = useExportSchedulesStore.getState();
      const schedules = getEnabledSchedules();
      
      schedules.forEach((schedule) => {
        registerBackgroundSync({ schedule }).catch((error) => {
          console.error(`Failed to register background sync for ${schedule.id}:`, error);
        });
      });
    }

    // Check schedules immediately on mount
    checkAndExecuteSchedules().catch((error) => {
      console.error('Error checking scheduled exports:', error);
    });

    // Check schedules every 5 minutes (fallback if background sync not supported)
    const interval = setInterval(() => {
      checkAndExecuteSchedules().catch((error) => {
        console.error('Error checking scheduled exports:', error);
      });
    }, 5 * 60 * 1000); // 5 minutes

    return () => {
      clearInterval(interval);
    };
  }, []);
}

