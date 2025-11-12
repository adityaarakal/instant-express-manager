import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

import type {
  AllocationStatus,
  ManualAdjustment,
  PlannedMonthSnapshot,
  Reminder,
} from '../types/plannedExpenses';
import { getLocalforageStorage } from '../utils/storage';
import { calculateBucketTotals, type BucketTotals } from '../utils/totals';
import { calculateRemainingCash } from '../utils/formulas';
import { plannedMonthsSeed } from '../data/plannedMonthsSeed';

type PlannedMonthsState = {
  months: PlannedMonthSnapshot[];
  lastHydratedAt: string | null;
  seedMonths: (months: PlannedMonthSnapshot[]) => void;
  upsertMonth: (month: PlannedMonthSnapshot) => void;
  removeMonth: (monthId: string) => void;
  appendAdjustments: (monthId: string, adjustments: ManualAdjustment[]) => void;
  updateAccountAllocation: (
    monthId: string,
    accountId: string,
    updates: {
      fixedBalance?: number | null;
      savingsTransfer?: number | null;
      bucketAmounts?: Record<string, number | null>;
    },
  ) => void;
  updateBucketStatus: (monthId: string, bucketId: string, status: AllocationStatus) => void;
  updateMonthMetadata: (
    monthId: string,
    updates: {
      fixedFactor?: number | null;
      inflowTotal?: number | null;
    },
  ) => void;
  getMonth: (monthId: string) => PlannedMonthSnapshot | undefined;
  getBucketTotals: (monthId: string) => BucketTotals;
  getReminders: (monthId: string) => Reminder[];
};

// Removed unused DEFAULT_STATE

const storage = getLocalforageStorage('planned-months');

export const usePlannedMonthsStore = create<PlannedMonthsState>()(
  devtools(
    persist(
      (set, get) => ({
        months: plannedMonthsSeed,
        lastHydratedAt: new Date().toISOString(),
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
                  ...adjustments.map((adjustment) => {
                    const { id: existingId, ...rest } = adjustment;
                    return {
                      id:
                        existingId ??
                        (typeof crypto !== 'undefined' && 'randomUUID' in crypto
                          ? crypto.randomUUID()
                          : `adj_${Math.random().toString(36).slice(2)}`),
                      ...rest,
                    };
                  }),
                ],
              };
            }),
          })),
        updateAccountAllocation: (monthId, accountId, updates) =>
          set((state) => ({
            months: state.months.map((month) => {
              if (month.id !== monthId) {
                return month;
              }

              return {
                ...month,
                accounts: month.accounts.map((account) => {
                  if (account.id !== accountId) {
                    return account;
                  }

                  const updatedAccount = { ...account };

                  if (updates.fixedBalance !== undefined) {
                    updatedAccount.fixedBalance = updates.fixedBalance;
                  }
                  if (updates.savingsTransfer !== undefined) {
                    updatedAccount.savingsTransfer = updates.savingsTransfer;
                  }
                  if (updates.bucketAmounts) {
                    updatedAccount.bucketAmounts = {
                      ...account.bucketAmounts,
                      ...updates.bucketAmounts,
                    };
                  }

                  // Recalculate remaining cash
                  const baseValue = month.inflowTotal ?? 0;
                  const fixedBalances = updatedAccount.fixedBalance ?? 0;
                  const savingsTransfers = updatedAccount.savingsTransfer ?? 0;
                  const manualAdjustments =
                    month.manualAdjustments
                      ?.filter((adj) => adj.accountId === accountId)
                      .map((adj) => adj.amount) ?? [];

                  updatedAccount.remainingCash = calculateRemainingCash({
                    baseValue,
                    fixedBalances,
                    savingsTransfers,
                    manualAdjustments,
                  });

                  return updatedAccount;
                }),
              };
            }),
          })),
        updateBucketStatus: (monthId, bucketId, status) =>
          set((state) => ({
            months: state.months.map((month) => {
              if (month.id !== monthId) {
                return month;
              }

              return {
                ...month,
                statusByBucket: {
                  ...month.statusByBucket,
                  [bucketId]: status,
                },
              };
            }),
          })),
        updateMonthMetadata: (monthId, updates) =>
          set((state) => ({
            months: state.months.map((month) => {
              if (month.id !== monthId) {
                return month;
              }

              const updatedMonth = { ...month };

              if (updates.fixedFactor !== undefined) {
                updatedMonth.fixedFactor = updates.fixedFactor;
              }
              if (updates.inflowTotal !== undefined) {
                updatedMonth.inflowTotal = updates.inflowTotal;

                // Recalculate remaining cash for all accounts when inflow changes
                updatedMonth.accounts = month.accounts.map((account) => {
                  const baseValue = updates.inflowTotal ?? 0;
                  const fixedBalances = account.fixedBalance ?? 0;
                  const savingsTransfers = account.savingsTransfer ?? 0;
                  const manualAdjustments =
                    month.manualAdjustments
                      ?.filter((adj) => adj.accountId === account.id)
                      .map((adj) => adj.amount) ?? [];

                  return {
                    ...account,
                    remainingCash: calculateRemainingCash({
                      baseValue,
                      fixedBalances,
                      savingsTransfers,
                      manualAdjustments,
                    }),
                  };
                });
              }

              return updatedMonth;
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

          return calculateBucketTotals(month);
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
        onRehydrateStorage: () => (_state, error) => {
          if (error) {
            console.error('Error rehydrating planned months store:', error);
          }
          // lastHydratedAt is set in initial state and updated on actions
        },
      },
    ),
  ),
);

