import type { IncomeCategory, ExpenseCategory, ExpenseBucket, SavingsInvestmentType } from './transactions';

/**
 * Recurring Income template
 */
export interface RecurringIncome {
  id: string;
  name: string;
  amount: number;
  accountId: string; // Reference to BankAccount
  category: IncomeCategory;
  frequency: 'Monthly' | 'Weekly' | 'Yearly' | 'Custom';
  startDate: string; // ISO date string
  endDate?: string; // ISO date string, optional
  nextDueDate: string; // ISO date string
  status: 'Active' | 'Paused' | 'Completed';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Recurring Expense template
 */
export interface RecurringExpense {
  id: string;
  name: string;
  amount: number;
  accountId: string; // Reference to BankAccount
  category: ExpenseCategory;
  bucket: ExpenseBucket;
  frequency: 'Monthly' | 'Weekly' | 'Yearly' | 'Custom';
  startDate: string; // ISO date string
  endDate?: string; // ISO date string, optional
  nextDueDate: string; // ISO date string
  status: 'Active' | 'Paused' | 'Completed';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Recurring Savings/Investment template
 */
export interface RecurringSavingsInvestment {
  id: string;
  name: string;
  amount: number;
  accountId: string; // Reference to BankAccount
  destination: string;
  type: SavingsInvestmentType;
  frequency: 'Monthly' | 'Quarterly' | 'Yearly';
  startDate: string; // ISO date string
  endDate?: string; // ISO date string, optional
  nextDueDate: string; // ISO date string
  status: 'Active' | 'Paused' | 'Completed';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type RecurringFrequency = RecurringIncome['frequency'];
export type RecurringStatus = RecurringIncome['status'];

