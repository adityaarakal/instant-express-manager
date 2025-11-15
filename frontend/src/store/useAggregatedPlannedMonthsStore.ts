import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { AggregatedMonth, BucketTotals } from '../types/plannedExpensesAggregated';
import { useBankAccountsStore } from './useBankAccountsStore';
import { useIncomeTransactionsStore } from './useIncomeTransactionsStore';
import { useExpenseTransactionsStore } from './useExpenseTransactionsStore';
import { useSavingsInvestmentTransactionsStore } from './useSavingsInvestmentTransactionsStore';
import { useSettingsStore } from './useSettingsStore';
import { aggregateMonth, calculateAggregatedBucketTotals, getAvailableMonths } from '../utils/aggregation';
import { getLocalforageStorage } from '../utils/storage';

type AggregatedPlannedMonthsState = {
  // Aggregated months (derived, not stored)
  getMonth: (monthId: string) => AggregatedMonth | null;
  getAvailableMonths: () => string[];
  getBucketTotals: (monthId: string) => BucketTotals | null;
  // Status management (stored separately)
  statusByBucket: Record<string, Record<string, 'Pending' | 'Paid'>>; // monthId -> bucketId -> status
  updateBucketStatus: (monthId: string, bucketId: string, status: 'Pending' | 'Paid') => void;
  // This updates the underlying transaction statuses
  updateTransactionStatusesByBucket: (monthId: string, bucketId: string, status: 'Pending' | 'Paid') => void;
};

const storage = getLocalforageStorage('aggregated-planned-months');

export const useAggregatedPlannedMonthsStore = create<AggregatedPlannedMonthsState>()(
  devtools(
    persist(
      (set, get) => ({
        statusByBucket: {},
        getMonth: (monthId) => {
          const accounts = useBankAccountsStore.getState().accounts;
          const incomeTransactions = useIncomeTransactionsStore.getState().transactions;
          const expenseTransactions = useExpenseTransactionsStore.getState().transactions;
          const savingsTransactions = useSavingsInvestmentTransactionsStore.getState().transactions;
          const fixedFactor = useSettingsStore.getState().settings.fixedFactor;
          const statusByBucket = get().statusByBucket[monthId] || {};

          return aggregateMonth(
            monthId,
            accounts,
            incomeTransactions,
            expenseTransactions,
            savingsTransactions,
            fixedFactor,
            statusByBucket,
          );
        },
        getAvailableMonths: () => {
          const incomeTransactions = useIncomeTransactionsStore.getState().transactions;
          const expenseTransactions = useExpenseTransactionsStore.getState().transactions;
          const savingsTransactions = useSavingsInvestmentTransactionsStore.getState().transactions;

          return getAvailableMonths(incomeTransactions, expenseTransactions, savingsTransactions);
        },
        getBucketTotals: (monthId) => {
          const month = get().getMonth(monthId);
          if (!month) return null;

          const expenseTransactions = useExpenseTransactionsStore.getState().transactions;
          return calculateAggregatedBucketTotals(month, expenseTransactions);
        },
        updateBucketStatus: (monthId, bucketId, status) => {
          set((state) => {
            const monthStatuses = state.statusByBucket[monthId] || {};
            return {
              statusByBucket: {
                ...state.statusByBucket,
                [monthId]: {
                  ...monthStatuses,
                  [bucketId]: status,
                },
              },
            };
          });
          // Also update underlying transaction statuses
          get().updateTransactionStatusesByBucket(monthId, bucketId, status);
        },
        updateTransactionStatusesByBucket: (monthId, bucketId, status) => {
          const [year, month] = monthId.split('-');
          const startDate = `${year}-${month}-01`;
          const endDate = `${year}-${month}-31`;

          const expenseTransactions = useExpenseTransactionsStore.getState().transactions;
          const monthBucketTransactions = expenseTransactions.filter(
            (t) => t.date >= startDate && t.date <= endDate && t.bucket === bucketId
          );

          monthBucketTransactions.forEach((transaction) => {
            useExpenseTransactionsStore.getState().updateTransaction(transaction.id, {
              status: status === 'Pending' ? 'Pending' : 'Paid',
            });
          });
        },
      }),
      {
        name: 'aggregated-planned-months',
        storage,
        version: 1,
      },
    ),
  ),
);

