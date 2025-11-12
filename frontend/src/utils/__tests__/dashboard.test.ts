import { describe, it, expect } from 'vitest';
import { calculateDashboardMetrics } from '../dashboard';
import type { PlannedMonthSnapshot } from '../../types/plannedExpenses';

const createMockMonth = (
  id: string,
  monthStart: string,
  savings: number = 2000,
  pendingAmount: number = 10000,
): PlannedMonthSnapshot => {
  const dueDate = new Date(monthStart);
  dueDate.setDate(dueDate.getDate() + 15); // 15 days from month start

  return {
    id,
    monthStart,
    fixedFactor: 1000,
    inflowTotal: 20000,
    statusByBucket: {
      balance: 'pending',
      savings: 'paid',
      'cc-bill': 'pending',
    },
    dueDates: {
      balance: dueDate.toISOString().split('T')[0],
    },
    bucketOrder: ['balance', 'savings', 'cc-bill'],
    accounts: [
      {
        id: `acc-${id}`,
        accountId: 'acc-1',
        accountName: 'Test Account',
        remainingCash: 1000,
        fixedBalance: 5000,
        savingsTransfer: savings,
        bucketAmounts: {
          balance: pendingAmount,
          'cc-bill': 5000,
        },
      },
    ],
    refErrors: [],
    importedAt: new Date().toISOString(),
  };
};

describe('calculateDashboardMetrics', () => {
  it('should calculate total pending allocations', () => {
    const months = [
      createMockMonth('month-1', '2023-01-01', 2000, 10000),
      createMockMonth('month-2', '2023-02-01', 2000, 15000),
    ];

    const metrics = calculateDashboardMetrics(months);
    expect(metrics.totalPendingAllocations).toBe(25000); // 10000 + 15000
  });

  it('should calculate total savings', () => {
    const months = [
      createMockMonth('month-1', '2023-01-01', 2000),
      createMockMonth('month-2', '2023-02-01', 3000),
    ];

    const metrics = calculateDashboardMetrics(months);
    expect(metrics.totalSavings).toBe(5000); // 2000 + 3000
  });

  it('should calculate total CC bills', () => {
    const months = [
      createMockMonth('month-1', '2023-01-01'),
      createMockMonth('month-2', '2023-02-01'),
    ];

    const metrics = calculateDashboardMetrics(months);
    expect(metrics.totalCCBills).toBe(10000); // 5000 + 5000
  });

  it('should find upcoming due dates within 30 days', () => {
    const today = new Date();
    const nextMonth = new Date(today);
    nextMonth.setMonth(today.getMonth() + 1);
    const nextMonthStr = nextMonth.toISOString().split('T')[0];

    const months = [createMockMonth('month-1', nextMonthStr)];

    const metrics = calculateDashboardMetrics(months);
    expect(metrics.upcomingDueDates.length).toBeGreaterThan(0);
  });

  it('should build savings trend for last 12 months', () => {
    const months: PlannedMonthSnapshot[] = [];
    const today = new Date();

    for (let i = 0; i < 6; i++) {
      const date = new Date(today);
      date.setMonth(today.getMonth() - i);
      months.push(createMockMonth(`month-${i}`, date.toISOString().split('T')[0], 2000));
    }

    const metrics = calculateDashboardMetrics(months);
    expect(metrics.savingsTrend.length).toBe(6);
    expect(metrics.savingsTrend[0].savings).toBe(2000);
  });

  it('should handle empty months array', () => {
    const metrics = calculateDashboardMetrics([]);
    expect(metrics.totalPendingAllocations).toBe(0);
    expect(metrics.totalSavings).toBe(0);
    expect(metrics.totalCCBills).toBe(0);
    expect(metrics.upcomingDueDates).toEqual([]);
    expect(metrics.savingsTrend).toEqual([]);
  });

  it('should sort due dates by date', () => {
    const today = new Date();
    const dates = [
      new Date(today.getTime() + 20 * 24 * 60 * 60 * 1000),
      new Date(today.getTime() + 10 * 24 * 60 * 60 * 1000),
      new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000),
    ];

    const months = dates.map((date, i) =>
      createMockMonth(`month-${i}`, date.toISOString().split('T')[0]),
    );

    const metrics = calculateDashboardMetrics(months);
    expect(metrics.upcomingDueDates.length).toBeGreaterThan(0);
    // Check that dates are sorted
    for (let i = 1; i < metrics.upcomingDueDates.length; i++) {
      const prev = new Date(metrics.upcomingDueDates[i - 1].dueDate);
      const curr = new Date(metrics.upcomingDueDates[i].dueDate);
      expect(curr.getTime()).toBeGreaterThanOrEqual(prev.getTime());
    }
  });
});

