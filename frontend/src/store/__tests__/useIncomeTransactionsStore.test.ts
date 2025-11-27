import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useIncomeTransactionsStore } from '../useIncomeTransactionsStore';
import { useBankAccountsStore } from '../useBankAccountsStore';
import { useRecurringIncomesStore } from '../useRecurringIncomesStore';
import type { IncomeTransaction } from '../../types/transactions';
import type { BankAccount } from '../../types/bankAccounts';

// Mock dependencies
vi.mock('../useBankAccountsStore', () => ({
  useBankAccountsStore: {
    getState: vi.fn(),
  },
}));

vi.mock('../useRecurringIncomesStore', () => ({
  useRecurringIncomesStore: {
    getState: vi.fn(),
  },
}));

describe('useIncomeTransactionsStore', () => {
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
    useIncomeTransactionsStore.setState({ transactions: [] });
    
    // Setup default mocks
    vi.mocked(useBankAccountsStore.getState).mockReturnValue({
      getAccount: vi.fn((id: string) => {
        if (id === 'account-1') return mockAccount;
        return undefined;
      }),
      updateAccountBalance: vi.fn(),
    } as any);

    vi.mocked(useRecurringIncomesStore.getState).mockReturnValue({
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
  });

  it('should create an income transaction', () => {
    const transactionData: Omit<IncomeTransaction, 'id' | 'createdAt' | 'updatedAt'> = {
      accountId: 'account-1',
      date: '2024-01-15',
      amount: 5000,
      category: 'Salary',
      description: 'Monthly salary',
      status: 'Received',
    };

    useIncomeTransactionsStore.getState().createTransaction(transactionData);

    const transactions = useIncomeTransactionsStore.getState().transactions;
    expect(transactions).toHaveLength(1);
    expect(transactions[0].amount).toBe(5000);
    expect(transactions[0].category).toBe('Salary');
    expect(transactions[0].accountId).toBe('account-1');
    expect(transactions[0].id).toBeDefined();
    expect(transactions[0].createdAt).toBeDefined();
    expect(transactions[0].updatedAt).toBeDefined();
  });

  it('should throw error when creating transaction with invalid accountId', () => {
    const transactionData: Omit<IncomeTransaction, 'id' | 'createdAt' | 'updatedAt'> = {
      accountId: 'invalid-account',
      date: '2024-01-15',
      amount: 5000,
      category: 'Salary',
      description: 'Monthly salary',
      status: 'Received',
    };

    expect(() => {
      useIncomeTransactionsStore.getState().createTransaction(transactionData);
    }).toThrow('Account with id invalid-account does not exist');
  });

  it('should throw error when creating transaction with invalid recurringTemplateId', () => {
    const transactionData: Omit<IncomeTransaction, 'id' | 'createdAt' | 'updatedAt'> = {
      accountId: 'account-1',
      date: '2024-01-15',
      amount: 5000,
      category: 'Salary',
      description: 'Monthly salary',
      status: 'Received',
      recurringTemplateId: 'invalid-template',
    };

    expect(() => {
      useIncomeTransactionsStore.getState().createTransaction(transactionData);
    }).toThrow('Recurring income template with id invalid-template does not exist');
  });

  it('should throw error when creating transaction with invalid date', () => {
    const transactionData: Omit<IncomeTransaction, 'id' | 'createdAt' | 'updatedAt'> = {
      accountId: 'account-1',
      date: '',
      amount: 5000,
      category: 'Salary',
      description: 'Monthly salary',
      status: 'Received',
    };

    expect(() => {
      useIncomeTransactionsStore.getState().createTransaction(transactionData);
    }).toThrow('Date validation failed');
  });

  it('should throw error when creating transaction with invalid amount', () => {
    const transactionData: Omit<IncomeTransaction, 'id' | 'createdAt' | 'updatedAt'> = {
      accountId: 'account-1',
      date: '2024-01-15',
      amount: -100,
      category: 'Salary',
      description: 'Monthly salary',
      status: 'Received',
    };

    expect(() => {
      useIncomeTransactionsStore.getState().createTransaction(transactionData);
    }).toThrow('Amount validation failed');
  });

  it('should update an income transaction', () => {
    const transactionData: Omit<IncomeTransaction, 'id' | 'createdAt' | 'updatedAt'> = {
      accountId: 'account-1',
      date: '2024-01-15',
      amount: 5000,
      category: 'Salary',
      description: 'Monthly salary',
      status: 'Received',
    };

    useIncomeTransactionsStore.getState().createTransaction(transactionData);
    const transaction = useIncomeTransactionsStore.getState().transactions[0];
    const originalUpdatedAt = transaction.updatedAt;

    // Wait a bit to ensure updatedAt changes
    vi.useFakeTimers();
    vi.advanceTimersByTime(1000);

    useIncomeTransactionsStore.getState().updateTransaction(transaction.id, {
      amount: 6000,
      description: 'Updated salary',
    });

    vi.useRealTimers();

    const updatedTransaction = useIncomeTransactionsStore.getState().getTransaction(transaction.id);
    expect(updatedTransaction?.amount).toBe(6000);
    expect(updatedTransaction?.description).toBe('Updated salary');
    expect(updatedTransaction?.updatedAt).not.toBe(originalUpdatedAt);
  });

  it('should throw error when updating transaction with invalid accountId', () => {
    const transactionData: Omit<IncomeTransaction, 'id' | 'createdAt' | 'updatedAt'> = {
      accountId: 'account-1',
      date: '2024-01-15',
      amount: 5000,
      category: 'Salary',
      description: 'Monthly salary',
      status: 'Received',
    };

    useIncomeTransactionsStore.getState().createTransaction(transactionData);
    const transaction = useIncomeTransactionsStore.getState().transactions[0];

    expect(() => {
      useIncomeTransactionsStore.getState().updateTransaction(transaction.id, {
        accountId: 'invalid-account',
      });
    }).toThrow('Account with id invalid-account does not exist');
  });

  it('should delete an income transaction', () => {
    const transactionData: Omit<IncomeTransaction, 'id' | 'createdAt' | 'updatedAt'> = {
      accountId: 'account-1',
      date: '2024-01-15',
      amount: 5000,
      category: 'Salary',
      description: 'Monthly salary',
      status: 'Received',
    };

    useIncomeTransactionsStore.getState().createTransaction(transactionData);
    const transaction = useIncomeTransactionsStore.getState().transactions[0];
    expect(useIncomeTransactionsStore.getState().transactions).toHaveLength(1);

    useIncomeTransactionsStore.getState().deleteTransaction(transaction.id);

    expect(useIncomeTransactionsStore.getState().transactions).toHaveLength(0);
    expect(useIncomeTransactionsStore.getState().getTransaction(transaction.id)).toBeUndefined();
  });

  it('should get transactions by account', () => {
    const transaction1: Omit<IncomeTransaction, 'id' | 'createdAt' | 'updatedAt'> = {
      accountId: 'account-1',
      date: '2024-01-15',
      amount: 5000,
      category: 'Salary',
      description: 'Transaction 1',
      status: 'Received',
    };

    const transaction2: Omit<IncomeTransaction, 'id' | 'createdAt' | 'updatedAt'> = {
      accountId: 'account-2',
      date: '2024-01-15',
      amount: 3000,
      category: 'Bonus',
      description: 'Transaction 2',
      status: 'Received',
    };

    // Mock account-2
    vi.mocked(useBankAccountsStore.getState).mockReturnValue({
      getAccount: vi.fn((id: string) => {
        if (id === 'account-1') return mockAccount;
        if (id === 'account-2') return { ...mockAccount, id: 'account-2' };
        return undefined;
      }),
    } as any);

    useIncomeTransactionsStore.getState().createTransaction(transaction1);
    useIncomeTransactionsStore.getState().createTransaction(transaction2);

    const accountTransactions = useIncomeTransactionsStore.getState().getTransactionsByAccount('account-1');
    expect(accountTransactions).toHaveLength(1);
    expect(accountTransactions[0].accountId).toBe('account-1');
  });

  it('should get transactions by date range', () => {
    const transaction1: Omit<IncomeTransaction, 'id' | 'createdAt' | 'updatedAt'> = {
      accountId: 'account-1',
      date: '2024-01-15',
      amount: 5000,
      category: 'Salary',
      description: 'Transaction 1',
      status: 'Received',
    };

    const transaction2: Omit<IncomeTransaction, 'id' | 'createdAt' | 'updatedAt'> = {
      accountId: 'account-1',
      date: '2024-02-15',
      amount: 5000,
      category: 'Salary',
      description: 'Transaction 2',
      status: 'Received',
    };

    useIncomeTransactionsStore.getState().createTransaction(transaction1);
    useIncomeTransactionsStore.getState().createTransaction(transaction2);

    const janTransactions = useIncomeTransactionsStore.getState().getTransactionsByDateRange('2024-01-01', '2024-01-31');
    expect(janTransactions).toHaveLength(1);
    expect(janTransactions[0].date).toBe('2024-01-15');
  });

  it('should get transactions by category', () => {
    const transaction1: Omit<IncomeTransaction, 'id' | 'createdAt' | 'updatedAt'> = {
      accountId: 'account-1',
      date: '2024-01-15',
      amount: 5000,
      category: 'Salary',
      description: 'Transaction 1',
      status: 'Received',
    };

    const transaction2: Omit<IncomeTransaction, 'id' | 'createdAt' | 'updatedAt'> = {
      accountId: 'account-1',
      date: '2024-01-15',
      amount: 3000,
      category: 'Bonus',
      description: 'Transaction 2',
      status: 'Received',
    };

    useIncomeTransactionsStore.getState().createTransaction(transaction1);
    useIncomeTransactionsStore.getState().createTransaction(transaction2);

    const salaryTransactions = useIncomeTransactionsStore.getState().getTransactionsByCategory('Salary');
    expect(salaryTransactions).toHaveLength(1);
    expect(salaryTransactions[0].category).toBe('Salary');
  });

  it('should calculate total by month', () => {
    const transaction1: Omit<IncomeTransaction, 'id' | 'createdAt' | 'updatedAt'> = {
      accountId: 'account-1',
      date: '2024-01-15',
      amount: 5000,
      category: 'Salary',
      description: 'Transaction 1',
      status: 'Received',
    };

    const transaction2: Omit<IncomeTransaction, 'id' | 'createdAt' | 'updatedAt'> = {
      accountId: 'account-1',
      date: '2024-01-20',
      amount: 3000,
      category: 'Bonus',
      description: 'Transaction 2',
      status: 'Received',
    };

    useIncomeTransactionsStore.getState().createTransaction(transaction1);
    useIncomeTransactionsStore.getState().createTransaction(transaction2);

    const total = useIncomeTransactionsStore.getState().getTotalByMonth('2024-01');
    expect(total).toBe(8000);
  });

  it('should calculate total by account', () => {
    const transaction1: Omit<IncomeTransaction, 'id' | 'createdAt' | 'updatedAt'> = {
      accountId: 'account-1',
      date: '2024-01-15',
      amount: 5000,
      category: 'Salary',
      description: 'Transaction 1',
      status: 'Received',
    };

    const transaction2: Omit<IncomeTransaction, 'id' | 'createdAt' | 'updatedAt'> = {
      accountId: 'account-1',
      date: '2024-02-15',
      amount: 3000,
      category: 'Bonus',
      description: 'Transaction 2',
      status: 'Received',
    };

    useIncomeTransactionsStore.getState().createTransaction(transaction1);
    useIncomeTransactionsStore.getState().createTransaction(transaction2);

    const total = useIncomeTransactionsStore.getState().getTotalByAccount('account-1');
    expect(total).toBe(8000);
  });
});

