/**
 * Notifications Hook
 * Manages browser notifications for due dates
 */

import { useEffect, useRef } from 'react';
import { useSettingsStore } from '../store/useSettingsStore';
import { initializeNotifications, requestNotificationPermission } from '../utils/notificationService';

export function useNotifications() {
  const { settings } = useSettingsStore();
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    // Get notification settings from store (we'll add this to settings store)
    const notificationSettings = {
      enabled: settings.notifications?.enabled ?? false,
      daysBeforeDue: settings.notifications?.daysBeforeDue ?? 7,
      dailySummary: settings.notifications?.dailySummary ?? false,
      weeklySummary: settings.notifications?.weeklySummary ?? false,
      quietHours: settings.notifications?.quietHours ?? {
        enabled: false,
        start: '22:00',
        end: '08:00',
      },
    };

    if (notificationSettings.enabled) {
      // Request permission if not already granted
      requestNotificationPermission().then((granted) => {
        if (granted) {
          // Initialize notifications
          cleanupRef.current = initializeNotifications(notificationSettings);
        }
      });
    }

    // Cleanup on unmount or settings change
    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }
    };
  }, [settings.notifications]);
}

