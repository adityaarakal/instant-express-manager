import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import localforage from 'localforage';
import type { BackupData } from '../utils/backupService';

export interface BackupEntry {
  id: string;
  name: string;
  timestamp: string;
  version: string;
  size: number; // Size in bytes
  type: 'manual' | 'automatic';
  description?: string;
}

interface BackupStoreState {
  backups: BackupEntry[];
  addBackup: (backup: BackupData, type: 'manual' | 'automatic', name?: string, description?: string) => Promise<string>;
  getBackup: (id: string) => Promise<BackupData | null>;
  deleteBackup: (id: string) => Promise<void>;
  listBackups: () => BackupEntry[];
  getBackupCount: () => number;
  clearAllBackups: () => Promise<void>;
  getBackupSize: (id: string) => Promise<number>;
  getTotalBackupSize: () => Promise<number>;
}

const BACKUP_STORAGE_PREFIX = 'backup_';

/**
 * Store for managing backup history and storage
 * Backups are stored in IndexedDB with metadata in Zustand store
 */
export const useBackupStore = create<BackupStoreState>()(
  persist(
    (set, get) => ({
      backups: [],

      /**
       * Add a backup to storage
       * @param backup - The backup data to store
       * @param type - Whether this is a manual or automatic backup
       * @param name - Optional custom name for the backup
       * @param description - Optional description
       * @returns The backup ID
       */
      addBackup: async (backup: BackupData, type: 'manual' | 'automatic', name?: string, description?: string) => {
        const id = typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? crypto.randomUUID()
          : `backup_${Date.now()}_${Math.random().toString(36).slice(2)}`;

        const backupString = JSON.stringify(backup);
        const size = new Blob([backupString]).size;

        const entry: BackupEntry = {
          id,
          name: name || (type === 'automatic' 
            ? `Automatic Backup - ${new Date(backup.timestamp).toLocaleString()}`
            : `Manual Backup - ${new Date(backup.timestamp).toLocaleString()}`),
          timestamp: backup.timestamp,
          version: backup.version,
          size,
          type,
          description,
        };

        // Store backup data in IndexedDB
        try {
          await localforage.setItem(`${BACKUP_STORAGE_PREFIX}${id}`, backup);
        } catch (error) {
          console.error('Failed to store backup:', error);
          throw new Error('Failed to store backup');
        }

        // Add to backup list
        set((state) => ({
          backups: [entry, ...state.backups].slice(0, 50), // Keep last 50 backups
        }));

        return id;
      },

      /**
       * Retrieve a backup by ID
       * @param id - The backup ID
       * @returns The backup data or null if not found
       */
      getBackup: async (id: string): Promise<BackupData | null> => {
        try {
          const backup = await localforage.getItem<BackupData>(`${BACKUP_STORAGE_PREFIX}${id}`);
          return backup;
        } catch (error) {
          console.error('Failed to retrieve backup:', error);
          return null;
        }
      },

      /**
       * Delete a backup
       * @param id - The backup ID to delete
       */
      deleteBackup: async (id: string) => {
        try {
          await localforage.removeItem(`${BACKUP_STORAGE_PREFIX}${id}`);
          set((state) => ({
            backups: state.backups.filter((b) => b.id !== id),
          }));
        } catch (error) {
          console.error('Failed to delete backup:', error);
          throw new Error('Failed to delete backup');
        }
      },

      /**
       * List all backups
       * @returns Array of backup entries sorted by timestamp (newest first)
       */
      listBackups: () => {
        return get().backups.sort((a, b) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
      },

      /**
       * Get total number of backups
       */
      getBackupCount: () => {
        return get().backups.length;
      },

      /**
       * Clear all backups
       */
      clearAllBackups: async () => {
        const backups = get().backups;
        try {
          // Delete all backup data from IndexedDB
          await Promise.all(
            backups.map((backup) => 
              localforage.removeItem(`${BACKUP_STORAGE_PREFIX}${backup.id}`)
            )
          );
          set({ backups: [] });
        } catch (error) {
          console.error('Failed to clear backups:', error);
          throw new Error('Failed to clear backups');
        }
      },

      /**
       * Get size of a specific backup
       * @param id - The backup ID
       * @returns Size in bytes
       */
      getBackupSize: async (id: string) => {
        const backup = get().backups.find((b) => b.id === id);
        return backup?.size || 0;
      },

      /**
       * Get total size of all backups
       * @returns Total size in bytes
       */
      getTotalBackupSize: async () => {
        const backups = get().backups;
        return backups.reduce((total, backup) => total + backup.size, 0);
      },
    }),
    {
      name: 'backup-store',
      storage: createJSONStorage(() => localforage),
      version: 1,
    }
  )
);

