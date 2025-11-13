/**
 * Bank entity - represents a financial institution
 */
export interface Bank {
  id: string;
  name: string;
  type: 'Bank' | 'CreditCard' | 'Wallet';
  country?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type BankType = Bank['type'];

