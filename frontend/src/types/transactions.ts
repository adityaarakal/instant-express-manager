/**
 * Income Transaction entity
 */
export interface IncomeTransaction {
  id: string;
  date: string; // ISO date string
  amount: number;
  accountId: string; // Reference to BankAccount
  category: 'Salary' | 'Bonus' | 'Freelancing' | 'Tutoring' | 'Project' | 'Business' | 'LendingReturns' | 'Other';
  description: string;
  clientName?: string; // for freelancing
  projectName?: string;
  recurringTemplateId?: string; // Reference to RecurringIncome
  status: 'Pending' | 'Received';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Expense Transaction entity
 */
export interface ExpenseTransaction {
  id: string;
  date: string; // ISO date string
  amount: number;
  accountId: string; // Reference to BankAccount
  category: 'Utilities' | 'Responsibilities' | 'STRResidency' | 'Maintenance' | 'CCBill' | 'Unplanned' | 'Other';
  description: string;
  bucket: 'Balance' | 'Savings' | 'MutualFunds' | 'CCBill' | 'Maintenance' | 'Expense';
  dueDate?: string; // ISO date string
  recurringTemplateId?: string; // Reference to RecurringExpense
  emiId?: string; // Reference to ExpenseEMI if generated from EMI
  status: 'Pending' | 'Paid';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Savings/Investment Transaction entity
 */
export interface SavingsInvestmentTransaction {
  id: string;
  date: string; // ISO date string
  amount: number;
  accountId: string; // Reference to BankAccount
  destination: string; // Mutual Fund Name, SIP Name, etc.
  type: 'SIP' | 'LumpSum' | 'Withdrawal' | 'Return';
  sipNumber?: string;
  description?: string; // Optional description/notes
  recurringTemplateId?: string; // Reference to RecurringSavingsInvestment
  emiId?: string; // Reference to SavingsInvestmentEMI if generated from EMI
  status: 'Pending' | 'Completed';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type IncomeCategory = IncomeTransaction['category'];
export type ExpenseCategory = ExpenseTransaction['category'];
export type ExpenseBucket = ExpenseTransaction['bucket'];
export type SavingsInvestmentType = SavingsInvestmentTransaction['type'];
export type TransactionStatus = 'Pending' | 'Paid' | 'Received' | 'Completed';

