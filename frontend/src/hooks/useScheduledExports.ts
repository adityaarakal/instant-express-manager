import { useEffect } from 'react';
import { checkAndExecuteSchedules, requestNotificationPermission } from '../utils/scheduledExports';

/**
 * Hook to initialize and manage scheduled exports
 * Checks schedules on mount and periodically
 */
export function useScheduledExports() {
  useEffect(() => {
    // Request notification permission on app load
    requestNotificationPermission().catch(() => {
      // Silently fail if permission is denied
    });

    // Check schedules immediately on mount
    checkAndExecuteSchedules().catch((error) => {
      console.error('Error checking scheduled exports:', error);
    });

    // Check schedules every 5 minutes
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

