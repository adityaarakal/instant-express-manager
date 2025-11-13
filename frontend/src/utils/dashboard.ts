import type {
  IncomeTransaction,
  ExpenseTransaction,
  SavingsInvestmentTransaction,
} from '../types/transactions';
import type { BankAccount } from '../types/bankAccounts';
import { DEFAULT_BUCKETS } from '../config/plannedExpenses';

export interface DashboardMetrics {
  totalIncome: number;
  totalExpenses: number;
  totalSavings: number;
  totalCCBills: number;
  creditCardOutstanding: number;
  upcomingDueDates: Array<{
    id: string;
    type: 'transaction' | 'emi' | 'recurring';
    description: string;
    dueDate: string;
    amount: number;
  }>;
  savingsTrend: Array<{
    month: string;
    savings: number;
  }>;
}

export const calculateDashboardMetrics = (
  incomeTransactions: IncomeTransaction[],
  expenseTransactions: ExpenseTransaction[],
  savingsTransactions: SavingsInvestmentTransaction[],
  accounts: BankAccount[],
): DashboardMetrics => {
  let totalIncome = 0;
  let totalExpenses = 0;
  let totalSavings = 0;
  let totalCCBills = 0;
  let creditCardOutstanding = 0;
  const upcomingDueDates: DashboardMetrics['upcomingDueDates'] = [];
  const savingsTrend: DashboardMetrics['savingsTrend'] = [];

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const next30Days = new Date(today);
  next30Days.setDate(today.getDate() + 30);

  // Calculate totals
  incomeTransactions.forEach((t) => {
    if (t.status === 'Received') {
      totalIncome += t.amount;
    }
  });

  expenseTransactions.forEach((t) => {
    totalExpenses += t.amount;
    if (t.bucket === 'CCBill') {
      totalCCBills += t.amount;
    }
  });

  savingsTransactions.forEach((t) => {
    if (t.status === 'Completed') {
      totalSavings += t.amount;
    }
  });

  // Calculate credit card outstanding
  accounts.forEach((account) => {
    if (account.accountType === 'CreditCard' && account.outstandingBalance) {
      creditCardOutstanding += account.outstandingBalance;
    }
  });

  // Collect upcoming due dates from expense transactions
  expenseTransactions.forEach((t) => {
    if (t.dueDate && t.status === 'Pending') {
      const dueDate = new Date(t.dueDate);
      dueDate.setHours(0, 0, 0, 0);
      if (dueDate >= today && dueDate <= next30Days) {
        const bucket = DEFAULT_BUCKETS.find((b) => b.id === t.bucket);
        upcomingDueDates.push({
          id: t.id,
          type: 'transaction',
          description: `${bucket?.name || t.bucket}: ${t.description}`,
          dueDate: t.dueDate,
          amount: t.amount,
        });
      }
    }
  });

  // Build savings trend (last 12 months)
  const savingsByMonth = new Map<string, number>();
  savingsTransactions.forEach((t) => {
    if (t.status === 'Completed') {
      const date = new Date(t.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthDate = new Date(date.getFullYear(), date.getMonth(), 1);
      
      // Only include last 12 months
      const twelveMonthsAgo = new Date(today);
      twelveMonthsAgo.setMonth(today.getMonth() - 12);
      
      if (monthDate >= twelveMonthsAgo) {
        savingsByMonth.set(monthKey, (savingsByMonth.get(monthKey) || 0) + t.amount);
      }
    }
  });

  savingsByMonth.forEach((savings, monthKey) => {
    const [year, month] = monthKey.split('-');
    const monthDate = new Date(Number(year), Number(month) - 1, 1);
    savingsTrend.push({
      month: new Intl.DateTimeFormat('en-IN', { month: 'short', year: 'numeric' }).format(
        monthDate,
      ),
      savings,
    });
  });

  // Sort due dates by date
  upcomingDueDates.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  // Sort savings trend by month
  savingsTrend.sort((a, b) => {
    const dateA = new Date(a.month);
    const dateB = new Date(b.month);
    return dateA.getTime() - dateB.getTime();
  });

  return {
    totalIncome: Number(totalIncome.toFixed(2)),
    totalExpenses: Number(totalExpenses.toFixed(2)),
    totalSavings: Number(totalSavings.toFixed(2)),
    totalCCBills: Number(totalCCBills.toFixed(2)),
    creditCardOutstanding: Number(creditCardOutstanding.toFixed(2)),
    upcomingDueDates,
    savingsTrend,
  };
};
