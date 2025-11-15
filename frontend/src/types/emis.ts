/**
 * EMI for Expenses entity
 */
export interface ExpenseEMI {
  id: string;
  name: string;
  startDate: string; // ISO date string
  endDate: string; // ISO date string
  amount: number; // monthly amount
  accountId: string; // Reference to BankAccount
  category: 'CCEMI' | 'Loan' | 'Other';
  creditCardId?: string; // Reference to BankAccount (if CC EMI)
  frequency: 'Monthly' | 'Quarterly';
  status: 'Active' | 'Completed' | 'Paused';
  totalInstallments: number;
  completedInstallments: number;
  deductionDate?: string; // ISO date string, optional - actual date when next installment will be deducted (independent of start/end dates)
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * EMI for Savings/Investments entity
 */
export interface SavingsInvestmentEMI {
  id: string;
  name: string;
  startDate: string; // ISO date string
  endDate: string; // ISO date string
  amount: number; // monthly amount
  accountId: string; // Reference to BankAccount
  destination: string; // Investment target
  frequency: 'Monthly' | 'Quarterly';
  status: 'Active' | 'Completed' | 'Paused';
  totalInstallments: number;
  completedInstallments: number;
  deductionDate?: string; // ISO date string, optional - actual date when next installment will be deducted (independent of start/end dates)
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type EMICategory = ExpenseEMI['category'];
export type EMIFrequency = ExpenseEMI['frequency'];
export type EMIStatus = ExpenseEMI['status'];

