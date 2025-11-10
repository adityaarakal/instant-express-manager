import type {
  AllocationStatus,
  PlannedMonthSnapshot,
} from '../types/plannedExpenses';

type RemainingCashInput = {
  baseValue: number;
  fixedBalances?: number | number[];
  savingsTransfers?: number | number[];
  manualAdjustments?: number[];
};

export const toNumber = (value: number | string | null | undefined) => {
  if (typeof value === 'number') {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  return 0;
};

const sumValues = (input?: number | number[]) => {
  if (Array.isArray(input)) {
    return input.reduce((total, value) => total + toNumber(value), 0);
  }
  return toNumber(input);
};

export const calculateRemainingCash = ({
  baseValue,
  fixedBalances = [],
  savingsTransfers = [],
  manualAdjustments = [],
}: RemainingCashInput) => {
  const totalFixed = sumValues(fixedBalances);
  const totalSavings = sumValues(savingsTransfers);
  const totalAdjustments = sumValues(manualAdjustments);

  return Number((baseValue - totalFixed - totalSavings + totalAdjustments).toFixed(2));
};

export const sumBucketByStatus = (
  month: PlannedMonthSnapshot,
  status: AllocationStatus | 'all',
  bucketId?: string,
) => {
  let total = 0;

  for (const account of month.accounts) {
    for (const [bucket, amount] of Object.entries(account.bucketAmounts)) {
      if (amount === null || amount === undefined) {
        continue;
      }

      if (bucketId && bucket !== bucketId) {
        continue;
      }

      const allocationStatus: AllocationStatus =
        month.statusByBucket[bucket] ?? 'pending';

      if (status === 'all' || allocationStatus === status) {
        total += amount;
      }
    }
  }

  return Number(total.toFixed(2));
};

export const convertExcelSerialToIso = (serial: number | null | undefined) => {
  if (serial === null || serial === undefined) {
    return null;
  }

  const excelEpoch = new Date(Date.UTC(1899, 11, 30));
  const date = new Date(excelEpoch.getTime() + serial * 86400000);
  return date.toISOString().split('T')[0] ?? null;
};

export const applyDueDateRule = (
  value: number,
  dueDate: string | null | undefined,
  today: Date = new Date(),
) => {
  if (!dueDate) {
    return value;
  }

  const due = new Date(dueDate);
  if (Number.isNaN(due.getTime())) {
    return value;
  }

  if (today > due) {
    return 0;
  }

  return value;
};

