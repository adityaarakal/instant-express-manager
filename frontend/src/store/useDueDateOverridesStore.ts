/**
 * Store for managing due date zeroing overrides
 * Allows users to manually override zeroed amounts for past-due items
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { getLocalforageStorage } from '../utils/storage';

type OverrideKey = string; // Format: "monthId:accountId:bucketId"

type DueDateOverridesState = {
  /**
   * Array of override keys that should NOT be zeroed (even if past due)
   * Key format: "monthId:accountId:bucketId"
   * Stored as array for persistence, but used as Set for fast lookups
   */
  overrides: OverrideKey[];
  /**
   * Add an override (prevent zeroing for this month/account/bucket)
   */
  addOverride: (monthId: string, accountId: string, bucketId: string) => void;
  /**
   * Remove an override (allow zeroing again)
   */
  removeOverride: (monthId: string, accountId: string, bucketId: string) => void;
  /**
   * Check if an override exists
   */
  hasOverride: (monthId: string, accountId: string, bucketId: string) => boolean;
  /**
   * Clear all overrides
   */
  clearAll: () => void;
  /**
   * Clear overrides for a specific month
   */
  clearMonth: (monthId: string) => void;
};

const storage = getLocalforageStorage('due-date-overrides');

// Helper to create override key
const createOverrideKey = (monthId: string, accountId: string, bucketId: string): OverrideKey => {
  return `${monthId}:${accountId}:${bucketId}`;
};

export const useDueDateOverridesStore = create<DueDateOverridesState>()(
  devtools(
    persist(
      (set, get) => ({
        overrides: [] as OverrideKey[],
        addOverride: (monthId, accountId, bucketId) => {
          const key = createOverrideKey(monthId, accountId, bucketId);
          set((state) => {
            if (state.overrides.includes(key)) {
              return state; // Already exists
            }
            return {
              overrides: [...state.overrides, key],
            };
          });
        },
        removeOverride: (monthId, accountId, bucketId) => {
          const key = createOverrideKey(monthId, accountId, bucketId);
          set((state) => ({
            overrides: state.overrides.filter((k) => k !== key),
          }));
        },
        hasOverride: (monthId, accountId, bucketId) => {
          const key = createOverrideKey(monthId, accountId, bucketId);
          return get().overrides.includes(key);
        },
        clearAll: () => {
          set({ overrides: [] });
        },
        clearMonth: (monthId) => {
          set((state) => ({
            overrides: state.overrides.filter((key) => !key.startsWith(`${monthId}:`)),
          }));
        },
      }),
      {
        name: 'due-date-overrides',
        storage,
        version: 1,
      },
    ),
  ),
);

