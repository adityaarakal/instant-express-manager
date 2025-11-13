/**
 * Bank Account entity - represents an account at a bank
 */
export interface BankAccount {
  id: string;
  name: string; // e.g., "ICICI 3945", "Axis 0370"
  bankId: string; // Reference to Bank
  accountType: 'Savings' | 'Current' | 'CreditCard' | 'Wallet';
  accountNumber?: string;
  currentBalance: number;
  creditLimit?: number; // for credit cards
  outstandingBalance?: number; // for credit cards
  statementDate?: string; // ISO date string
  dueDate?: string; // ISO date string, for credit cards
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type AccountType = BankAccount['accountType'];

