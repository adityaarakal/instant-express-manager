/**
 * Financial calculation utilities
 * Provides helper functions for financial formulas and conversions
 */

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

/**
 * Convert a value to a number
 * Handles null, undefined, string, and number inputs
 * @param value - The value to convert (can be number, string, null, or undefined)
 * @returns The numeric value, or 0 if conversion fails
 */
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

/**
 * Sum values from a single number or array of numbers
 * Handles null/undefined values gracefully
 * @param input - A single number or array of numbers
 * @returns The sum of all values, or 0 if input is undefined
 */
const sumValues = (input?: number | number[]) => {
  if (Array.isArray(input)) {
    return input.reduce((total, value) => total + toNumber(value), 0);
  }
  return toNumber(input);
};

/**
 * Calculate remaining cash after fixed balances, savings transfers, and manual adjustments
 * Formula: baseValue - totalFixed - totalSavings + totalAdjustments
 * @param params - Input parameters for remaining cash calculation
 * @param params.baseValue - The base value (typically account inflow)
 * @param params.fixedBalances - Fixed balance amounts (single value or array)
 * @param params.savingsTransfers - Savings transfer amounts (single value or array)
 * @param params.manualAdjustments - Manual adjustment amounts (array)
 * @returns The remaining cash amount rounded to 2 decimal places
 */
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

/**
 * Sum bucket amounts by status for a given month
 * @deprecated This function is deprecated. Use calculateAggregatedBucketTotals from aggregation.ts instead.
 * This function is kept for backward compatibility only and will be removed in a future version.
 * @param month - The planned month snapshot
 * @param status - The allocation status to filter by ('pending', 'paid', or 'all')
 * @param bucketId - Optional bucket ID to filter by (if not provided, sums all buckets)
 * @returns The total amount rounded to 2 decimal places
 */
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

/**
 * Convert Excel serial date number to ISO date string
 * Excel uses a different epoch (December 30, 1899) than Unix timestamps
 * @param serial - Excel serial date number (null or undefined returns null)
 * @returns ISO date string (YYYY-MM-DD format) or null if input is invalid
 */
export const convertExcelSerialToIso = (serial: number | null | undefined) => {
  if (serial === null || serial === undefined) {
    return null;
  }

  const excelEpoch = new Date(Date.UTC(1899, 11, 30));
  const date = new Date(excelEpoch.getTime() + serial * 86400000);
  return date.toISOString().split('T')[0] ?? null;
};

/**
 * Apply due date rule: return 0 if due date has passed, otherwise return the original value
 * Used for zeroing out amounts that are past their due date
 * @param value - The amount to potentially zero out
 * @param dueDate - The due date (ISO string format) or null/undefined
 * @param today - Today's date (defaults to current date)
 * @returns 0 if due date has passed, otherwise returns the original value
 */
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

