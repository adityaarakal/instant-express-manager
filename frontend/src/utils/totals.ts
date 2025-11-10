import type {
  AllocationStatus,
  PlannedMonthSnapshot,
} from '../types/plannedExpenses';

export type BucketTotals = {
  pending: Record<string, number>;
  paid: Record<string, number>;
  all: Record<string, number>;
};

export const calculateBucketTotals = (month: PlannedMonthSnapshot): BucketTotals => {
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

      const status: AllocationStatus = month.statusByBucket[bucketId] ?? 'pending';

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

