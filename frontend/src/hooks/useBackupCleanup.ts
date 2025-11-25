import { useEffect } from 'react';
import { useBackupStore } from '../store/useBackupStore';
import { useSettingsStore } from '../store/useSettingsStore';

/**
 * Hook to automatically clean up old backups based on retention settings
 * Runs on mount and when retention settings change
 */
export function useBackupCleanup() {
  const { backups, deleteBackup } = useBackupStore();
  const { settings } = useSettingsStore();

  useEffect(() => {
    const retentionDays = settings.backupRetentionDays || 30;
    
    // If retention is 0, keep all backups forever
    if (retentionDays === 0) {
      return;
    }

    const cleanupOldBackups = async () => {
      const now = new Date();
      const retentionMs = retentionDays * 24 * 60 * 60 * 1000;
      const cutoffDate = new Date(now.getTime() - retentionMs);

      const backupsToDelete = backups.filter((backup) => {
        const backupDate = new Date(backup.timestamp);
        return backupDate < cutoffDate;
      });

      if (backupsToDelete.length === 0) {
        return;
      }

      // Delete old backups
      try {
        await Promise.all(
          backupsToDelete.map((backup) => deleteBackup(backup.id))
        );
        console.log(`Cleaned up ${backupsToDelete.length} old backup(s)`);
      } catch (error) {
        console.error('Failed to clean up old backups:', error);
      }
    };

    cleanupOldBackups();
  }, [backups, settings.backupRetentionDays, deleteBackup]);
}

