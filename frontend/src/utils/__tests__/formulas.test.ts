import { describe, expect, it, vi } from 'vitest';

import { plannedMonthsSeed } from '../../data/plannedMonthsSeed';
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
    const month = plannedMonthsSeed[0];
    const pendingTotal = sumBucketByStatus(month, 'pending', 'balance');
    const allSavings = sumBucketByStatus(month, 'all', 'savings');

    expect(pendingTotal).toBeCloseTo(13647.88, 2);
    expect(allSavings).toBe(0);
  });

  it('converts excel serial to ISO date', () => {
    expect(convertExcelSerialToIso(44986)).toBe('2023-03-22');
    expect(convertExcelSerialToIso(null)).toBeNull();
  });

  it('applies due date rule', () => {
    const today = new Date('2023-04-20');
    expect(applyDueDateRule(100, '2023-04-10', today)).toBe(0);
    expect(applyDueDateRule(100, '2023-05-01', today)).toBe(100);
  });

  it('handles missing bucket status as pending', () => {
    const month = plannedMonthsSeed[1];
    const total = sumBucketByStatus(month, 'pending');
    expect(total).toBeGreaterThan(0);
  });
});

