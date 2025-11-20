/**
 * Bulk Operations Store
 * Manages state for bulk operations on multiple months
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { getLocalforageStorage } from '../utils/storage';

type BulkOperationsState = {
  selectedMonthIds: Set<string>;
  isBulkMode: boolean;
  
  // Actions
  toggleMonthSelection: (monthId: string) => void;
  selectAllMonths: (monthIds: string[]) => void;
  clearSelection: () => void;
  setBulkMode: (enabled: boolean) => void;
  isMonthSelected: (monthId: string) => boolean;
  getSelectedCount: () => number;
};

const storage = getLocalforageStorage('bulk-operations');

export const useBulkOperationsStore = create<BulkOperationsState>()(
  devtools(
    persist(
      (set, get) => ({
        selectedMonthIds: new Set<string>(),
        isBulkMode: false,

        toggleMonthSelection: (monthId) => {
          set((state) => {
            const newSet = new Set(state.selectedMonthIds);
            if (newSet.has(monthId)) {
              newSet.delete(monthId);
            } else {
              newSet.add(monthId);
            }
            return { selectedMonthIds: newSet };
          });
        },

        selectAllMonths: (monthIds) => {
          set({ selectedMonthIds: new Set(monthIds) });
        },

        clearSelection: () => {
          set({ selectedMonthIds: new Set() });
        },

        setBulkMode: (enabled) => {
          set({ isBulkMode: enabled });
          if (!enabled) {
            set({ selectedMonthIds: new Set() });
          }
        },

        isMonthSelected: (monthId) => {
          return get().selectedMonthIds.has(monthId);
        },

        getSelectedCount: () => {
          return get().selectedMonthIds.size;
        },
      }),
      {
        name: 'bulk-operations',
        storage,
        // Convert Set to Array for persistence
        partialize: (state) => ({
          selectedMonthIds: Array.from(state.selectedMonthIds),
          isBulkMode: state.isBulkMode,
        }),
        // Convert Array back to Set on rehydration
        onRehydrateStorage: () => (state) => {
          if (state) {
            state.selectedMonthIds = new Set(state.selectedMonthIds as unknown as string[]);
          }
        },
      },
    ),
    { name: 'BulkOperationsStore' },
  ),
);

