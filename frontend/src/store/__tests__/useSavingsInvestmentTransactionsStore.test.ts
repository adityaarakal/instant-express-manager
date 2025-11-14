import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useSavingsInvestmentTransactionsStore } from '../useSavingsInvestmentTransactionsStore';
import { useBankAccountsStore } from '../useBankAccountsStore';
import { useRecurringSavingsInvestmentsStore } from '../useRecurringSavingsInvestmentsStore';
import { useSavingsInvestmentEMIsStore } from '../useSavingsInvestmentEMIsStore';
import type { SavingsInvestmentTransaction } from '../../types/transactions';
import type { BankAccount } from '../../types/bankAccounts';

// Mock dependencies
vi.mock('../useBankAccountsStore', () => ({
  useBankAccountsStore: {
    getState: vi.fn(),
  },
}));

vi.mock('../useRecurringSavingsInvestmentsStore', () => ({
  useRecurringSavingsInvestmentsStore: {
    getState: vi.fn(),
  },
}));

vi.mock('../useSavingsInvestmentEMIsStore', () => ({
  useSavingsInvestmentEMIsStore: {
    getState: vi.fn(),
  },
}));

describe('useSavingsInvestmentTransactionsStore', () => {
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
    useSavingsInvestmentTransactionsStore.setState({ transactions: [] });
    
    // Setup default mocks
    vi.mocked(useBankAccountsStore.getState).mockReturnValue({
      getAccount: vi.fn((id: string) => {
        if (id === 'account-1') return mockAccount;
        return undefined;
      }),
    } as any);

    vi.mocked(useRecurringSavingsInvestmentsStore.getState).mockReturnValue({
      getTemplate: vi.fn((id: string) => {
        if (id === 'template-1') {
          return {
            id: 'template-1',
            accountId: 'account-1',
            amount: 5000,
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

    vi.mocked(useSavingsInvestmentEMIsStore.getState).mockReturnValue({
      getEMI: vi.fn((id: string) => {
        if (id === 'emi-1') {
          return {
            id: 'emi-1',
            accountId: 'account-1',
            amount: 10000,
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

  it('should create a savings/investment transaction', () => {
    const transactionData: Omit<SavingsInvestmentTransaction, 'id' | 'createdAt' | 'updatedAt'> = {
      accountId: 'account-1',
      date: '2024-01-15',
      amount: 10000,
      destination: 'Mutual Fund ABC',
      type: 'SIP',
      status: 'Pending',
    };

    useSavingsInvestmentTransactionsStore.getState().createTransaction(transactionData);

    const transactions = useSavingsInvestmentTransactionsStore.getState().transactions;
    expect(transactions).toHaveLength(1);
    expect(transactions[0].amount).toBe(10000);
    expect(transactions[0].destination).toBe('Mutual Fund ABC');
    expect(transactions[0].type).toBe('SIP');
    expect(transactions[0].status).toBe('Pending');
    expect(transactions[0].accountId).toBe('account-1');
    expect(transactions[0].id).toBeDefined();
    expect(transactions[0].createdAt).toBeDefined();
    expect(transactions[0].updatedAt).toBeDefined();
  });

  it('should throw error when creating transaction with invalid accountId', () => {
    const transactionData: Omit<SavingsInvestmentTransaction, 'id' | 'createdAt' | 'updatedAt'> = {
      accountId: 'invalid-account',
      date: '2024-01-15',
      amount: 10000,
      destination: 'Mutual Fund ABC',
      type: 'SIP',
      status: 'Pending',
    };

    expect(() => {
      useSavingsInvestmentTransactionsStore.getState().createTransaction(transactionData);
    }).toThrow('Account with id invalid-account does not exist');
  });

  it('should throw error when creating transaction with invalid recurringTemplateId', () => {
    const transactionData: Omit<SavingsInvestmentTransaction, 'id' | 'createdAt' | 'updatedAt'> = {
      accountId: 'account-1',
      date: '2024-01-15',
      amount: 10000,
      destination: 'Mutual Fund ABC',
      type: 'SIP',
      status: 'Pending',
      recurringTemplateId: 'invalid-template',
    };

    expect(() => {
      useSavingsInvestmentTransactionsStore.getState().createTransaction(transactionData);
    }).toThrow('Recurring savings/investment template with id invalid-template does not exist');
  });

  it('should throw error when creating transaction with invalid emiId', () => {
    const transactionData: Omit<SavingsInvestmentTransaction, 'id' | 'createdAt' | 'updatedAt'> = {
      accountId: 'account-1',
      date: '2024-01-15',
      amount: 10000,
      destination: 'Mutual Fund ABC',
      type: 'SIP',
      status: 'Pending',
      emiId: 'invalid-emi',
    };

    expect(() => {
      useSavingsInvestmentTransactionsStore.getState().createTransaction(transactionData);
    }).toThrow('Savings/Investment EMI with id invalid-emi does not exist');
  });

  it('should throw error when creating transaction with invalid date', () => {
    const transactionData: Omit<SavingsInvestmentTransaction, 'id' | 'createdAt' | 'updatedAt'> = {
      accountId: 'account-1',
      date: '',
      amount: 10000,
      destination: 'Mutual Fund ABC',
      type: 'SIP',
      status: 'Pending',
    };

    expect(() => {
      useSavingsInvestmentTransactionsStore.getState().createTransaction(transactionData);
    }).toThrow('Date validation failed');
  });

  it('should throw error when creating transaction with invalid amount', () => {
    const transactionData: Omit<SavingsInvestmentTransaction, 'id' | 'createdAt' | 'updatedAt'> = {
      accountId: 'account-1',
      date: '2024-01-15',
      amount: -100,
      destination: 'Mutual Fund ABC',
      type: 'SIP',
      status: 'Pending',
    };

    expect(() => {
      useSavingsInvestmentTransactionsStore.getState().createTransaction(transactionData);
    }).toThrow('Amount validation failed');
  });

  it('should update a savings/investment transaction', () => {
    const transactionData: Omit<SavingsInvestmentTransaction, 'id' | 'createdAt' | 'updatedAt'> = {
      accountId: 'account-1',
      date: '2024-01-15',
      amount: 10000,
      destination: 'Mutual Fund ABC',
      type: 'SIP',
      status: 'Pending',
    };

    useSavingsInvestmentTransactionsStore.getState().createTransaction(transactionData);
    const transaction = useSavingsInvestmentTransactionsStore.getState().transactions[0];

    useSavingsInvestmentTransactionsStore.getState().updateTransaction(transaction.id, {
      amount: 12000,
      status: 'Completed',
      destination: 'Updated Fund XYZ',
    });

    const updatedTransaction = useSavingsInvestmentTransactionsStore.getState().getTransaction(transaction.id);
    expect(updatedTransaction?.amount).toBe(12000);
    expect(updatedTransaction?.status).toBe('Completed');
    expect(updatedTransaction?.destination).toBe('Updated Fund XYZ');
    expect(updatedTransaction?.updatedAt).toBeDefined();
  });

  it('should throw error when updating transaction with invalid accountId', () => {
    const transactionData: Omit<SavingsInvestmentTransaction, 'id' | 'createdAt' | 'updatedAt'> = {
      accountId: 'account-1',
      date: '2024-01-15',
      amount: 10000,
      destination: 'Mutual Fund ABC',
      type: 'SIP',
      status: 'Pending',
    };

    useSavingsInvestmentTransactionsStore.getState().createTransaction(transactionData);
    const transaction = useSavingsInvestmentTransactionsStore.getState().transactions[0];

    expect(() => {
      useSavingsInvestmentTransactionsStore.getState().updateTransaction(transaction.id, {
        accountId: 'invalid-account',
      });
    }).toThrow('Account with id invalid-account does not exist');
  });

  it('should delete a savings/investment transaction', () => {
    const transactionData: Omit<SavingsInvestmentTransaction, 'id' | 'createdAt' | 'updatedAt'> = {
      accountId: 'account-1',
      date: '2024-01-15',
      amount: 10000,
      destination: 'Mutual Fund ABC',
      type: 'SIP',
      status: 'Pending',
    };

    useSavingsInvestmentTransactionsStore.getState().createTransaction(transactionData);
    const transaction = useSavingsInvestmentTransactionsStore.getState().transactions[0];
    expect(useSavingsInvestmentTransactionsStore.getState().transactions).toHaveLength(1);

    useSavingsInvestmentTransactionsStore.getState().deleteTransaction(transaction.id);

    expect(useSavingsInvestmentTransactionsStore.getState().transactions).toHaveLength(0);
    expect(useSavingsInvestmentTransactionsStore.getState().getTransaction(transaction.id)).toBeUndefined();
  });

  it('should get transactions by account', () => {
    const transaction1: Omit<SavingsInvestmentTransaction, 'id' | 'createdAt' | 'updatedAt'> = {
      accountId: 'account-1',
      date: '2024-01-15',
      amount: 10000,
      destination: 'Mutual Fund ABC',
      type: 'SIP',
      status: 'Pending',
    };

    const transaction2: Omit<SavingsInvestmentTransaction, 'id' | 'createdAt' | 'updatedAt'> = {
      accountId: 'account-2',
      date: '2024-01-15',
      amount: 5000,
      destination: 'Mutual Fund XYZ',
      type: 'LumpSum',
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

    useSavingsInvestmentTransactionsStore.getState().createTransaction(transaction1);
    useSavingsInvestmentTransactionsStore.getState().createTransaction(transaction2);

    const accountTransactions = useSavingsInvestmentTransactionsStore.getState().getTransactionsByAccount('account-1');
    expect(accountTransactions).toHaveLength(1);
    expect(accountTransactions[0].accountId).toBe('account-1');
  });

  it('should get transactions by date range', () => {
    const transaction1: Omit<SavingsInvestmentTransaction, 'id' | 'createdAt' | 'updatedAt'> = {
      accountId: 'account-1',
      date: '2024-01-15',
      amount: 10000,
      destination: 'Mutual Fund ABC',
      type: 'SIP',
      status: 'Pending',
    };

    const transaction2: Omit<SavingsInvestmentTransaction, 'id' | 'createdAt' | 'updatedAt'> = {
      accountId: 'account-1',
      date: '2024-02-15',
      amount: 10000,
      destination: 'Mutual Fund ABC',
      type: 'SIP',
      status: 'Pending',
    };

    useSavingsInvestmentTransactionsStore.getState().createTransaction(transaction1);
    useSavingsInvestmentTransactionsStore.getState().createTransaction(transaction2);

    const janTransactions = useSavingsInvestmentTransactionsStore.getState().getTransactionsByDateRange('2024-01-01', '2024-01-31');
    expect(janTransactions).toHaveLength(1);
    expect(janTransactions[0].date).toBe('2024-01-15');
  });

  it('should get transactions by type', () => {
    const transaction1: Omit<SavingsInvestmentTransaction, 'id' | 'createdAt' | 'updatedAt'> = {
      accountId: 'account-1',
      date: '2024-01-15',
      amount: 10000,
      destination: 'Mutual Fund ABC',
      type: 'SIP',
      status: 'Pending',
    };

    const transaction2: Omit<SavingsInvestmentTransaction, 'id' | 'createdAt' | 'updatedAt'> = {
      accountId: 'account-1',
      date: '2024-01-15',
      amount: 50000,
      destination: 'Mutual Fund XYZ',
      type: 'LumpSum',
      status: 'Pending',
    };

    useSavingsInvestmentTransactionsStore.getState().createTransaction(transaction1);
    useSavingsInvestmentTransactionsStore.getState().createTransaction(transaction2);

    const sipTransactions = useSavingsInvestmentTransactionsStore.getState().getTransactionsByType('SIP');
    expect(sipTransactions).toHaveLength(1);
    expect(sipTransactions[0].type).toBe('SIP');
  });

  it('should get transactions by destination', () => {
    const transaction1: Omit<SavingsInvestmentTransaction, 'id' | 'createdAt' | 'updatedAt'> = {
      accountId: 'account-1',
      date: '2024-01-15',
      amount: 10000,
      destination: 'Mutual Fund ABC',
      type: 'SIP',
      status: 'Pending',
    };

    const transaction2: Omit<SavingsInvestmentTransaction, 'id' | 'createdAt' | 'updatedAt'> = {
      accountId: 'account-1',
      date: '2024-01-20',
      amount: 10000,
      destination: 'Mutual Fund XYZ',
      type: 'SIP',
      status: 'Pending',
    };

    useSavingsInvestmentTransactionsStore.getState().createTransaction(transaction1);
    useSavingsInvestmentTransactionsStore.getState().createTransaction(transaction2);

    const abcTransactions = useSavingsInvestmentTransactionsStore.getState().getTransactionsByDestination('Mutual Fund ABC');
    expect(abcTransactions).toHaveLength(1);
    expect(abcTransactions[0].destination).toBe('Mutual Fund ABC');
  });

  it('should calculate total by month', () => {
    const transaction1: Omit<SavingsInvestmentTransaction, 'id' | 'createdAt' | 'updatedAt'> = {
      accountId: 'account-1',
      date: '2024-01-15',
      amount: 10000,
      destination: 'Mutual Fund ABC',
      type: 'SIP',
      status: 'Pending',
    };

    const transaction2: Omit<SavingsInvestmentTransaction, 'id' | 'createdAt' | 'updatedAt'> = {
      accountId: 'account-1',
      date: '2024-01-20',
      amount: 5000,
      destination: 'Mutual Fund XYZ',
      type: 'LumpSum',
      status: 'Pending',
    };

    useSavingsInvestmentTransactionsStore.getState().createTransaction(transaction1);
    useSavingsInvestmentTransactionsStore.getState().createTransaction(transaction2);

    const total = useSavingsInvestmentTransactionsStore.getState().getTotalByMonth('2024-01');
    expect(total).toBe(15000);
  });

  it('should calculate total by account', () => {
    const transaction1: Omit<SavingsInvestmentTransaction, 'id' | 'createdAt' | 'updatedAt'> = {
      accountId: 'account-1',
      date: '2024-01-15',
      amount: 10000,
      destination: 'Mutual Fund ABC',
      type: 'SIP',
      status: 'Pending',
    };

    const transaction2: Omit<SavingsInvestmentTransaction, 'id' | 'createdAt' | 'updatedAt'> = {
      accountId: 'account-1',
      date: '2024-02-15',
      amount: 10000,
      destination: 'Mutual Fund ABC',
      type: 'SIP',
      status: 'Pending',
    };

    useSavingsInvestmentTransactionsStore.getState().createTransaction(transaction1);
    useSavingsInvestmentTransactionsStore.getState().createTransaction(transaction2);

    const total = useSavingsInvestmentTransactionsStore.getState().getTotalByAccount('account-1');
    expect(total).toBe(20000);
  });

  it('should calculate total savings transfer by account', () => {
    const transaction1: Omit<SavingsInvestmentTransaction, 'id' | 'createdAt' | 'updatedAt'> = {
      accountId: 'account-1',
      date: '2024-01-15',
      amount: 10000,
      destination: 'Mutual Fund ABC',
      type: 'SIP',
      status: 'Pending',
    };

    const transaction2: Omit<SavingsInvestmentTransaction, 'id' | 'createdAt' | 'updatedAt'> = {
      accountId: 'account-1',
      date: '2024-01-20',
      amount: 5000,
      destination: 'Mutual Fund XYZ',
      type: 'LumpSum',
      status: 'Pending',
    };

    useSavingsInvestmentTransactionsStore.getState().createTransaction(transaction1);
    useSavingsInvestmentTransactionsStore.getState().createTransaction(transaction2);

    const total = useSavingsInvestmentTransactionsStore.getState().getTotalSavingsTransfer('account-1');
    expect(total).toBe(15000);
  });

  it('should calculate total savings transfer by account for specific month', () => {
    const transaction1: Omit<SavingsInvestmentTransaction, 'id' | 'createdAt' | 'updatedAt'> = {
      accountId: 'account-1',
      date: '2024-01-15',
      amount: 10000,
      destination: 'Mutual Fund ABC',
      type: 'SIP',
      status: 'Pending',
    };

    const transaction2: Omit<SavingsInvestmentTransaction, 'id' | 'createdAt' | 'updatedAt'> = {
      accountId: 'account-1',
      date: '2024-02-15',
      amount: 10000,
      destination: 'Mutual Fund ABC',
      type: 'SIP',
      status: 'Pending',
    };

    useSavingsInvestmentTransactionsStore.getState().createTransaction(transaction1);
    useSavingsInvestmentTransactionsStore.getState().createTransaction(transaction2);

    const janTotal = useSavingsInvestmentTransactionsStore.getState().getTotalSavingsTransfer('account-1', '2024-01');
    expect(janTotal).toBe(10000);
  });
});

