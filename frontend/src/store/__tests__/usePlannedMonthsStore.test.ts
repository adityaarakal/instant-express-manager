import { describe, it, expect, beforeEach } from 'vitest';
import { usePlannedMonthsStore } from '../usePlannedMonthsStore';
import type { PlannedMonthSnapshot } from '../../types/plannedExpenses';

const createMockMonth = (id: string, monthStart: string): PlannedMonthSnapshot => ({
  id,
  monthStart,
  fixedFactor: 1000,
  inflowTotal: 20000,
  statusByBucket: { balance: 'pending', savings: 'pending' },
  dueDates: { balance: monthStart },
  bucketOrder: ['balance', 'savings'],
  accounts: [
    {
      id: `acc-${id}`,
      accountId: 'acc-1',
      accountName: 'Test Account',
      remainingCash: 1000,
      fixedBalance: 5000,
      savingsTransfer: 2000,
      bucketAmounts: { balance: 10000, savings: 5000 },
    },
  ],
  refErrors: [],
  importedAt: new Date().toISOString(),
});

describe('usePlannedMonthsStore', () => {
  beforeEach(() => {
    usePlannedMonthsStore.setState({
      months: [],
      lastHydratedAt: null,
    });
  });

  it('should initialize with empty months', () => {
    const state = usePlannedMonthsStore.getState();
    expect(state.months).toEqual([]);
  });

  it('should upsert a month', () => {
    const month = createMockMonth('month-1', '2023-01-01');
    usePlannedMonthsStore.getState().upsertMonth(month);

    const state = usePlannedMonthsStore.getState();
    expect(state.months).toHaveLength(1);
    expect(state.months[0].id).toBe('month-1');
  });

  it('should update existing month on upsert', () => {
    const month1 = createMockMonth('month-1', '2023-01-01');
    usePlannedMonthsStore.getState().upsertMonth(month1);

    const updated = { ...month1, inflowTotal: 25000 };
    usePlannedMonthsStore.getState().upsertMonth(updated);

    const state = usePlannedMonthsStore.getState();
    expect(state.months).toHaveLength(1);
    expect(state.months[0].inflowTotal).toBe(25000);
  });

  it('should remove a month', () => {
    const month = createMockMonth('month-1', '2023-01-01');
    usePlannedMonthsStore.getState().upsertMonth(month);
    usePlannedMonthsStore.getState().removeMonth('month-1');

    const state = usePlannedMonthsStore.getState();
    expect(state.months).toHaveLength(0);
  });

  it('should get month by id', () => {
    const month = createMockMonth('month-1', '2023-01-01');
    usePlannedMonthsStore.getState().upsertMonth(month);

    const found = usePlannedMonthsStore.getState().getMonth('month-1');
    expect(found?.id).toBe('month-1');
  });

  it('should update account allocation', () => {
    const month = createMockMonth('month-1', '2023-01-01');
    usePlannedMonthsStore.getState().upsertMonth(month);

    usePlannedMonthsStore.getState().updateAccountAllocation('month-1', 'acc-month-1', {
      fixedBalance: 6000,
    });

    const updated = usePlannedMonthsStore.getState().getMonth('month-1');
    expect(updated?.accounts[0].fixedBalance).toBe(6000);
  });

  it('should update bucket status', () => {
    const month = createMockMonth('month-1', '2023-01-01');
    usePlannedMonthsStore.getState().upsertMonth(month);

    usePlannedMonthsStore.getState().updateBucketStatus('month-1', 'balance', 'paid');

    const updated = usePlannedMonthsStore.getState().getMonth('month-1');
    expect(updated?.statusByBucket.balance).toBe('paid');
  });

  it('should calculate bucket totals', () => {
    const month = createMockMonth('month-1', '2023-01-01');
    usePlannedMonthsStore.getState().upsertMonth(month);

    const totals = usePlannedMonthsStore.getState().getBucketTotals('month-1');
    expect(totals.all.balance).toBe(10000);
    expect(totals.all.savings).toBe(5000);
  });
});

