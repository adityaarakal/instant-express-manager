import type {
  IncomeTransaction,
  ExpenseTransaction,
  SavingsInvestmentTransaction,
} from '../types/transactions';
import type {
  RecurringIncome,
  RecurringExpense,
  RecurringSavingsInvestment,
} from '../types/recurring';
import type { CashFlowProjection, ForecastScenario, BudgetRecommendation } from '../store/useForecastingStore';
import { useBankAccountsStore } from '../store/useBankAccountsStore';

/**
 * Calculate average monthly income from historical transactions
 */
export function calculateAverageMonthlyIncome(
  transactions: IncomeTransaction[],
  months: number = 6
): number {
  if (transactions.length === 0) return 0;

  const now = new Date();
  const cutoffDate = new Date(now.getFullYear(), now.getMonth() - months, 1);
  
  const recentTransactions = transactions.filter((t) => {
    const transactionDate = new Date(t.date);
    return transactionDate >= cutoffDate && t.status === 'Received';
  });

  if (recentTransactions.length === 0) return 0;

  const total = recentTransactions.reduce((sum, t) => sum + t.amount, 0);
  return total / months;
}

/**
 * Calculate average monthly expenses from historical transactions
 */
export function calculateAverageMonthlyExpenses(
  transactions: ExpenseTransaction[],
  months: number = 6
): number {
  if (transactions.length === 0) return 0;

  const now = new Date();
  const cutoffDate = new Date(now.getFullYear(), now.getMonth() - months, 1);
  
  const recentTransactions = transactions.filter((t) => {
    const transactionDate = new Date(t.date);
    return transactionDate >= cutoffDate && t.status === 'Paid';
  });

  if (recentTransactions.length === 0) return 0;

  const total = recentTransactions.reduce((sum, t) => sum + t.amount, 0);
  return total / months;
}

/**
 * Calculate average monthly savings from historical transactions
 */
export function calculateAverageMonthlySavings(
  transactions: SavingsInvestmentTransaction[],
  months: number = 6
): number {
  if (transactions.length === 0) return 0;

  const now = new Date();
  const cutoffDate = new Date(now.getFullYear(), now.getMonth() - months, 1);
  
  const recentTransactions = transactions.filter((t) => {
    const transactionDate = new Date(t.date);
    return transactionDate >= cutoffDate && t.status === 'Completed' && (t.type === 'SIP' || t.type === 'LumpSum');
  });

  if (recentTransactions.length === 0) return 0;

  const total = recentTransactions.reduce((sum, t) => sum + t.amount, 0);
  return total / months;
}

/**
 * Project income from recurring templates for a given month
 */
export function projectIncomeFromRecurring(
  templates: RecurringIncome[],
  monthId: string
): number {
  const [year, month] = monthId.split('-').map(Number);
  const monthStart = new Date(year, month - 1, 1);
  const monthEnd = new Date(year, month, 0, 23, 59, 59, 999);

  let projectedIncome = 0;

  templates.forEach((template) => {
    if (template.status !== 'Active') return;
    if (template.endDate && new Date(template.endDate) < monthStart) return;
    if (new Date(template.startDate) > monthEnd) return;

    // Calculate occurrences in this month based on frequency
    const occurrences = getOccurrencesInMonth(template, monthStart, monthEnd);
    projectedIncome += template.amount * occurrences;
  });

  return projectedIncome;
}

/**
 * Project expenses from recurring templates for a given month
 */
export function projectExpensesFromRecurring(
  templates: RecurringExpense[],
  monthId: string
): number {
  const [year, month] = monthId.split('-').map(Number);
  const monthStart = new Date(year, month - 1, 1);
  const monthEnd = new Date(year, month, 0, 23, 59, 59, 999);

  let projectedExpenses = 0;

  templates.forEach((template) => {
    if (template.status !== 'Active') return;
    if (template.endDate && new Date(template.endDate) < monthStart) return;
    if (new Date(template.startDate) > monthEnd) return;

    const occurrences = getOccurrencesInMonth(template, monthStart, monthEnd);
    projectedExpenses += template.amount * occurrences;
  });

  return projectedExpenses;
}

/**
 * Project savings from recurring templates for a given month
 */
export function projectSavingsFromRecurring(
  templates: RecurringSavingsInvestment[],
  monthId: string
): number {
  const [year, month] = monthId.split('-').map(Number);
  const monthStart = new Date(year, month - 1, 1);
  const monthEnd = new Date(year, month, 0, 23, 59, 59, 999);

  let projectedSavings = 0;

  templates.forEach((template) => {
    if (template.status !== 'Active') return;
    if (template.endDate && new Date(template.endDate) < monthStart) return;
    if (new Date(template.startDate) > monthEnd) return;

    const occurrences = getOccurrencesInMonth(template, monthStart, monthEnd);
    projectedSavings += template.amount * occurrences;
  });

  return projectedSavings;
}

/**
 * Get number of occurrences of a recurring template in a given month
 */
function getOccurrencesInMonth(
  template: RecurringIncome | RecurringExpense | RecurringSavingsInvestment,
  monthStart: Date,
  monthEnd: Date
): number {
  switch (template.frequency) {
    case 'Monthly':
      return 1;
    case 'Weekly': {
      // Count weeks in the month
      const weeks = Math.ceil((monthEnd.getDate() - monthStart.getDate() + 1) / 7);
      return Math.min(weeks, 4); // Max 4 weeks per month
    }
    case 'Yearly': {
      // Check if the yearly occurrence falls in this month
      const startDate = new Date(template.startDate);
      const occurrenceDate = new Date(monthStart.getFullYear(), startDate.getMonth(), startDate.getDate());
      return (occurrenceDate >= monthStart && occurrenceDate <= monthEnd) ? 1 : 0;
    }
    case 'Quarterly': {
      // Check if quarterly occurrence falls in this month
      const quarterStart = new Date(template.startDate);
      const monthsSinceStart = (monthStart.getFullYear() - quarterStart.getFullYear()) * 12 +
        (monthStart.getMonth() - quarterStart.getMonth());
      return (monthsSinceStart >= 0 && monthsSinceStart % 3 === 0) ? 1 : 0;
    }
    default:
      return 0;
  }
}

/**
 * Generate cash flow projections for future months
 */
export function generateCashFlowProjections(
  monthsAhead: number,
  baseIncome: number,
  baseExpenses: number,
  baseSavings: number,
  recurringIncomes: RecurringIncome[],
  recurringExpenses: RecurringExpense[],
  recurringSavings: RecurringSavingsInvestment[],
  currentBalance: number,
  scenario?: ForecastScenario
): CashFlowProjection[] {
  const projections: CashFlowProjection[] = [];
  const now = new Date();
  let cumulativeBalance = currentBalance;

  for (let i = 0; i < monthsAhead; i++) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const monthId = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}`;

    // Base projections from historical averages
    let projectedIncome = baseIncome;
    let projectedExpenses = baseExpenses;
    let projectedSavings = baseSavings;

    // Add recurring template projections
    projectedIncome += projectIncomeFromRecurring(recurringIncomes, monthId);
    projectedExpenses += projectExpensesFromRecurring(recurringExpenses, monthId);
    projectedSavings += projectSavingsFromRecurring(recurringSavings, monthId);

    // Apply scenario assumptions if provided
    if (scenario) {
      if (scenario.assumptions.incomeMultiplier) {
        projectedIncome *= scenario.assumptions.incomeMultiplier;
      }
      if (scenario.assumptions.expenseMultiplier) {
        projectedExpenses *= scenario.assumptions.expenseMultiplier;
      }
      if (scenario.assumptions.savingsMultiplier) {
        projectedSavings *= scenario.assumptions.savingsMultiplier;
      }

      // Apply category-specific adjustments
      if (scenario.assumptions.incomeAdjustments) {
        scenario.assumptions.incomeAdjustments.forEach((adj) => {
          projectedIncome += adj.amount;
        });
      }
      if (scenario.assumptions.expenseAdjustments) {
        scenario.assumptions.expenseAdjustments.forEach((adj) => {
          projectedExpenses += adj.amount;
        });
      }
    }

    // Calculate net cash flow
    const netCashFlow = projectedIncome - projectedExpenses - projectedSavings;
    cumulativeBalance += netCashFlow;

    // Determine confidence level
    let confidence: 'high' | 'medium' | 'low' = 'medium';
    if (recurringIncomes.length > 0 && recurringExpenses.length > 0) {
      confidence = 'high';
    } else if (baseIncome > 0 && baseExpenses > 0) {
      confidence = 'medium';
    } else {
      confidence = 'low';
    }

    projections.push({
      monthId,
      projectedIncome,
      projectedExpenses,
      projectedSavings,
      projectedBalance: cumulativeBalance,
      confidence,
    });
  }

  return projections;
}

/**
 * Generate budget recommendations based on spending patterns
 */
export function generateBudgetRecommendations(
  expenseTransactions: ExpenseTransaction[],
  months: number = 6
): BudgetRecommendation[] {
  const now = new Date();
  const cutoffDate = new Date(now.getFullYear(), now.getMonth() - months, 1);

  // Group expenses by category
  const categorySpending: Record<string, { total: number; count: number }> = {};
  
  expenseTransactions.forEach((t) => {
    if (new Date(t.date) >= cutoffDate && t.status === 'Paid') {
      const category = t.category;
      if (!categorySpending[category]) {
        categorySpending[category] = { total: 0, count: 0 };
      }
      categorySpending[category].total += t.amount;
      categorySpending[category].count += 1;
    }
  });

  const recommendations: BudgetRecommendation[] = [];
  const totalMonthlySpending = Object.values(categorySpending).reduce(
    (sum, cat) => sum + cat.total / months,
    0
  );

  // Generate recommendations for each category
  Object.entries(categorySpending).forEach(([category, data]) => {
    const monthlyAverage = data.total / months;
    const percentageOfTotal = (monthlyAverage / totalMonthlySpending) * 100;

    // Recommend reduction for categories that are >20% of total spending
    if (percentageOfTotal > 20 && category !== 'CCBill') {
      const recommendedSpending = monthlyAverage * 0.9; // 10% reduction
      const savingsPotential = monthlyAverage - recommendedSpending;

      recommendations.push({
        category,
        currentSpending: monthlyAverage,
        recommendedSpending,
        savingsPotential,
        priority: percentageOfTotal > 30 ? 'high' : 'medium',
        reasoning: `This category represents ${percentageOfTotal.toFixed(1)}% of your total spending. A 10% reduction could save ₹${savingsPotential.toFixed(0)} per month.`,
      });
    }
  });

  // Sort by priority and savings potential
  return recommendations.sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    }
    return b.savingsPotential - a.savingsPotential;
  });
}

/**
 * Calculate current progress towards savings goals
 */
export function calculateSavingsGoalProgress(
  goalId: string,
  savingsTransactions: SavingsInvestmentTransaction[],
  goalTarget: number,
  goalDate: string
): { current: number; progress: number; onTrack: boolean; monthlyNeeded: number } {
  const now = new Date();
  const targetDate = new Date(goalDate);
  const monthsRemaining = Math.max(
    1,
    (targetDate.getFullYear() - now.getFullYear()) * 12 +
      (targetDate.getMonth() - now.getMonth())
  );

  // Calculate current savings (assuming all savings transactions contribute)
  const current = savingsTransactions
    .filter((t) => t.status === 'Completed' && (t.type === 'SIP' || t.type === 'LumpSum'))
    .reduce((sum, t) => sum + t.amount, 0);

  const progress = goalTarget > 0 ? (current / goalTarget) * 100 : 0;
  const monthlyNeeded = (goalTarget - current) / monthsRemaining;
  const onTrack = monthlyNeeded <= (current / Math.max(1, monthsRemaining));

  return {
    current,
    progress: Math.min(100, progress),
    onTrack,
    monthlyNeeded: Math.max(0, monthlyNeeded),
  };
}

/**
 * Get current total balance across all accounts
 */
export function getCurrentTotalBalance(): number {
  const accounts = useBankAccountsStore.getState().accounts;
  return accounts.reduce((total, account) => {
    return total + (account.currentBalance || 0);
  }, 0);
}

