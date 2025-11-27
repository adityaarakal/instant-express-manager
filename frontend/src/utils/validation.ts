/**
 * Validation utilities for financial data
 */

import type { BankAccount } from '../types/bankAccounts';
import type {
  IncomeTransaction,
  ExpenseTransaction,
  SavingsInvestmentTransaction,
} from '../types/transactions';
import type { ExpenseEMI, SavingsInvestmentEMI } from '../types/emis';
import type {
  RecurringIncome,
  RecurringExpense,
  RecurringSavingsInvestment,
} from '../types/recurring';
import type { Bank } from '../types/banks';
import { calculateRemainingCash } from './formulas';
import { isTransactionInMonth } from './transactionFiltering';

export type ValidationResult = {
  isValid: boolean;
  errors: string[];
  warnings: string[];
};

/**
 * Validate date range
 */
export function validateDateRange(startDate: string, endDate: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (isNaN(start.getTime())) {
    errors.push('Start date is invalid');
  }

  if (isNaN(end.getTime())) {
    errors.push('End date is invalid');
  }

  if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && start > end) {
    errors.push('Start date must be before or equal to end date');
  }

  // Check if dates are too far in the past or future
  const now = new Date();
  const maxPastYears = 10;
  const maxFutureYears = 5;
  const minDate = new Date(now.getFullYear() - maxPastYears, 0, 1);
  const maxDate = new Date(now.getFullYear() + maxFutureYears, 11, 31);

  if (!isNaN(start.getTime()) && start < minDate) {
    warnings.push(`Start date is more than ${maxPastYears} years in the past`);
  }

  if (!isNaN(start.getTime()) && start > maxDate) {
    warnings.push(`Start date is more than ${maxFutureYears} years in the future`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate a single date
 */
export function validateDate(date: string, fieldName: string = 'Date'): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!date || date.trim() === '') {
    errors.push(`${fieldName} is required`);
    return { isValid: false, errors, warnings };
  }

  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) {
    errors.push(`${fieldName} is invalid`);
    return { isValid: false, errors, warnings };
  }

  // Check if date is too far in the past or future
  const now = new Date();
  const maxPastYears = 10;
  const maxFutureYears = 5;
  const minDate = new Date(now.getFullYear() - maxPastYears, 0, 1);
  const maxDate = new Date(now.getFullYear() + maxFutureYears, 11, 31);

  if (dateObj < minDate) {
    warnings.push(`${fieldName} is more than ${maxPastYears} years in the past`);
  }

  if (dateObj > maxDate) {
    warnings.push(`${fieldName} is more than ${maxFutureYears} years in the future`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate amount
 */
export function validateAmount(amount: number, fieldName: string = 'Amount'): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (amount === null || amount === undefined || isNaN(amount)) {
    errors.push(`${fieldName} is required`);
    return { isValid: false, errors, warnings };
  }

  if (amount < 0) {
    errors.push(`${fieldName} cannot be negative`);
  }

  if (amount === 0) {
    warnings.push(`${fieldName} is zero`);
  }

  if (amount > 100000000) {
    warnings.push(`${fieldName} is very large (₹${amount.toLocaleString('en-IN')})`);
  }

  // Check for reasonable precision (max 2 decimal places)
  if (amount % 0.01 !== 0 && amount % 0.01 > 0.0001) {
    warnings.push(`${fieldName} has more than 2 decimal places`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate account balance (check for negative balances)
 */
export function validateAccountBalance(
  account: BankAccount,
  newBalance?: number,
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const balance = newBalance !== undefined ? newBalance : account.currentBalance;

  if (balance < 0) {
    if (account.accountType === 'CreditCard') {
      // Credit cards can have negative balances (outstanding debt)
      warnings.push(`Credit card has outstanding balance of ₹${Math.abs(balance).toLocaleString('en-IN')}`);
    } else {
      errors.push(`Account balance cannot be negative (₹${balance.toLocaleString('en-IN')})`);
    }
  }

  // Check credit limit for credit cards
  if (account.accountType === 'CreditCard' && account.creditLimit) {
    const utilization = (Math.abs(balance) / account.creditLimit) * 100;
    if (utilization > 90) {
      warnings.push(`Credit card utilization is ${utilization.toFixed(1)}% (limit: ₹${account.creditLimit.toLocaleString('en-IN')})`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate transaction and check if it would cause negative balance
 */
export function validateTransaction(
  transaction: Partial<IncomeTransaction | ExpenseTransaction | SavingsInvestmentTransaction>,
  account: BankAccount,
  existingTransactions: (IncomeTransaction | ExpenseTransaction | SavingsInvestmentTransaction)[],
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate amount
  if (transaction.amount !== undefined) {
    const amountValidation = validateAmount(transaction.amount, 'Amount');
    errors.push(...amountValidation.errors);
    warnings.push(...amountValidation.warnings);
  }

  // Validate date
  if (transaction.date) {
    const dateValidation = validateDate(transaction.date, 'Date');
    errors.push(...dateValidation.errors);
    warnings.push(...dateValidation.warnings);
  }

  // Validate due date if present
  if ('dueDate' in transaction && transaction.dueDate) {
    const dueDateValidation = validateDate(transaction.dueDate, 'Due date');
    errors.push(...dueDateValidation.errors);
    warnings.push(...dueDateValidation.warnings);

    // Check if due date is before transaction date
    if (transaction.date && transaction.dueDate < transaction.date) {
      warnings.push('Due date is before transaction date');
    }
  }

  // Check if transaction would cause negative balance (for expenses and savings)
  if (transaction.accountId === account.id && transaction.amount !== undefined) {
    if ('status' in transaction && transaction.status === 'Paid') {
      // Calculate projected balance
      const accountTransactions = existingTransactions.filter((t) => t.accountId === account.id);
      const currentBalance = account.currentBalance;
      
      // Sum of all paid transactions
      const paidExpenses = accountTransactions
        .filter((t) => 'status' in t && t.status === 'Paid')
        .reduce((sum, t) => sum + (t.amount || 0), 0);
      
      const paidSavings = accountTransactions
        .filter((t) => 'status' in t && t.status === 'Completed')
        .reduce((sum, t) => sum + (t.amount || 0), 0);
      
      const totalIncome = accountTransactions
        .filter((t) => 'status' in t && t.status === 'Received')
        .reduce((sum, t) => sum + (t.amount || 0), 0);

      // If this is an expense or savings transaction being marked as paid/completed
      if ('bucket' in transaction || 'destination' in transaction) {
        const projectedBalance = currentBalance + totalIncome - paidExpenses - paidSavings - transaction.amount;
        
        if (projectedBalance < 0 && account.accountType !== 'CreditCard') {
          warnings.push(
            `This transaction would result in a negative balance (₹${projectedBalance.toLocaleString('en-IN')})`
          );
        }
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Calculate remaining cash for an account based on transactions
 */
export function calculateAccountRemainingCash(
  account: BankAccount,
  incomeTransactions: IncomeTransaction[],
  expenseTransactions: ExpenseTransaction[],
  savingsTransactions: SavingsInvestmentTransaction[],
  monthId?: string,
): number {
  const accountIncomes = incomeTransactions.filter((t) => t.accountId === account.id);
  const accountExpenses = expenseTransactions.filter((t) => t.accountId === account.id);
  const accountSavings = savingsTransactions.filter((t) => t.accountId === account.id);

  // Filter by month if provided
  let filteredIncomes = accountIncomes;
  let filteredExpenses = accountExpenses;
  let filteredSavings = accountSavings;

  if (monthId) {
    const [year, month] = monthId.split('-');
    const startDate = `${year}-${month}-01`;
    const endDate = `${year}-${month}-31`;

    filteredIncomes = accountIncomes.filter((t) => isTransactionInMonth(t, startDate, endDate));
    filteredExpenses = accountExpenses.filter((t) => isTransactionInMonth(t, startDate, endDate));
    filteredSavings = accountSavings.filter((t) => isTransactionInMonth(t, startDate, endDate));
  }

  const totalIncome = filteredIncomes
    .filter((t) => t.status === 'Received')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = filteredExpenses
    .filter((t) => t.status === 'Paid')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalSavings = filteredSavings
    .filter((t) => t.status === 'Completed')
    .reduce((sum, t) => sum + t.amount, 0);

  const fixedBalance = account.currentBalance || 0;

  return calculateRemainingCash({
    baseValue: totalIncome,
    fixedBalances: [fixedBalance],
    savingsTransfers: totalSavings > 0 ? [totalSavings] : [],
    manualAdjustments: [],
  }) - totalExpenses;
}

/**
 * Apply due date zeroing logic - returns 0 if due date has passed
 */
export function applyDueDateZeroing(
  amount: number,
  dueDate: string | null | undefined,
  today: Date = new Date(),
): number {
  if (!dueDate) {
    return amount;
  }

  const due = new Date(dueDate);
  if (isNaN(due.getTime())) {
    return amount;
  }

  // Set time to start of day for comparison
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const dueStart = new Date(due.getFullYear(), due.getMonth(), due.getDate());

  // If due date has passed, return 0
  if (todayStart > dueStart) {
    return 0;
  }

  return amount;
}

/**
 * Check for data inconsistencies
 * Extended to check all entity types and their relationships
 */
export function checkDataInconsistencies(
  accounts: BankAccount[],
  incomeTransactions: IncomeTransaction[],
  expenseTransactions: ExpenseTransaction[],
  savingsTransactions: SavingsInvestmentTransaction[],
  expenseEMIs?: ExpenseEMI[],
  savingsEMIs?: SavingsInvestmentEMI[],
  recurringIncomes?: RecurringIncome[],
  recurringExpenses?: RecurringExpense[],
  recurringSavings?: RecurringSavingsInvestment[],
  banks?: Bank[],
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const accountIds = new Set(accounts.map((a) => a.id));
  const bankIds = banks ? new Set(banks.map((b) => b.id)) : new Set<string>();

  // Check for accounts with invalid bank references
  if (banks) {
    accounts.forEach((account) => {
      if (!bankIds.has(account.bankId)) {
        errors.push(`Account "${account.name}" references non-existent bank: ${account.bankId}`);
      }
    });
  }

  // Check for accounts with negative balances (non-credit cards)
  accounts.forEach((account) => {
    if (account.currentBalance < 0 && account.accountType !== 'CreditCard') {
      warnings.push(`Account "${account.name}" has negative balance (₹${account.currentBalance.toLocaleString('en-IN')})`);
    }
  });

  // Check for transactions with invalid account references
  [...incomeTransactions, ...expenseTransactions, ...savingsTransactions].forEach((t) => {
    if (!accountIds.has(t.accountId)) {
      errors.push(`Transaction references non-existent account: ${t.accountId}`);
    }
  });

  // Check for transactions with invalid recurring template references
  if (recurringIncomes) {
    const recurringIncomeIds = new Set(recurringIncomes.map((r) => r.id));
    incomeTransactions.forEach((t) => {
      if (t.recurringTemplateId && !recurringIncomeIds.has(t.recurringTemplateId)) {
        errors.push(`Income transaction references non-existent recurring template: ${t.recurringTemplateId}`);
      }
    });
  }

  if (recurringExpenses) {
    const recurringExpenseIds = new Set(recurringExpenses.map((r) => r.id));
    expenseTransactions.forEach((t) => {
      if (t.recurringTemplateId && !recurringExpenseIds.has(t.recurringTemplateId)) {
        errors.push(`Expense transaction references non-existent recurring template: ${t.recurringTemplateId}`);
      }
    });
  }

  if (recurringSavings) {
    const recurringSavingsIds = new Set(recurringSavings.map((r) => r.id));
    savingsTransactions.forEach((t) => {
      if (t.recurringTemplateId && !recurringSavingsIds.has(t.recurringTemplateId)) {
        errors.push(`Savings transaction references non-existent recurring template: ${t.recurringTemplateId}`);
      }
    });
  }

  // Check for transactions with invalid EMI references
  if (expenseEMIs) {
    const expenseEMIIds = new Set(expenseEMIs.map((e) => e.id));
    expenseTransactions.forEach((t) => {
      if (t.emiId && !expenseEMIIds.has(t.emiId)) {
        errors.push(`Expense transaction references non-existent EMI: ${t.emiId}`);
      }
    });
  }

  if (savingsEMIs) {
    const savingsEMIIds = new Set(savingsEMIs.map((e) => e.id));
    savingsTransactions.forEach((t) => {
      if (t.emiId && !savingsEMIIds.has(t.emiId)) {
        errors.push(`Savings transaction references non-existent EMI: ${t.emiId}`);
      }
    });
  }

  // Check for EMIs with invalid account references
  if (expenseEMIs) {
    expenseEMIs.forEach((emi) => {
      if (!accountIds.has(emi.accountId)) {
        errors.push(`Expense EMI "${emi.name}" references non-existent account: ${emi.accountId}`);
      }
      if (emi.creditCardId && !accountIds.has(emi.creditCardId)) {
        errors.push(`Expense EMI "${emi.name}" references non-existent credit card account: ${emi.creditCardId}`);
      }
      // Validate credit card account type
      if (emi.creditCardId) {
        const creditCard = accounts.find((a) => a.id === emi.creditCardId);
        if (creditCard && creditCard.accountType !== 'CreditCard') {
          errors.push(`Expense EMI "${emi.name}" creditCardId references a non-CreditCard account: ${creditCard.accountType}`);
        }
      }
    });
  }

  if (savingsEMIs) {
    savingsEMIs.forEach((emi) => {
      if (!accountIds.has(emi.accountId)) {
        errors.push(`Savings EMI "${emi.name}" references non-existent account: ${emi.accountId}`);
      }
    });
  }

  // Check for recurring templates with invalid account references
  if (recurringIncomes) {
    recurringIncomes.forEach((template) => {
      if (!accountIds.has(template.accountId)) {
        errors.push(`Recurring income "${template.name}" references non-existent account: ${template.accountId}`);
      }
    });
  }

  if (recurringExpenses) {
    recurringExpenses.forEach((template) => {
      if (!accountIds.has(template.accountId)) {
        errors.push(`Recurring expense "${template.name}" references non-existent account: ${template.accountId}`);
      }
    });
  }

  if (recurringSavings) {
    recurringSavings.forEach((template) => {
      if (!accountIds.has(template.accountId)) {
        errors.push(`Recurring savings "${template.name}" references non-existent account: ${template.accountId}`);
      }
    });
  }

  // Check for transactions with dates in the future (more than reasonable)
  const now = new Date();
  const maxFutureDate = new Date(now.getFullYear() + 1, 11, 31);
  [...incomeTransactions, ...expenseTransactions, ...savingsTransactions].forEach((t) => {
    const transactionDate = new Date(t.date);
    if (transactionDate > maxFutureDate) {
      warnings.push(`Transaction dated ${t.date} is more than 1 year in the future`);
    }
  });

  // Check for duplicate transactions (same account, amount, date, description)
  const transactionMap = new Map<string, number>();
  [...incomeTransactions, ...expenseTransactions, ...savingsTransactions].forEach((t) => {
    const key = `${t.accountId}_${t.amount}_${t.date}_${'description' in t ? t.description : t.destination}`;
    const count = transactionMap.get(key) || 0;
    transactionMap.set(key, count + 1);
    if (count > 0) {
      warnings.push(`Possible duplicate transaction: ${'description' in t ? t.description : t.destination} on ${t.date}`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

