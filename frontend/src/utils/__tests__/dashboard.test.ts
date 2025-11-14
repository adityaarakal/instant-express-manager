import { describe, it, expect, beforeEach } from 'vitest';
import { calculateDashboardMetrics } from '../dashboard';
import type {
  IncomeTransaction,
  ExpenseTransaction,
  SavingsInvestmentTransaction,
} from '../../types/transactions';
import type { BankAccount } from '../../types/bankAccounts';

const createMockIncomeTransaction = (
  id: string,
  amount: number,
  date: string,
  status: 'Received' | 'Pending' = 'Received',
): IncomeTransaction => ({
  id,
  accountId: 'acc-1',
  date,
  amount,
  category: 'Salary',
  status,
  description: `Income ${id}`,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

const createMockExpenseTransaction = (
  id: string,
  amount: number,
  date: string,
  status: 'Paid' | 'Pending' = 'Paid',
  bucket: string = 'balance',
  dueDate?: string,
): ExpenseTransaction => ({
  id,
  accountId: 'acc-1',
  date,
  amount,
  category: 'Food',
  status,
  bucket,
  description: `Expense ${id}`,
  dueDate,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

const createMockSavingsTransaction = (
  id: string,
  amount: number,
  date: string,
  status: 'Completed' | 'Pending' = 'Completed',
): SavingsInvestmentTransaction => ({
  id,
  accountId: 'acc-1',
  date,
  amount,
  type: 'SIP',
  destination: 'Mutual Fund',
  status,
  description: `Savings ${id}`,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

const createMockAccount = (id: string, type: BankAccount['accountType'] = 'Savings'): BankAccount => ({
  id,
  bankId: 'bank-1',
  name: `Account ${id}`,
  accountType: type,
  accountNumber: `123456${id}`,
  currentBalance: 10000,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

describe('calculateDashboardMetrics', () => {
  it('should calculate total income from received transactions', () => {
    const incomeTransactions = [
      createMockIncomeTransaction('inc-1', 50000, '2023-01-01', 'Received'),
      createMockIncomeTransaction('inc-2', 30000, '2023-01-15', 'Received'),
      createMockIncomeTransaction('inc-3', 20000, '2023-02-01', 'Pending'), // Should not count
    ];

    const metrics = calculateDashboardMetrics(
      incomeTransactions,
      [],
      [],
      [],
    );

    expect(metrics.totalIncome).toBe(80000); // Only received transactions
  });

  it('should calculate total expenses', () => {
    const expenseTransactions = [
      createMockExpenseTransaction('exp-1', 5000, '2023-01-01', 'Paid'),
      createMockExpenseTransaction('exp-2', 3000, '2023-01-15', 'Paid'),
      createMockExpenseTransaction('exp-3', 2000, '2023-02-01', 'Pending'),
    ];

    const metrics = calculateDashboardMetrics(
      [],
      expenseTransactions,
      [],
      [],
    );

    expect(metrics.totalExpenses).toBe(10000); // All expenses
  });

  it('should calculate total savings from completed transactions', () => {
    const savingsTransactions = [
      createMockSavingsTransaction('sav-1', 5000, '2023-01-01', 'Completed'),
      createMockSavingsTransaction('sav-2', 3000, '2023-01-15', 'Completed'),
      createMockSavingsTransaction('sav-3', 2000, '2023-02-01', 'Pending'), // Should not count
    ];

    const metrics = calculateDashboardMetrics(
      [],
      [],
      savingsTransactions,
      [],
    );

    expect(metrics.totalSavings).toBe(8000); // Only completed
  });

  it('should calculate credit card outstanding', () => {
    const accounts = [
      createMockAccount('acc-1', 'CreditCard'),
      createMockAccount('acc-2', 'CreditCard'),
    ];
    accounts[0].outstandingBalance = 15000;
    accounts[1].outstandingBalance = 10000;

    const metrics = calculateDashboardMetrics(
      [],
      [],
      [],
      accounts,
    );

    expect(metrics.creditCardOutstanding).toBe(25000);
  });

  it('should find upcoming due dates within 30 days', () => {
    const today = new Date();
    const futureDate = new Date(today);
    futureDate.setDate(today.getDate() + 15);
    const futureDateStr = futureDate.toISOString().split('T')[0];

    const expenseTransactions = [
      createMockExpenseTransaction('exp-1', 5000, '2023-01-01', 'Pending', 'balance', futureDateStr),
    ];

    const metrics = calculateDashboardMetrics(
      [],
      expenseTransactions,
      [],
      [],
    );

    expect(metrics.upcomingDueDates.length).toBeGreaterThan(0);
  });

  it('should build savings trend for last 12 months', () => {
    const savingsTransactions: SavingsInvestmentTransaction[] = [];
    const today = new Date();

    for (let i = 0; i < 6; i++) {
      const date = new Date(today);
      date.setMonth(today.getMonth() - i);
      savingsTransactions.push(
        createMockSavingsTransaction(`sav-${i}`, 2000, date.toISOString().split('T')[0], 'Completed'),
      );
    }

    const metrics = calculateDashboardMetrics(
      [],
      [],
      savingsTransactions,
      [],
    );

    expect(metrics.savingsTrend.length).toBeGreaterThan(0);
  });

  it('should handle empty arrays', () => {
    const metrics = calculateDashboardMetrics([], [], [], []);

    expect(metrics.totalIncome).toBe(0);
    expect(metrics.totalExpenses).toBe(0);
    expect(metrics.totalSavings).toBe(0);
    expect(metrics.creditCardOutstanding).toBe(0);
    expect(metrics.upcomingDueDates).toEqual([]);
    expect(metrics.savingsTrend).toEqual([]);
  });
});

