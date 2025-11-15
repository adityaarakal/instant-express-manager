import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { getLocalforageStorage } from '../utils/storage';

export interface ExportHistoryEntry {
  id: string;
  type: 'income' | 'expense' | 'savings' | 'backup';
  filename: string;
  timestamp: string;
  transactionCount?: number;
}

type ExportHistoryState = {
  history: ExportHistoryEntry[];
  addExport: (entry: Omit<ExportHistoryEntry, 'id' | 'timestamp'>) => void;
  clearHistory: () => void;
  getHistoryByType: (type: ExportHistoryEntry['type']) => ExportHistoryEntry[];
  getRecentHistory: (limit?: number) => ExportHistoryEntry[];
};

const storage = getLocalforageStorage('export-history');

export const useExportHistoryStore = create<ExportHistoryState>()(
  devtools(
    persist(
      (set, get) => ({
        history: [],
        addExport: (entry) => {
          const newEntry: ExportHistoryEntry = {
            ...entry,
            id: typeof crypto !== 'undefined' && 'randomUUID' in crypto
              ? crypto.randomUUID()
              : `export_${Date.now()}_${Math.random().toString(36).slice(2)}`,
            timestamp: new Date().toISOString(),
          };
          set((state) => ({
            history: [newEntry, ...state.history].slice(0, 100), // Keep last 100 exports
          }));
        },
        clearHistory: () => {
          set({ history: [] });
        },
        getHistoryByType: (type) => {
          return get().history.filter((entry) => entry.type === type);
        },
        getRecentHistory: (limit = 10) => {
          return get().history.slice(0, limit);
        },
      }),
      {
        name: 'export-history',
        storage,
      }
    )
  )
);

