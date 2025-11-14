import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useExpenseTransactionsStore } from '../useExpenseTransactionsStore';
import { useBankAccountsStore } from '../useBankAccountsStore';
import { useRecurringExpensesStore } from '../useRecurringExpensesStore';
import { useExpenseEMIsStore } from '../useExpenseEMIsStore';
import type { ExpenseTransaction } from '../../types/transactions';
import type { BankAccount } from '../../types/bankAccounts';

// Mock dependencies
vi.mock('../useBankAccountsStore', () => ({
  useBankAccountsStore: {
    getState: vi.fn(),
  },
}));

vi.mock('../useRecurringExpensesStore', () => ({
  useRecurringExpensesStore: {
    getState: vi.fn(),
  },
}));

vi.mock('../useExpenseEMIsStore', () => ({
  useExpenseEMIsStore: {
    getState: vi.fn(),
  },
}));

describe('useExpenseTransactionsStore', () => {
  const mockAccount: BankAccount = {
    id: 'account-1',
    name: 'Test Account',
    bankId: 'bank-1',
    accountType: 'Savings',
    currentBalance: 1000,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  };

  beforeEach(() => {
    // Reset store before each test
    useExpenseTransactionsStore.setState({ transactions: [] });
    
    // Setup default mocks
    vi.mocked(useBankAccountsStore.getState).mockReturnValue({
      getAccount: vi.fn((id: string) => {
        if (id === 'account-1') return mockAccount;
        return undefined;
      }),
    } as any);

    vi.mocked(useRecurringExpensesStore.getState).mockReturnValue({
      getTemplate: vi.fn((id: string) => {
        if (id === 'template-1') {
          return {
            id: 'template-1',
            accountId: 'account-1',
            amount: 1000,
            frequency: 'Monthly',
            startDate: '2024-01-01',
            nextDueDate: '2024-02-01',
            status: 'Active',
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
          };
        }
        return undefined;
      }),
    } as any);

    vi.mocked(useExpenseEMIsStore.getState).mockReturnValue({
      getEMI: vi.fn((id: string) => {
        if (id === 'emi-1') {
          return {
            id: 'emi-1',
            accountId: 'account-1',
            amount: 5000,
            startDate: '2024-01-01',
            endDate: '2024-12-01',
            totalInstallments: 12,
            completedInstallments: 0,
            status: 'Active',
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
          };
        }
        return undefined;
      }),
    } as any);
  });

  it('should create an expense transaction', () => {
    const transactionData: Omit<ExpenseTransaction, 'id' | 'createdAt' | 'updatedAt'> = {
      accountId: 'account-1',
      date: '2024-01-15',
      amount: 2000,
      category: 'Utilities',
      description: 'Electricity bill',
      bucket: 'Expense',
      status: 'Pending',
    };

    useExpenseTransactionsStore.getState().createTransaction(transactionData);

    const transactions = useExpenseTransactionsStore.getState().transactions;
    expect(transactions).toHaveLength(1);
    expect(transactions[0].amount).toBe(2000);
    expect(transactions[0].category).toBe('Utilities');
    expect(transactions[0].bucket).toBe('Expense');
    expect(transactions[0].status).toBe('Pending');
    expect(transactions[0].accountId).toBe('account-1');
    expect(transactions[0].id).toBeDefined();
    expect(transactions[0].createdAt).toBeDefined();
    expect(transactions[0].updatedAt).toBeDefined();
  });

  it('should throw error when creating transaction with invalid accountId', () => {
    const transactionData: Omit<ExpenseTransaction, 'id' | 'createdAt' | 'updatedAt'> = {
      accountId: 'invalid-account',
      date: '2024-01-15',
      amount: 2000,
      category: 'Utilities',
      description: 'Electricity bill',
      bucket: 'Expense',
      status: 'Pending',
    };

    expect(() => {
      useExpenseTransactionsStore.getState().createTransaction(transactionData);
    }).toThrow('Account with id invalid-account does not exist');
  });

  it('should throw error when creating transaction with invalid recurringTemplateId', () => {
    const transactionData: Omit<ExpenseTransaction, 'id' | 'createdAt' | 'updatedAt'> = {
      accountId: 'account-1',
      date: '2024-01-15',
      amount: 2000,
      category: 'Utilities',
      description: 'Electricity bill',
      bucket: 'Expense',
      status: 'Pending',
      recurringTemplateId: 'invalid-template',
    };

    expect(() => {
      useExpenseTransactionsStore.getState().createTransaction(transactionData);
    }).toThrow('Recurring expense template with id invalid-template does not exist');
  });

  it('should throw error when creating transaction with invalid emiId', () => {
    const transactionData: Omit<ExpenseTransaction, 'id' | 'createdAt' | 'updatedAt'> = {
      accountId: 'account-1',
      date: '2024-01-15',
      amount: 2000,
      category: 'Utilities',
      description: 'Electricity bill',
      bucket: 'Expense',
      status: 'Pending',
      emiId: 'invalid-emi',
    };

    expect(() => {
      useExpenseTransactionsStore.getState().createTransaction(transactionData);
    }).toThrow('Expense EMI with id invalid-emi does not exist');
  });

  it('should throw error when creating transaction with invalid date', () => {
    const transactionData: Omit<ExpenseTransaction, 'id' | 'createdAt' | 'updatedAt'> = {
      accountId: 'account-1',
      date: '',
      amount: 2000,
      category: 'Utilities',
      description: 'Electricity bill',
      bucket: 'Expense',
      status: 'Pending',
    };

    expect(() => {
      useExpenseTransactionsStore.getState().createTransaction(transactionData);
    }).toThrow('Date validation failed');
  });

  it('should throw error when creating transaction with invalid amount', () => {
    const transactionData: Omit<ExpenseTransaction, 'id' | 'createdAt' | 'updatedAt'> = {
      accountId: 'account-1',
      date: '2024-01-15',
      amount: -100,
      category: 'Utilities',
      description: 'Electricity bill',
      bucket: 'Expense',
      status: 'Pending',
    };

    expect(() => {
      useExpenseTransactionsStore.getState().createTransaction(transactionData);
    }).toThrow('Amount validation failed');
  });

  it('should update an expense transaction', () => {
    const transactionData: Omit<ExpenseTransaction, 'id' | 'createdAt' | 'updatedAt'> = {
      accountId: 'account-1',
      date: '2024-01-15',
      amount: 2000,
      category: 'Utilities',
      description: 'Electricity bill',
      bucket: 'Expense',
      status: 'Pending',
    };

    useExpenseTransactionsStore.getState().createTransaction(transactionData);
    const transaction = useExpenseTransactionsStore.getState().transactions[0];

    useExpenseTransactionsStore.getState().updateTransaction(transaction.id, {
      amount: 2500,
      status: 'Paid',
      description: 'Updated bill',
    });

    const updatedTransaction = useExpenseTransactionsStore.getState().getTransaction(transaction.id);
    expect(updatedTransaction?.amount).toBe(2500);
    expect(updatedTransaction?.status).toBe('Paid');
    expect(updatedTransaction?.description).toBe('Updated bill');
    expect(updatedTransaction?.updatedAt).toBeDefined();
  });

  it('should throw error when updating transaction with invalid accountId', () => {
    const transactionData: Omit<ExpenseTransaction, 'id' | 'createdAt' | 'updatedAt'> = {
      accountId: 'account-1',
      date: '2024-01-15',
      amount: 2000,
      category: 'Utilities',
      description: 'Electricity bill',
      bucket: 'Expense',
      status: 'Pending',
    };

    useExpenseTransactionsStore.getState().createTransaction(transactionData);
    const transaction = useExpenseTransactionsStore.getState().transactions[0];

    expect(() => {
      useExpenseTransactionsStore.getState().updateTransaction(transaction.id, {
        accountId: 'invalid-account',
      });
    }).toThrow('Account with id invalid-account does not exist');
  });

  it('should delete an expense transaction', () => {
    const transactionData: Omit<ExpenseTransaction, 'id' | 'createdAt' | 'updatedAt'> = {
      accountId: 'account-1',
      date: '2024-01-15',
      amount: 2000,
      category: 'Utilities',
      description: 'Electricity bill',
      bucket: 'Expense',
      status: 'Pending',
    };

    useExpenseTransactionsStore.getState().createTransaction(transactionData);
    const transaction = useExpenseTransactionsStore.getState().transactions[0];
    expect(useExpenseTransactionsStore.getState().transactions).toHaveLength(1);

    useExpenseTransactionsStore.getState().deleteTransaction(transaction.id);

    expect(useExpenseTransactionsStore.getState().transactions).toHaveLength(0);
    expect(useExpenseTransactionsStore.getState().getTransaction(transaction.id)).toBeUndefined();
  });

  it('should get transactions by account', () => {
    const transaction1: Omit<ExpenseTransaction, 'id' | 'createdAt' | 'updatedAt'> = {
      accountId: 'account-1',
      date: '2024-01-15',
      amount: 2000,
      category: 'Utilities',
      description: 'Transaction 1',
      bucket: 'Expense',
      status: 'Pending',
    };

    const transaction2: Omit<ExpenseTransaction, 'id' | 'createdAt' | 'updatedAt'> = {
      accountId: 'account-2',
      date: '2024-01-15',
      amount: 1500,
      category: 'Maintenance',
      description: 'Transaction 2',
      bucket: 'Maintenance',
      status: 'Pending',
    };

    // Mock account-2
    vi.mocked(useBankAccountsStore.getState).mockReturnValue({
      getAccount: vi.fn((id: string) => {
        if (id === 'account-1') return mockAccount;
        if (id === 'account-2') return { ...mockAccount, id: 'account-2' };
        return undefined;
      }),
    } as any);

    useExpenseTransactionsStore.getState().createTransaction(transaction1);
    useExpenseTransactionsStore.getState().createTransaction(transaction2);

    const accountTransactions = useExpenseTransactionsStore.getState().getTransactionsByAccount('account-1');
    expect(accountTransactions).toHaveLength(1);
    expect(accountTransactions[0].accountId).toBe('account-1');
  });

  it('should get transactions by date range', () => {
    const transaction1: Omit<ExpenseTransaction, 'id' | 'createdAt' | 'updatedAt'> = {
      accountId: 'account-1',
      date: '2024-01-15',
      amount: 2000,
      category: 'Utilities',
      description: 'Transaction 1',
      bucket: 'Expense',
      status: 'Pending',
    };

    const transaction2: Omit<ExpenseTransaction, 'id' | 'createdAt' | 'updatedAt'> = {
      accountId: 'account-1',
      date: '2024-02-15',
      amount: 1500,
      category: 'Maintenance',
      description: 'Transaction 2',
      bucket: 'Maintenance',
      status: 'Pending',
    };

    useExpenseTransactionsStore.getState().createTransaction(transaction1);
    useExpenseTransactionsStore.getState().createTransaction(transaction2);

    const janTransactions = useExpenseTransactionsStore.getState().getTransactionsByDateRange('2024-01-01', '2024-01-31');
    expect(janTransactions).toHaveLength(1);
    expect(janTransactions[0].date).toBe('2024-01-15');
  });

  it('should get transactions by category', () => {
    const transaction1: Omit<ExpenseTransaction, 'id' | 'createdAt' | 'updatedAt'> = {
      accountId: 'account-1',
      date: '2024-01-15',
      amount: 2000,
      category: 'Utilities',
      description: 'Transaction 1',
      bucket: 'Expense',
      status: 'Pending',
    };

    const transaction2: Omit<ExpenseTransaction, 'id' | 'createdAt' | 'updatedAt'> = {
      accountId: 'account-1',
      date: '2024-01-15',
      amount: 1500,
      category: 'Maintenance',
      description: 'Transaction 2',
      bucket: 'Maintenance',
      status: 'Pending',
    };

    useExpenseTransactionsStore.getState().createTransaction(transaction1);
    useExpenseTransactionsStore.getState().createTransaction(transaction2);

    const utilitiesTransactions = useExpenseTransactionsStore.getState().getTransactionsByCategory('Utilities');
    expect(utilitiesTransactions).toHaveLength(1);
    expect(utilitiesTransactions[0].category).toBe('Utilities');
  });

  it('should get transactions by bucket', () => {
    const transaction1: Omit<ExpenseTransaction, 'id' | 'createdAt' | 'updatedAt'> = {
      accountId: 'account-1',
      date: '2024-01-15',
      amount: 2000,
      category: 'Utilities',
      description: 'Transaction 1',
      bucket: 'Expense',
      status: 'Pending',
    };

    const transaction2: Omit<ExpenseTransaction, 'id' | 'createdAt' | 'updatedAt'> = {
      accountId: 'account-1',
      date: '2024-01-15',
      amount: 1500,
      category: 'Maintenance',
      description: 'Transaction 2',
      bucket: 'Maintenance',
      status: 'Pending',
    };

    useExpenseTransactionsStore.getState().createTransaction(transaction1);
    useExpenseTransactionsStore.getState().createTransaction(transaction2);

    const expenseTransactions = useExpenseTransactionsStore.getState().getTransactionsByBucket('Expense');
    expect(expenseTransactions).toHaveLength(1);
    expect(expenseTransactions[0].bucket).toBe('Expense');
  });

  it('should get transactions by status', () => {
    const transaction1: Omit<ExpenseTransaction, 'id' | 'createdAt' | 'updatedAt'> = {
      accountId: 'account-1',
      date: '2024-01-15',
      amount: 2000,
      category: 'Utilities',
      description: 'Transaction 1',
      bucket: 'Expense',
      status: 'Pending',
    };

    const transaction2: Omit<ExpenseTransaction, 'id' | 'createdAt' | 'updatedAt'> = {
      accountId: 'account-1',
      date: '2024-01-15',
      amount: 1500,
      category: 'Maintenance',
      description: 'Transaction 2',
      bucket: 'Maintenance',
      status: 'Paid',
    };

    useExpenseTransactionsStore.getState().createTransaction(transaction1);
    useExpenseTransactionsStore.getState().createTransaction(transaction2);

    const pendingTransactions = useExpenseTransactionsStore.getState().getTransactionsByStatus('Pending');
    expect(pendingTransactions).toHaveLength(1);
    expect(pendingTransactions[0].status).toBe('Pending');
  });

  it('should calculate total by month', () => {
    const transaction1: Omit<ExpenseTransaction, 'id' | 'createdAt' | 'updatedAt'> = {
      accountId: 'account-1',
      date: '2024-01-15',
      amount: 2000,
      category: 'Utilities',
      description: 'Transaction 1',
      bucket: 'Expense',
      status: 'Pending',
    };

    const transaction2: Omit<ExpenseTransaction, 'id' | 'createdAt' | 'updatedAt'> = {
      accountId: 'account-1',
      date: '2024-01-20',
      amount: 1500,
      category: 'Maintenance',
      description: 'Transaction 2',
      bucket: 'Maintenance',
      status: 'Pending',
    };

    useExpenseTransactionsStore.getState().createTransaction(transaction1);
    useExpenseTransactionsStore.getState().createTransaction(transaction2);

    const total = useExpenseTransactionsStore.getState().getTotalByMonth('2024-01');
    expect(total).toBe(3500);
  });

  it('should calculate total by bucket', () => {
    const transaction1: Omit<ExpenseTransaction, 'id' | 'createdAt' | 'updatedAt'> = {
      accountId: 'account-1',
      date: '2024-01-15',
      amount: 2000,
      category: 'Utilities',
      description: 'Transaction 1',
      bucket: 'Expense',
      status: 'Pending',
    };

    const transaction2: Omit<ExpenseTransaction, 'id' | 'createdAt' | 'updatedAt'> = {
      accountId: 'account-1',
      date: '2024-01-20',
      amount: 1500,
      category: 'Maintenance',
      description: 'Transaction 2',
      bucket: 'Expense',
      status: 'Pending',
    };

    useExpenseTransactionsStore.getState().createTransaction(transaction1);
    useExpenseTransactionsStore.getState().createTransaction(transaction2);

    const total = useExpenseTransactionsStore.getState().getTotalByBucket('Expense');
    expect(total).toBe(3500);
  });

  it('should calculate pending total by bucket', () => {
    const transaction1: Omit<ExpenseTransaction, 'id' | 'createdAt' | 'updatedAt'> = {
      accountId: 'account-1',
      date: '2024-01-15',
      amount: 2000,
      category: 'Utilities',
      description: 'Transaction 1',
      bucket: 'Expense',
      status: 'Pending',
    };

    const transaction2: Omit<ExpenseTransaction, 'id' | 'createdAt' | 'updatedAt'> = {
      accountId: 'account-1',
      date: '2024-01-20',
      amount: 1500,
      category: 'Maintenance',
      description: 'Transaction 2',
      bucket: 'Expense',
      status: 'Paid',
    };

    useExpenseTransactionsStore.getState().createTransaction(transaction1);
    useExpenseTransactionsStore.getState().createTransaction(transaction2);

    const pendingTotal = useExpenseTransactionsStore.getState().getPendingTotalByBucket('Expense');
    expect(pendingTotal).toBe(2000);
  });

  it('should calculate paid total by bucket', () => {
    const transaction1: Omit<ExpenseTransaction, 'id' | 'createdAt' | 'updatedAt'> = {
      accountId: 'account-1',
      date: '2024-01-15',
      amount: 2000,
      category: 'Utilities',
      description: 'Transaction 1',
      bucket: 'Expense',
      status: 'Pending',
    };

    const transaction2: Omit<ExpenseTransaction, 'id' | 'createdAt' | 'updatedAt'> = {
      accountId: 'account-1',
      date: '2024-01-20',
      amount: 1500,
      category: 'Maintenance',
      description: 'Transaction 2',
      bucket: 'Expense',
      status: 'Paid',
    };

    useExpenseTransactionsStore.getState().createTransaction(transaction1);
    useExpenseTransactionsStore.getState().createTransaction(transaction2);

    const paidTotal = useExpenseTransactionsStore.getState().getPaidTotalByBucket('Expense');
    expect(paidTotal).toBe(1500);
  });

  it('should calculate total by bucket for specific month', () => {
    const transaction1: Omit<ExpenseTransaction, 'id' | 'createdAt' | 'updatedAt'> = {
      accountId: 'account-1',
      date: '2024-01-15',
      amount: 2000,
      category: 'Utilities',
      description: 'Transaction 1',
      bucket: 'Expense',
      status: 'Pending',
    };

    const transaction2: Omit<ExpenseTransaction, 'id' | 'createdAt' | 'updatedAt'> = {
      accountId: 'account-1',
      date: '2024-02-15',
      amount: 1500,
      category: 'Maintenance',
      description: 'Transaction 2',
      bucket: 'Expense',
      status: 'Pending',
    };

    useExpenseTransactionsStore.getState().createTransaction(transaction1);
    useExpenseTransactionsStore.getState().createTransaction(transaction2);

    const janTotal = useExpenseTransactionsStore.getState().getTotalByBucket('Expense', '2024-01');
    expect(janTotal).toBe(2000);
  });
});

