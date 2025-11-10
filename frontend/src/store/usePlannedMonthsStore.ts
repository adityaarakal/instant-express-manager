import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

import type {
  AllocationStatus,
  ManualAdjustment,
  PlannedMonthSnapshot,
  Reminder,
} from '../types/plannedExpenses';
import { getLocalforageStorage } from '../utils/storage';

type BucketTotals = {
  pending: Record<string, number>;
  paid: Record<string, number>;
  all: Record<string, number>;
};

type PlannedMonthsState = {
  months: PlannedMonthSnapshot[];
  lastHydratedAt: string | null;
  seedMonths: (months: PlannedMonthSnapshot[]) => void;
  upsertMonth: (month: PlannedMonthSnapshot) => void;
  removeMonth: (monthId: string) => void;
  appendAdjustments: (monthId: string, adjustments: ManualAdjustment[]) => void;
  getMonth: (monthId: string) => PlannedMonthSnapshot | undefined;
  getBucketTotals: (monthId: string) => BucketTotals;
  getReminders: (monthId: string) => Reminder[];
};

const DEFAULT_STATE: Omit<PlannedMonthsState, keyof PlannedMonthsState> = {} as never;

const storage = getLocalforageStorage('planned-months');

const hydrateTotals = (
  month: PlannedMonthSnapshot,
): BucketTotals => {
  const totals: BucketTotals = {
    pending: {},
    paid: {},
    all: {},
  };

  for (const account of month.accounts) {
    for (const [bucketId, amount] of Object.entries(account.bucketAmounts)) {
      if (amount === null || amount === undefined) {
        continue;
      }

      const status: AllocationStatus =
        month.statusByBucket[bucketId] ?? 'pending';

      totals.all[bucketId] = (totals.all[bucketId] ?? 0) + amount;

      if (status === 'pending') {
        totals.pending[bucketId] = (totals.pending[bucketId] ?? 0) + amount;
      } else if (status === 'paid') {
        totals.paid[bucketId] = (totals.paid[bucketId] ?? 0) + amount;
      }
    }
  }

  return totals;
};

export const usePlannedMonthsStore = create<PlannedMonthsState>()(
  devtools(
    persist(
      (set, get) => ({
        months: [],
        lastHydratedAt: null,
        seedMonths: (months) =>
          set(() => ({
            months,
            lastHydratedAt: new Date().toISOString(),
          })),
        upsertMonth: (month) =>
          set((state) => {
            const existingIndex = state.months.findIndex(
              (item) => item.id === month.id,
            );
            let nextMonths = [...state.months];

            if (existingIndex >= 0) {
              nextMonths[existingIndex] = month;
            } else {
              nextMonths = [...state.months, month];
            }

            return { months: nextMonths };
          }),
        removeMonth: (monthId) =>
          set((state) => ({
            months: state.months.filter((month) => month.id !== monthId),
          })),
        appendAdjustments: (monthId, adjustments) =>
          set((state) => ({
            months: state.months.map((month) => {
              if (month.id !== monthId) {
                return month;
              }

              const existing = month.manualAdjustments ?? [];
              return {
                ...month,
                manualAdjustments: [
                  ...existing,
                  ...adjustments.map((adjustment) => ({
                    id:
                      adjustment.id ??
                      (typeof crypto !== 'undefined' && 'randomUUID' in crypto
                        ? crypto.randomUUID()
                        : `adj_${Math.random().toString(36).slice(2)}`),
                    ...adjustment,
                  })),
                ],
              };
            }),
          })),
        getMonth: (monthId) => get().months.find((month) => month.id === monthId),
        getBucketTotals: (monthId) => {
          const month = get().months.find((item) => item.id === monthId);
          if (!month) {
            return {
              pending: {},
              paid: {},
              all: {},
            };
          }

          return hydrateTotals(month);
        },
        getReminders: (monthId) => {
          const month = get().months.find((item) => item.id === monthId);
          if (!month || !month.accounts.length) {
            return [];
          }

          const reminders: Reminder[] = [];

          for (const account of month.accounts) {
            if (!account.notes) {
              continue;
            }

            reminders.push({
              id: account.id,
              allocationId: account.id,
              dueDate: month.dueDates['balance'] ?? month.monthStart,
              isActive: true,
              message: account.notes,
            });
          }

          return reminders;
        },
      }),
      {
        name: 'planned-months',
        storage,
        version: 1,
        onRehydrateStorage: () => () => {
          const state = get();
          if (!state.lastHydratedAt) {
            set({ lastHydratedAt: new Date().toISOString() });
          }
        },
      },
    ),
  ),
);

