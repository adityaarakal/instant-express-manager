import { describe, expect, it } from 'vitest';

// Seed data removed - using mock data instead
const mockPlannedMonth = {
  id: '2023-01',
  monthStart: '2023-01-01',
  fixedFactor: 0.5,
  inflowTotal: 100000,
  statusByBucket: { balance: 'pending', savings: 'paid' },
  dueDates: {},
  bucketOrder: ['balance', 'savings'],
  accounts: [
    {
      id: 'acc-1',
      accountId: 'acc-1',
      accountName: 'Test Account',
      fixedBalance: 50000,
      savingsTransfer: 20000,
      remainingCash: 30000,
      bucketAmounts: { balance: 10000, savings: 20000 },
    },
  ],
  refErrors: [],
  importedAt: new Date().toISOString(),
};
import {
  applyDueDateRule,
  calculateRemainingCash,
  convertExcelSerialToIso,
  sumBucketByStatus,
} from '../formulas';

describe('formulas utilities', () => {
  it('calculates remaining cash with fixed balances and savings', () => {
    const result = calculateRemainingCash({
      baseValue: 10000,
      fixedBalances: [3000, 500],
      savingsTransfers: 2000,
    });

    expect(result).toBe(4500);
  });

  it('sums bucket totals by status', () => {
    const pendingTotal = sumBucketByStatus(mockPlannedMonth as any, 'pending', 'balance');
    const allSavings = sumBucketByStatus(mockPlannedMonth as any, 'all', 'savings');

    expect(pendingTotal).toBe(10000);
    expect(allSavings).toBe(20000); // savings bucket amount only (bucketId filter applied)
  });

  it('converts excel serial to ISO date', () => {
    // Excel serial 44986 = 2023-03-01 (calculated from Excel epoch Dec 30, 1899)
    expect(convertExcelSerialToIso(44986)).toBe('2023-03-01');
    expect(convertExcelSerialToIso(null)).toBeNull();
  });

  it('applies due date rule', () => {
    const today = new Date('2023-04-20');
    expect(applyDueDateRule(100, '2023-04-10', today)).toBe(0);
    expect(applyDueDateRule(100, '2023-05-01', today)).toBe(100);
  });

  it('handles missing bucket status as pending', () => {
    const total = sumBucketByStatus(mockPlannedMonth as any, 'pending');
    expect(total).toBe(10000); // Only balance is pending
  });
});

