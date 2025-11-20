/**
 * Browser Notification Service
 * Handles browser notifications for due dates and reminders
 */

import { useExpenseTransactionsStore } from '../store/useExpenseTransactionsStore';
import type { NotificationSettings } from '../types/plannedExpenses';

/**
 * Request notification permission from user
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    console.warn('This browser does not support notifications');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
}

/**
 * Check if notifications are allowed
 */
export function canSendNotifications(): boolean {
  if (!('Notification' in window)) {
    return false;
  }
  return Notification.permission === 'granted';
}

/**
 * Send a browser notification
 */
export function sendNotification(title: string, options?: NotificationOptions): void {
  if (!canSendNotifications()) {
    return;
  }

  try {
    new Notification(title, {
      icon: '/icon-192x192.png',
      badge: '/icon-192x192.png',
      ...options,
    });
  } catch (error) {
    console.error('Failed to send notification:', error);
  }
}

/**
 * Check for due dates within the specified days and send notifications
 */
export function checkDueDates(settings: NotificationSettings): void {
  if (!settings.enabled || !canSendNotifications()) {
    return;
  }

  const { transactions } = useExpenseTransactionsStore.getState();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dueDateThreshold = new Date(today);
  dueDateThreshold.setDate(today.getDate() + settings.daysBeforeDue);

  const upcomingDueDates = transactions
    .filter((t) => {
      if (!t.dueDate || t.status === 'Paid') return false;
      const dueDate = new Date(t.dueDate);
      dueDate.setHours(0, 0, 0, 0);
      return dueDate >= today && dueDate <= dueDateThreshold;
    })
    .sort((a, b) => {
      const dateA = new Date(a.dueDate!);
      const dateB = new Date(b.dueDate!);
      return dateA.getTime() - dateB.getTime();
    });

  if (upcomingDueDates.length > 0) {
    const dueToday = upcomingDueDates.filter((t) => {
      const dueDate = new Date(t.dueDate!);
      dueDate.setHours(0, 0, 0, 0);
      return dueDate.getTime() === today.getTime();
    });

    const dueSoon = upcomingDueDates.filter((t) => {
      const dueDate = new Date(t.dueDate!);
      dueDate.setHours(0, 0, 0, 0);
      return dueDate.getTime() > today.getTime();
    });

    if (dueToday.length > 0) {
      sendNotification(
        `${dueToday.length} payment${dueToday.length !== 1 ? 's' : ''} due today`,
        {
          body: dueToday.map((t) => t.description).join(', '),
          tag: 'due-today',
          requireInteraction: true,
        },
      );
    } else if (dueSoon.length > 0) {
      const nextDue = dueSoon[0];
      const daysUntil = Math.ceil(
        (new Date(nextDue.dueDate!).getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
      );
      sendNotification(
        `${dueSoon.length} payment${dueSoon.length !== 1 ? 's' : ''} due in ${daysUntil} day${daysUntil !== 1 ? 's' : ''}`,
        {
          body: `Next: ${nextDue.description}`,
          tag: 'due-soon',
        },
      );
    }
  }
}

/**
 * Check if current time is within quiet hours
 */
function isQuietHours(quietHours: NotificationSettings['quietHours']): boolean {
  if (!quietHours.enabled) return false;

  const now = new Date();
  const [startHour, startMin] = quietHours.start.split(':').map(Number);
  const [endHour, endMin] = quietHours.end.split(':').map(Number);

  const startTime = startHour * 60 + startMin;
  const endTime = endHour * 60 + endMin;
  const currentTimeMinutes = now.getHours() * 60 + now.getMinutes();

  // Handle overnight quiet hours (e.g., 22:00 to 08:00)
  if (startTime > endTime) {
    return currentTimeMinutes >= startTime || currentTimeMinutes < endTime;
  }

  return currentTimeMinutes >= startTime && currentTimeMinutes < endTime;
}

/**
 * Initialize notification checking
 */
export function initializeNotifications(settings: NotificationSettings): () => void {
  if (!settings.enabled) {
    return () => {}; // Return no-op cleanup
  }

  // Check immediately
  if (!isQuietHours(settings.quietHours)) {
    checkDueDates(settings);
  }

  // Check every hour
  const intervalId = setInterval(() => {
    if (!isQuietHours(settings.quietHours)) {
      checkDueDates(settings);
    }
  }, 60 * 60 * 1000); // 1 hour

  // Also check when page becomes visible (user returns to tab)
  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible' && !isQuietHours(settings.quietHours)) {
      checkDueDates(settings);
    }
  };

  document.addEventListener('visibilitychange', handleVisibilityChange);

  // Return cleanup function
  return () => {
    clearInterval(intervalId);
    document.removeEventListener('visibilitychange', handleVisibilityChange);
  };
}

