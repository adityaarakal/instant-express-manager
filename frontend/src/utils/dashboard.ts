import type {
  IncomeTransaction,
  ExpenseTransaction,
  SavingsInvestmentTransaction,
} from '../types/transactions';
import type { BankAccount } from '../types/bankAccounts';
import { DEFAULT_BUCKETS } from '../config/plannedExpenses';

export interface DashboardMetrics {
  // Overall metrics (all time)
  totalIncome: number;
  totalExpenses: number;
  totalSavings: number;
  totalCCBills: number;
  creditCardOutstanding: number;
  // Monthly metrics (for selected month)
  monthlyIncome: number;
  monthlyExpenses: number;
  monthlySavings: number;
  monthlyInvestments: number;
  monthlyCCBills: number;
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
  monthId?: string | null, // Format: "YYYY-MM"
): DashboardMetrics => {
  let totalIncome = 0;
  let totalExpenses = 0;
  let totalSavings = 0;
  let totalCCBills = 0;
  let monthlyIncome = 0;
  let monthlyExpenses = 0;
  let monthlySavings = 0;
  let monthlyInvestments = 0;
  let monthlyCCBills = 0;
  let creditCardOutstanding = 0;
  const upcomingDueDates: DashboardMetrics['upcomingDueDates'] = [];
  const savingsTrend: DashboardMetrics['savingsTrend'] = [];

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const next30Days = new Date(today);
  next30Days.setDate(today.getDate() + 30);

  // Determine month range for monthly metrics
  let monthStart: Date | null = null;
  let monthEnd: Date | null = null;
  if (monthId) {
    const [year, month] = monthId.split('-').map(Number);
    monthStart = new Date(year, month - 1, 1);
    monthEnd = new Date(year, month, 0, 23, 59, 59, 999);
  } else {
    // Default to current month if no monthId provided
    const now = new Date();
    monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  }

  // Calculate overall totals and monthly metrics
  incomeTransactions.forEach((t) => {
    if (t.status === 'Received') {
      totalIncome += t.amount;
      
      // Check if transaction is in selected month
      if (monthStart && monthEnd) {
        const transactionDate = new Date(t.date);
        if (transactionDate >= monthStart && transactionDate <= monthEnd) {
          monthlyIncome += t.amount;
        }
      }
    }
  });

  expenseTransactions.forEach((t) => {
    totalExpenses += t.amount;
    if (t.bucket === 'CCBill') {
      totalCCBills += t.amount;
    }
    
    // Check if transaction is in selected month
    if (monthStart && monthEnd) {
      const transactionDate = new Date(t.date);
      if (transactionDate >= monthStart && transactionDate <= monthEnd) {
        monthlyExpenses += t.amount;
        if (t.bucket === 'CCBill') {
          monthlyCCBills += t.amount;
        }
      }
    }
  });

  savingsTransactions.forEach((t) => {
    if (t.status === 'Completed') {
      totalSavings += t.amount;
      
      // Check if transaction is in selected month
      if (monthStart && monthEnd) {
        const transactionDate = new Date(t.date);
        if (transactionDate >= monthStart && transactionDate <= monthEnd) {
          // Separate savings and investments
          if (t.type === 'SIP' || t.type === 'LumpSum') {
            monthlyInvestments += t.amount;
          } else {
            monthlySavings += t.amount;
          }
        }
      }
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
    // Overall metrics (all time)
    totalIncome: Number(totalIncome.toFixed(2)),
    totalExpenses: Number(totalExpenses.toFixed(2)),
    totalSavings: Number(totalSavings.toFixed(2)),
    totalCCBills: Number(totalCCBills.toFixed(2)),
    creditCardOutstanding: Number(creditCardOutstanding.toFixed(2)),
    // Monthly metrics
    monthlyIncome: Number(monthlyIncome.toFixed(2)),
    monthlyExpenses: Number(monthlyExpenses.toFixed(2)),
    monthlySavings: Number(monthlySavings.toFixed(2)),
    monthlyInvestments: Number(monthlyInvestments.toFixed(2)),
    monthlyCCBills: Number(monthlyCCBills.toFixed(2)),
    upcomingDueDates,
    savingsTrend,
  };
};
