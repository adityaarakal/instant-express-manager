import type { BankAccount } from './bankAccounts';
import type { IncomeTransaction, ExpenseTransaction, SavingsInvestmentTransaction } from './transactions';
import type { ExpenseBucket } from './transactions';

/**
 * Aggregated month view - derived from transactions
 * This replaces the old PlannedMonthSnapshot
 */
export interface AggregatedMonth {
  id: string; // Format: "YYYY-MM" (e.g., "2023-01")
  monthStart: string; // ISO date string, first day of month
  inflowTotal: number; // Sum of Income Transactions
  fixedFactor: number; // From settings
  accounts: AggregatedAccount[];
  bucketOrder: string[]; // Order of buckets for display
  statusByBucket: Record<string, 'Pending' | 'Paid'>; // Status per bucket
  dueDates: Record<string, string | null>; // Due dates per bucket
  manualAdjustments: ManualAdjustment[]; // One-time adjustments
  refErrors: MonthRefError[]; // Reference errors (for migration)
}

/**
 * Aggregated account view for a month
 */
export interface AggregatedAccount {
  id: string; // Account ID
  accountName: string;
  accountType: BankAccount['accountType'];
  fixedBalance: number | null;
  savingsTransfer: number | null; // Sum of Savings/Investment Transactions
  remainingCash: number | null; // Calculated
  bucketAmounts: Record<string, number | null>; // Amounts per bucket from Expense Transactions
  notes?: string;
}

/**
 * Manual adjustment for a month
 */
export interface ManualAdjustment {
  id: string;
  amount: number;
  description: string;
  accountId?: string; // Optional: specific account
  bucketId?: string; // Optional: specific bucket
  date: string; // ISO date string
}

/**
 * Reference error from migration
 */
export interface MonthRefError {
  field: string;
  message: string;
  originalFormula?: string;
}

/**
 * Bucket totals for a month
 */
export interface BucketTotals {
  pending: Record<string, number>;
  paid: Record<string, number>;
  all: Record<string, number>;
}

