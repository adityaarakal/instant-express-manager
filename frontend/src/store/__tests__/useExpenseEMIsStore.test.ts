import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useExpenseEMIsStore } from '../useExpenseEMIsStore';
import { useBankAccountsStore } from '../useBankAccountsStore';
import { useExpenseTransactionsStore } from '../useExpenseTransactionsStore';
import type { ExpenseEMI } from '../../types/emis';
import type { BankAccount } from '../../types/bankAccounts';

// Mock dependencies
vi.mock('../useBankAccountsStore', () => ({
  useBankAccountsStore: {
    getState: vi.fn(),
  },
}));

vi.mock('../useExpenseTransactionsStore', () => ({
  useExpenseTransactionsStore: {
    getState: vi.fn(),
  },
}));

describe('useExpenseEMIsStore', () => {
  const mockAccount: BankAccount = {
    id: 'account-1',
    name: 'Test Account',
    bankId: 'bank-1',
    accountType: 'Savings',
    currentBalance: 1000,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  };

  const mockCreditCard: BankAccount = {
    id: 'cc-1',
    name: 'Credit Card',
    bankId: 'bank-1',
    accountType: 'CreditCard',
    currentBalance: -5000,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  };

  beforeEach(() => {
    // Reset store before each test
    useExpenseEMIsStore.setState({ emis: [] });
    
    // Setup default mocks
    vi.mocked(useBankAccountsStore.getState).mockReturnValue({
      getAccount: vi.fn((id: string) => {
        if (id === 'account-1') return mockAccount;
        if (id === 'cc-1') return mockCreditCard;
        return undefined;
      }),
      updateAccountBalance: vi.fn(),
    } as any);

    vi.mocked(useExpenseTransactionsStore.getState).mockReturnValue({
      transactions: [],
      createTransaction: vi.fn(),
      getTransactionsByAccount: vi.fn(() => []),
    } as any);
  });

  it('should create an expense EMI', () => {
    // Use a future date to avoid auto-generation during test
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);
    const startDate = futureDate.toISOString().split('T')[0];
    futureDate.setMonth(futureDate.getMonth() + 12);
    const endDate = futureDate.toISOString().split('T')[0];

    const emiData: Omit<ExpenseEMI, 'id' | 'createdAt' | 'updatedAt' | 'completedInstallments'> = {
      name: 'Home Loan EMI',
      startDate,
      endDate,
      amount: 5000,
      accountId: 'account-1',
      category: 'Loan',
      frequency: 'Monthly',
      status: 'Active',
      totalInstallments: 12,
    };

    useExpenseEMIsStore.getState().createEMI(emiData);

    const emis = useExpenseEMIsStore.getState().emis;
    expect(emis).toHaveLength(1);
    expect(emis[0].name).toBe('Home Loan EMI');
    expect(emis[0].amount).toBe(5000);
    expect(emis[0].category).toBe('Loan');
    expect(emis[0].totalInstallments).toBe(12);
    expect(emis[0].completedInstallments).toBe(0);
    expect(emis[0].id).toBeDefined();
    expect(emis[0].createdAt).toBeDefined();
    expect(emis[0].updatedAt).toBeDefined();
  });

  it('should throw error when creating EMI with invalid accountId', () => {
    const emiData: Omit<ExpenseEMI, 'id' | 'createdAt' | 'updatedAt' | 'completedInstallments'> = {
      name: 'Home Loan EMI',
      startDate: '2024-01-01',
      endDate: '2024-12-01',
      amount: 5000,
      accountId: 'invalid-account',
      category: 'Loan',
      frequency: 'Monthly',
      status: 'Active',
      totalInstallments: 12,
    };

    expect(() => {
      useExpenseEMIsStore.getState().createEMI(emiData);
    }).toThrow('Account with id invalid-account does not exist');
  });

  it('should throw error when creating CC EMI with invalid creditCardId', () => {
    const emiData: Omit<ExpenseEMI, 'id' | 'createdAt' | 'updatedAt' | 'completedInstallments'> = {
      name: 'CC EMI',
      startDate: '2024-01-01',
      endDate: '2024-12-01',
      amount: 5000,
      accountId: 'account-1',
      category: 'CCEMI',
      creditCardId: 'invalid-cc',
      frequency: 'Monthly',
      status: 'Active',
      totalInstallments: 12,
    };

    expect(() => {
      useExpenseEMIsStore.getState().createEMI(emiData);
    }).toThrow('Credit card account with id invalid-cc does not exist');
  });

  it('should throw error when creating CC EMI with non-credit-card account', () => {
    const emiData: Omit<ExpenseEMI, 'id' | 'createdAt' | 'updatedAt' | 'completedInstallments'> = {
      name: 'CC EMI',
      startDate: '2024-01-01',
      endDate: '2024-12-01',
      amount: 5000,
      accountId: 'account-1',
      category: 'CCEMI',
      creditCardId: 'account-1', // This is a Savings account, not CreditCard
      frequency: 'Monthly',
      status: 'Active',
      totalInstallments: 12,
    };

    expect(() => {
      useExpenseEMIsStore.getState().createEMI(emiData);
    }).toThrow('creditCardId must reference a CreditCard account');
  });

  it('should throw error when creating EMI with invalid date range', () => {
    const emiData: Omit<ExpenseEMI, 'id' | 'createdAt' | 'updatedAt' | 'completedInstallments'> = {
      name: 'Home Loan EMI',
      startDate: '2024-12-01',
      endDate: '2024-01-01', // End date before start date
      amount: 5000,
      accountId: 'account-1',
      category: 'Loan',
      frequency: 'Monthly',
      status: 'Active',
      totalInstallments: 12,
    };

    expect(() => {
      useExpenseEMIsStore.getState().createEMI(emiData);
    }).toThrow('Date validation failed');
  });

  it('should throw error when creating EMI with invalid amount', () => {
    const emiData: Omit<ExpenseEMI, 'id' | 'createdAt' | 'updatedAt' | 'completedInstallments'> = {
      name: 'Home Loan EMI',
      startDate: '2024-01-01',
      endDate: '2024-12-01',
      amount: -100,
      accountId: 'account-1',
      category: 'Loan',
      frequency: 'Monthly',
      status: 'Active',
      totalInstallments: 12,
    };

    expect(() => {
      useExpenseEMIsStore.getState().createEMI(emiData);
    }).toThrow('Amount validation failed');
  });

  it('should throw error when creating EMI with invalid totalInstallments', () => {
    const emiData: Omit<ExpenseEMI, 'id' | 'createdAt' | 'updatedAt' | 'completedInstallments'> = {
      name: 'Home Loan EMI',
      startDate: '2024-01-01',
      endDate: '2024-12-01',
      amount: 5000,
      accountId: 'account-1',
      category: 'Loan',
      frequency: 'Monthly',
      status: 'Active',
      totalInstallments: 0, // Invalid
    };

    expect(() => {
      useExpenseEMIsStore.getState().createEMI(emiData);
    }).toThrow('Total installments must be greater than 0');
  });

  it('should throw error when creating EMI with non-integer totalInstallments', () => {
    const emiData: Omit<ExpenseEMI, 'id' | 'createdAt' | 'updatedAt' | 'completedInstallments'> = {
      name: 'Home Loan EMI',
      startDate: '2024-01-01',
      endDate: '2024-12-01',
      amount: 5000,
      accountId: 'account-1',
      category: 'Loan',
      frequency: 'Monthly',
      status: 'Active',
      totalInstallments: 12.5, // Invalid
    };

    expect(() => {
      useExpenseEMIsStore.getState().createEMI(emiData);
    }).toThrow('Total installments must be an integer');
  });

  it('should update an expense EMI', () => {
    const emiData: Omit<ExpenseEMI, 'id' | 'createdAt' | 'updatedAt' | 'completedInstallments'> = {
      name: 'Home Loan EMI',
      startDate: '2024-01-01',
      endDate: '2024-12-01',
      amount: 5000,
      accountId: 'account-1',
      category: 'Loan',
      frequency: 'Monthly',
      status: 'Active',
      totalInstallments: 12,
    };

    useExpenseEMIsStore.getState().createEMI(emiData);
    const emi = useExpenseEMIsStore.getState().emis[0];

    useExpenseEMIsStore.getState().updateEMI(emi.id, {
      amount: 6000,
      name: 'Updated Loan EMI',
    });

    const updatedEMI = useExpenseEMIsStore.getState().getEMI(emi.id);
    expect(updatedEMI?.amount).toBe(6000);
    expect(updatedEMI?.name).toBe('Updated Loan EMI');
    expect(updatedEMI?.updatedAt).toBeDefined();
  });

  it('should throw error when updating EMI with invalid accountId', () => {
    const emiData: Omit<ExpenseEMI, 'id' | 'createdAt' | 'updatedAt' | 'completedInstallments'> = {
      name: 'Home Loan EMI',
      startDate: '2024-01-01',
      endDate: '2024-12-01',
      amount: 5000,
      accountId: 'account-1',
      category: 'Loan',
      frequency: 'Monthly',
      status: 'Active',
      totalInstallments: 12,
    };

    useExpenseEMIsStore.getState().createEMI(emiData);
    const emi = useExpenseEMIsStore.getState().emis[0];

    expect(() => {
      useExpenseEMIsStore.getState().updateEMI(emi.id, {
        accountId: 'invalid-account',
      });
    }).toThrow('Account with id invalid-account does not exist');
  });

  it('should delete an expense EMI', () => {
    const emiData: Omit<ExpenseEMI, 'id' | 'createdAt' | 'updatedAt' | 'completedInstallments'> = {
      name: 'Home Loan EMI',
      startDate: '2024-01-01',
      endDate: '2024-12-01',
      amount: 5000,
      accountId: 'account-1',
      category: 'Loan',
      frequency: 'Monthly',
      status: 'Active',
      totalInstallments: 12,
    };

    useExpenseEMIsStore.getState().createEMI(emiData);
    const emi = useExpenseEMIsStore.getState().emis[0];
    expect(useExpenseEMIsStore.getState().emis).toHaveLength(1);

    useExpenseEMIsStore.getState().deleteEMI(emi.id);

    expect(useExpenseEMIsStore.getState().emis).toHaveLength(0);
    expect(useExpenseEMIsStore.getState().getEMI(emi.id)).toBeUndefined();
  });

  it('should pause an expense EMI', () => {
    const emiData: Omit<ExpenseEMI, 'id' | 'createdAt' | 'updatedAt' | 'completedInstallments'> = {
      name: 'Home Loan EMI',
      startDate: '2024-01-01',
      endDate: '2024-12-01',
      amount: 5000,
      accountId: 'account-1',
      category: 'Loan',
      frequency: 'Monthly',
      status: 'Active',
      totalInstallments: 12,
    };

    useExpenseEMIsStore.getState().createEMI(emiData);
    const emi = useExpenseEMIsStore.getState().emis[0];

    useExpenseEMIsStore.getState().pauseEMI(emi.id);

    const pausedEMI = useExpenseEMIsStore.getState().getEMI(emi.id);
    expect(pausedEMI?.status).toBe('Paused');
  });

  it('should resume a paused expense EMI', () => {
    const emiData: Omit<ExpenseEMI, 'id' | 'createdAt' | 'updatedAt' | 'completedInstallments'> = {
      name: 'Home Loan EMI',
      startDate: '2024-01-01',
      endDate: '2024-12-01',
      amount: 5000,
      accountId: 'account-1',
      category: 'Loan',
      frequency: 'Monthly',
      status: 'Paused',
      totalInstallments: 12,
    };

    useExpenseEMIsStore.getState().createEMI(emiData);
    const emi = useExpenseEMIsStore.getState().emis[0];

    useExpenseEMIsStore.getState().resumeEMI(emi.id);

    const resumedEMI = useExpenseEMIsStore.getState().getEMI(emi.id);
    expect(resumedEMI?.status).toBe('Active');
  });

  it('should get active EMIs', () => {
    const emi1: Omit<ExpenseEMI, 'id' | 'createdAt' | 'updatedAt' | 'completedInstallments'> = {
      name: 'Active EMI',
      startDate: '2024-01-01',
      endDate: '2024-12-01',
      amount: 5000,
      accountId: 'account-1',
      category: 'Loan',
      frequency: 'Monthly',
      status: 'Active',
      totalInstallments: 12,
    };

    const emi2: Omit<ExpenseEMI, 'id' | 'createdAt' | 'updatedAt' | 'completedInstallments'> = {
      name: 'Paused EMI',
      startDate: '2024-01-01',
      endDate: '2024-12-01',
      amount: 3000,
      accountId: 'account-1',
      category: 'Loan',
      frequency: 'Monthly',
      status: 'Paused',
      totalInstallments: 12,
    };

    useExpenseEMIsStore.getState().createEMI(emi1);
    useExpenseEMIsStore.getState().createEMI(emi2);

    const activeEMIs = useExpenseEMIsStore.getState().getActiveEMIs();
    expect(activeEMIs).toHaveLength(1);
    expect(activeEMIs[0].status).toBe('Active');
  });

  it('should get EMIs by account', () => {
    const emi1: Omit<ExpenseEMI, 'id' | 'createdAt' | 'updatedAt' | 'completedInstallments'> = {
      name: 'EMI 1',
      startDate: '2024-01-01',
      endDate: '2024-12-01',
      amount: 5000,
      accountId: 'account-1',
      category: 'Loan',
      frequency: 'Monthly',
      status: 'Active',
      totalInstallments: 12,
    };

    const emi2: Omit<ExpenseEMI, 'id' | 'createdAt' | 'updatedAt' | 'completedInstallments'> = {
      name: 'EMI 2',
      startDate: '2024-01-01',
      endDate: '2024-12-01',
      amount: 3000,
      accountId: 'account-2',
      category: 'Loan',
      frequency: 'Monthly',
      status: 'Active',
      totalInstallments: 12,
    };

    // Mock account-2
    vi.mocked(useBankAccountsStore.getState).mockReturnValue({
      getAccount: vi.fn((id: string) => {
        if (id === 'account-1') return mockAccount;
        if (id === 'account-2') return { ...mockAccount, id: 'account-2' };
        return undefined;
      }),
      updateAccountBalance: vi.fn(),
    } as any);

    useExpenseEMIsStore.getState().createEMI(emi1);
    useExpenseEMIsStore.getState().createEMI(emi2);

    const accountEMIs = useExpenseEMIsStore.getState().getEMIsByAccount('account-1');
    expect(accountEMIs).toHaveLength(1);
    expect(accountEMIs[0].accountId).toBe('account-1');
  });

  it('should get EMIs by status', () => {
    const emi1: Omit<ExpenseEMI, 'id' | 'createdAt' | 'updatedAt' | 'completedInstallments'> = {
      name: 'Active EMI',
      startDate: '2024-01-01',
      endDate: '2024-12-01',
      amount: 5000,
      accountId: 'account-1',
      category: 'Loan',
      frequency: 'Monthly',
      status: 'Active',
      totalInstallments: 12,
    };

    const emi2: Omit<ExpenseEMI, 'id' | 'createdAt' | 'updatedAt' | 'completedInstallments'> = {
      name: 'Paused EMI',
      startDate: '2024-01-01',
      endDate: '2024-12-01',
      amount: 3000,
      accountId: 'account-1',
      category: 'Loan',
      frequency: 'Monthly',
      status: 'Paused',
      totalInstallments: 12,
    };

    useExpenseEMIsStore.getState().createEMI(emi1);
    useExpenseEMIsStore.getState().createEMI(emi2);

    const pausedEMIs = useExpenseEMIsStore.getState().getEMIsByStatus('Paused');
    expect(pausedEMIs).toHaveLength(1);
    expect(pausedEMIs[0].status).toBe('Paused');
  });

  it('should prevent deletion of EMI with associated transactions', () => {
    const emiData: Omit<ExpenseEMI, 'id' | 'createdAt' | 'updatedAt' | 'completedInstallments'> = {
      name: 'Home Loan EMI',
      startDate: '2024-01-01',
      endDate: '2024-12-01',
      amount: 5000,
      accountId: 'account-1',
      category: 'Loan',
      frequency: 'Monthly',
      status: 'Active',
      totalInstallments: 12,
    };

    useExpenseEMIsStore.getState().createEMI(emiData);
    const emi = useExpenseEMIsStore.getState().emis[0];

    // Mock transactions that reference this EMI
    vi.mocked(useExpenseTransactionsStore.getState).mockReturnValue({
      transactions: [
        {
          id: 'txn-1',
          emiId: emi.id,
          accountId: 'account-1',
          date: '2024-01-01',
          amount: 5000,
          category: 'Other',
          description: 'EMI Payment',
          bucket: 'Expense',
          status: 'Paid',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
      ],
      getTransactionsByAccount: vi.fn(() => []),
    } as any);

    expect(() => {
      useExpenseEMIsStore.getState().deleteEMI(emi.id);
    }).toThrow('Cannot delete EMI');
  });
});

