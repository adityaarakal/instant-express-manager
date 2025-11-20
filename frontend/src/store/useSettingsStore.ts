import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

import type { AllocationStatus, Settings } from '../types/plannedExpenses';
import {
  DEFAULT_BUCKETS,
  DEFAULT_STATUS_BY_BUCKET,
} from '../config/plannedExpenses';
import { getLocalforageStorage } from '../utils/storage';

type SettingsState = {
  settings: Settings;
  updateSettings: (partial: Partial<Settings>) => void;
  setBucketStatus: (bucketId: string, status: AllocationStatus) => void;
  reset: () => void;
};

const createDefaultSettings = (): Settings => ({
  theme: 'light',
  currency: 'INR',
  defaultBuckets: DEFAULT_BUCKETS.map((bucket) => ({ ...bucket })),
  fixedFactor: 1000,
  defaultStatusByBucket: { ...DEFAULT_STATUS_BY_BUCKET },
  enableReminders: true,
  notifications: {
    enabled: false,
    daysBeforeDue: 7,
    dailySummary: false,
    weeklySummary: false,
    quietHours: {
      enabled: false,
      start: '22:00',
      end: '08:00',
    },
  },
});

const storage = getLocalforageStorage('planner-settings');

export const useSettingsStore = create<SettingsState>()(
  devtools(
    persist(
      (set) => ({
        settings: createDefaultSettings(),
        updateSettings: (partial) =>
          set((state) => ({
            settings: {
              ...state.settings,
              ...partial,
            },
          })),
        setBucketStatus: (bucketId, status) =>
          set((state) => ({
            settings: {
              ...state.settings,
              defaultStatusByBucket: {
                ...state.settings.defaultStatusByBucket,
                [bucketId]: status,
              },
            },
          })),
        reset: () => set({ settings: createDefaultSettings() }),
      }),
      {
        name: 'planner-settings',
        storage,
      },
    ),
  ),
);

