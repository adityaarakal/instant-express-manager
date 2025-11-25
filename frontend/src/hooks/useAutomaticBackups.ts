import { useEffect, useRef } from 'react';
import { exportBackup } from '../utils/backupService';
import { useBackupStore } from '../store/useBackupStore';
import { useSettingsStore } from '../store/useSettingsStore';

/**
 * Hook to manage automatic daily backups
 * Checks if automatic backups are enabled and creates backups daily
 */
export function useAutomaticBackups() {
  const { addBackup } = useBackupStore();
  const settings = useSettingsStore((state) => state.settings);
  const lastBackupDateRef = useRef<string | null>(null);

  useEffect(() => {
    // Check if automatic backups are enabled
    if (!settings.automaticBackups) {
      return;
    }

    const checkAndCreateBackup = async () => {
      try {
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

        // Check if we already created a backup today
        if (lastBackupDateRef.current === today) {
          return;
        }

        // Check last backup time from localStorage
        const lastBackupKey = 'last-automatic-backup-date';
        const lastBackupDate = localStorage.getItem(lastBackupKey);

        // If we already backed up today, skip
        if (lastBackupDate === today) {
          lastBackupDateRef.current = today;
          return;
        }

        // Create automatic backup
        const backup = exportBackup();
        await addBackup(backup, 'automatic', undefined, 'Daily automatic backup');

        // Update last backup date
        localStorage.setItem(lastBackupKey, today);
        lastBackupDateRef.current = today;

        console.log('Automatic backup created successfully');
      } catch (error) {
        console.error('Failed to create automatic backup:', error);
      }
    };

    // Check immediately on mount
    checkAndCreateBackup();

    // Check every hour to see if we need to create a backup
    const interval = setInterval(() => {
      checkAndCreateBackup();
    }, 60 * 60 * 1000); // 1 hour

    return () => {
      clearInterval(interval);
    };
  }, [settings.automaticBackups, addBackup]);
}

