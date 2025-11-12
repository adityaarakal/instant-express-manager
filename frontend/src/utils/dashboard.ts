import type { PlannedMonthSnapshot } from '../types/plannedExpenses';
import { calculateBucketTotals } from './totals';
import { DEFAULT_BUCKETS } from '../config/plannedExpenses';

export interface DashboardMetrics {
  totalPendingAllocations: number;
  totalSavings: number;
  totalCCBills: number;
  upcomingDueDates: Array<{
    monthId: string;
    monthStart: string;
    bucketId: string;
    bucketName: string;
    dueDate: string;
    amount: number;
  }>;
  savingsTrend: Array<{
    month: string;
    savings: number;
  }>;
}

export const calculateDashboardMetrics = (
  months: PlannedMonthSnapshot[],
): DashboardMetrics => {
  let totalPendingAllocations = 0;
  let totalSavings = 0;
  let totalCCBills = 0;
  const upcomingDueDates: DashboardMetrics['upcomingDueDates'] = [];
  const savingsTrend: DashboardMetrics['savingsTrend'] = [];

  const today = new Date();
  const next30Days = new Date(today);
  next30Days.setDate(today.getDate() + 30);

  for (const month of months) {
    const totals = calculateBucketTotals(month);
    const monthDate = new Date(month.monthStart);

    // Sum pending allocations across all buckets
    for (const amount of Object.values(totals.pending)) {
      totalPendingAllocations += amount;
    }

    // Sum savings transfers
    for (const account of month.accounts) {
      if (account.savingsTransfer !== null && account.savingsTransfer !== undefined) {
        totalSavings += account.savingsTransfer;
      }
    }

    // Sum CC bills (credit card buckets)
    const ccBuckets = DEFAULT_BUCKETS.filter(
      (bucket) => bucket.id.includes('cc-bill') || bucket.name.toLowerCase().includes('cc'),
    );
    for (const bucket of ccBuckets) {
      if (totals.all[bucket.id]) {
        totalCCBills += totals.all[bucket.id];
      }
    }

    // Collect upcoming due dates
    for (const [bucketId, dueDateStr] of Object.entries(month.dueDates)) {
      if (!dueDateStr) continue;

      const dueDate = new Date(dueDateStr);
      if (dueDate >= today && dueDate <= next30Days) {
        const bucket = DEFAULT_BUCKETS.find((b) => b.id === bucketId);
        const amount = totals.pending[bucketId] ?? totals.all[bucketId] ?? 0;

        if (amount > 0) {
          upcomingDueDates.push({
            monthId: month.id,
            monthStart: month.monthStart,
            bucketId,
            bucketName: bucket?.name ?? bucketId,
            dueDate: dueDateStr,
            amount,
          });
        }
      }
    }

    // Build savings trend (last 12 months)
    if (monthDate >= new Date(today.getFullYear() - 1, today.getMonth(), 1)) {
      let monthSavings = 0;
      for (const account of month.accounts) {
        if (account.savingsTransfer !== null && account.savingsTransfer !== undefined) {
          monthSavings += account.savingsTransfer;
        }
      }
      savingsTrend.push({
        month: new Intl.DateTimeFormat('en-IN', { month: 'short', year: 'numeric' }).format(
          monthDate,
        ),
        savings: monthSavings,
      });
    }
  }

  // Sort due dates by date
  upcomingDueDates.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  // Sort savings trend by month
  savingsTrend.sort((a, b) => {
    const dateA = new Date(a.month);
    const dateB = new Date(b.month);
    return dateA.getTime() - dateB.getTime();
  });

  return {
    totalPendingAllocations: Number(totalPendingAllocations.toFixed(2)),
    totalSavings: Number(totalSavings.toFixed(2)),
    totalCCBills: Number(totalCCBills.toFixed(2)),
    upcomingDueDates,
    savingsTrend,
  };
};

