import { describe, it, expect } from 'vitest';
import { calculateBucketTotals } from '../totals';
import type { PlannedMonthSnapshot } from '../../types/plannedExpenses';

const createMockMonth = (): PlannedMonthSnapshot => ({
  id: 'test-month',
  monthStart: '2023-01-01',
  fixedFactor: 1000,
  inflowTotal: 20000,
  statusByBucket: {
    balance: 'pending',
    savings: 'paid',
    'mutual-funds': 'pending',
  },
  dueDates: {},
  bucketOrder: ['balance', 'savings', 'mutual-funds'],
  accounts: [
    {
      id: 'acc-1',
      accountId: 'acc-1',
      accountName: 'Account 1',
      remainingCash: 1000,
      fixedBalance: 5000,
      savingsTransfer: 2000,
      bucketAmounts: {
        balance: 10000,
        savings: 5000,
        'mutual-funds': 3000,
      },
    },
    {
      id: 'acc-2',
      accountId: 'acc-2',
      accountName: 'Account 2',
      remainingCash: 500,
      fixedBalance: 3000,
      savingsTransfer: 1000,
      bucketAmounts: {
        balance: 5000,
        savings: 2000,
      },
    },
  ],
  refErrors: [],
  importedAt: new Date().toISOString(),
});

describe('calculateBucketTotals', () => {
  it('should calculate totals for all buckets', () => {
    const month = createMockMonth();
    const totals = calculateBucketTotals(month);

    expect(totals.all.balance).toBe(15000); // 10000 + 5000
    expect(totals.all.savings).toBe(7000); // 5000 + 2000
    expect(totals.all['mutual-funds']).toBe(3000);
  });

  it('should separate pending and paid totals', () => {
    const month = createMockMonth();
    const totals = calculateBucketTotals(month);

    // balance is pending, so all goes to pending
    expect(totals.pending.balance).toBe(15000);
    expect(totals.paid.balance).toBeUndefined();

    // savings is paid, so all goes to paid
    expect(totals.paid.savings).toBe(7000);
    expect(totals.pending.savings).toBeUndefined();

    // mutual-funds is pending
    expect(totals.pending['mutual-funds']).toBe(3000);
  });

  it('should handle null amounts', () => {
    const month: PlannedMonthSnapshot = {
      ...createMockMonth(),
      accounts: [
        {
          id: 'acc-1',
          accountId: 'acc-1',
          accountName: 'Account 1',
          remainingCash: 1000,
          fixedBalance: null,
          savingsTransfer: null,
          bucketAmounts: {
            balance: null,
            savings: 5000,
          },
        },
      ],
    };

    const totals = calculateBucketTotals(month);
    expect(totals.all.balance).toBeUndefined();
    expect(totals.all.savings).toBe(5000);
  });

  it('should handle empty accounts', () => {
    const month: PlannedMonthSnapshot = {
      ...createMockMonth(),
      accounts: [],
    };

    const totals = calculateBucketTotals(month);
    expect(totals.all).toEqual({});
    expect(totals.pending).toEqual({});
    expect(totals.paid).toEqual({});
  });
});

