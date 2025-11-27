import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useSavingsInvestmentEMIsStore } from '../useSavingsInvestmentEMIsStore';
import { useBankAccountsStore } from '../useBankAccountsStore';
import { useSavingsInvestmentTransactionsStore } from '../useSavingsInvestmentTransactionsStore';
import type { SavingsInvestmentEMI } from '../../types/emis';
import type { BankAccount } from '../../types/bankAccounts';

// Mock dependencies
vi.mock('../useBankAccountsStore', () => ({
  useBankAccountsStore: {
    getState: vi.fn(),
  },
}));

vi.mock('../useSavingsInvestmentTransactionsStore', () => ({
  useSavingsInvestmentTransactionsStore: {
    getState: vi.fn(),
  },
}));

describe('useSavingsInvestmentEMIsStore', () => {
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
    useSavingsInvestmentEMIsStore.setState({ emis: [] });
    
    // Setup default mocks
    vi.mocked(useBankAccountsStore.getState).mockReturnValue({
      getAccount: vi.fn((id: string) => {
        if (id === 'account-1') return mockAccount;
        return undefined;
      }),
      updateAccountBalance: vi.fn(),
    } as any);

    vi.mocked(useSavingsInvestmentTransactionsStore.getState).mockReturnValue({
      transactions: [],
      createTransaction: vi.fn(),
      getTransactionsByAccount: vi.fn(() => []),
    } as any);
  });

  it('should create a savings/investment EMI', () => {
    // Use a future date to avoid auto-generation during test
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);
    const startDate = futureDate.toISOString().split('T')[0];
    futureDate.setMonth(futureDate.getMonth() + 12);
    const endDate = futureDate.toISOString().split('T')[0];

    const emiData: Omit<SavingsInvestmentEMI, 'id' | 'createdAt' | 'updatedAt' | 'completedInstallments'> = {
      name: 'SIP EMI',
      startDate,
      endDate,
      amount: 10000,
      accountId: 'account-1',
      destination: 'Mutual Fund ABC',
      frequency: 'Monthly',
      status: 'Active',
      totalInstallments: 12,
    };

    useSavingsInvestmentEMIsStore.getState().createEMI(emiData);

    const emis = useSavingsInvestmentEMIsStore.getState().emis;
    expect(emis).toHaveLength(1);
    expect(emis[0].name).toBe('SIP EMI');
    expect(emis[0].amount).toBe(10000);
    expect(emis[0].destination).toBe('Mutual Fund ABC');
    expect(emis[0].totalInstallments).toBe(12);
    expect(emis[0].completedInstallments).toBe(0);
    expect(emis[0].id).toBeDefined();
    expect(emis[0].createdAt).toBeDefined();
    expect(emis[0].updatedAt).toBeDefined();
  });

  it('should throw error when creating EMI with invalid accountId', () => {
    const emiData: Omit<SavingsInvestmentEMI, 'id' | 'createdAt' | 'updatedAt' | 'completedInstallments'> = {
      name: 'SIP EMI',
      startDate: '2024-01-01',
      endDate: '2024-12-01',
      amount: 10000,
      accountId: 'invalid-account',
      destination: 'Mutual Fund ABC',
      frequency: 'Monthly',
      status: 'Active',
      totalInstallments: 12,
    };

    expect(() => {
      useSavingsInvestmentEMIsStore.getState().createEMI(emiData);
    }).toThrow('Account with id invalid-account does not exist');
  });

  it('should throw error when creating EMI with invalid date range', () => {
    const emiData: Omit<SavingsInvestmentEMI, 'id' | 'createdAt' | 'updatedAt' | 'completedInstallments'> = {
      name: 'SIP EMI',
      startDate: '2024-12-01',
      endDate: '2024-01-01', // End date before start date
      amount: 10000,
      accountId: 'account-1',
      destination: 'Mutual Fund ABC',
      frequency: 'Monthly',
      status: 'Active',
      totalInstallments: 12,
    };

    expect(() => {
      useSavingsInvestmentEMIsStore.getState().createEMI(emiData);
    }).toThrow('Date validation failed');
  });

  it('should throw error when creating EMI with invalid amount', () => {
    const emiData: Omit<SavingsInvestmentEMI, 'id' | 'createdAt' | 'updatedAt' | 'completedInstallments'> = {
      name: 'SIP EMI',
      startDate: '2024-01-01',
      endDate: '2024-12-01',
      amount: -100,
      accountId: 'account-1',
      destination: 'Mutual Fund ABC',
      frequency: 'Monthly',
      status: 'Active',
      totalInstallments: 12,
    };

    expect(() => {
      useSavingsInvestmentEMIsStore.getState().createEMI(emiData);
    }).toThrow('Amount validation failed');
  });

  it('should throw error when creating EMI with invalid totalInstallments', () => {
    const emiData: Omit<SavingsInvestmentEMI, 'id' | 'createdAt' | 'updatedAt' | 'completedInstallments'> = {
      name: 'SIP EMI',
      startDate: '2024-01-01',
      endDate: '2024-12-01',
      amount: 10000,
      accountId: 'account-1',
      destination: 'Mutual Fund ABC',
      frequency: 'Monthly',
      status: 'Active',
      totalInstallments: 0, // Invalid
    };

    expect(() => {
      useSavingsInvestmentEMIsStore.getState().createEMI(emiData);
    }).toThrow('Total installments must be greater than 0');
  });

  it('should throw error when creating EMI with non-integer totalInstallments', () => {
    const emiData: Omit<SavingsInvestmentEMI, 'id' | 'createdAt' | 'updatedAt' | 'completedInstallments'> = {
      name: 'SIP EMI',
      startDate: '2024-01-01',
      endDate: '2024-12-01',
      amount: 10000,
      accountId: 'account-1',
      destination: 'Mutual Fund ABC',
      frequency: 'Monthly',
      status: 'Active',
      totalInstallments: 12.5, // Invalid
    };

    expect(() => {
      useSavingsInvestmentEMIsStore.getState().createEMI(emiData);
    }).toThrow('Total installments must be an integer');
  });

  it('should update a savings/investment EMI', () => {
    // Use a future date to avoid auto-generation during test
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);
    const startDate = futureDate.toISOString().split('T')[0];
    futureDate.setMonth(futureDate.getMonth() + 12);
    const endDate = futureDate.toISOString().split('T')[0];

    const emiData: Omit<SavingsInvestmentEMI, 'id' | 'createdAt' | 'updatedAt' | 'completedInstallments'> = {
      name: 'SIP EMI',
      startDate,
      endDate,
      amount: 10000,
      accountId: 'account-1',
      destination: 'Mutual Fund ABC',
      frequency: 'Monthly',
      status: 'Active',
      totalInstallments: 12,
    };

    useSavingsInvestmentEMIsStore.getState().createEMI(emiData);
    const emi = useSavingsInvestmentEMIsStore.getState().emis[0];

    useSavingsInvestmentEMIsStore.getState().updateEMI(emi.id, {
      amount: 12000,
      name: 'Updated SIP EMI',
      destination: 'Mutual Fund XYZ',
    });

    const updatedEMI = useSavingsInvestmentEMIsStore.getState().getEMI(emi.id);
    expect(updatedEMI?.amount).toBe(12000);
    expect(updatedEMI?.name).toBe('Updated SIP EMI');
    expect(updatedEMI?.destination).toBe('Mutual Fund XYZ');
    expect(updatedEMI?.updatedAt).toBeDefined();
  });

  it('should throw error when updating EMI with invalid accountId', () => {
    // Use a future date to avoid auto-generation during test
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);
    const startDate = futureDate.toISOString().split('T')[0];
    futureDate.setMonth(futureDate.getMonth() + 12);
    const endDate = futureDate.toISOString().split('T')[0];

    const emiData: Omit<SavingsInvestmentEMI, 'id' | 'createdAt' | 'updatedAt' | 'completedInstallments'> = {
      name: 'SIP EMI',
      startDate,
      endDate,
      amount: 10000,
      accountId: 'account-1',
      destination: 'Mutual Fund ABC',
      frequency: 'Monthly',
      status: 'Active',
      totalInstallments: 12,
    };

    useSavingsInvestmentEMIsStore.getState().createEMI(emiData);
    const emi = useSavingsInvestmentEMIsStore.getState().emis[0];

    expect(() => {
      useSavingsInvestmentEMIsStore.getState().updateEMI(emi.id, {
        accountId: 'invalid-account',
      });
    }).toThrow('Account with id invalid-account does not exist');
  });

  it('should delete a savings/investment EMI', () => {
    // Use a future date to avoid auto-generation during test
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);
    const startDate = futureDate.toISOString().split('T')[0];
    futureDate.setMonth(futureDate.getMonth() + 12);
    const endDate = futureDate.toISOString().split('T')[0];

    const emiData: Omit<SavingsInvestmentEMI, 'id' | 'createdAt' | 'updatedAt' | 'completedInstallments'> = {
      name: 'SIP EMI',
      startDate,
      endDate,
      amount: 10000,
      accountId: 'account-1',
      destination: 'Mutual Fund ABC',
      frequency: 'Monthly',
      status: 'Active',
      totalInstallments: 12,
    };

    useSavingsInvestmentEMIsStore.getState().createEMI(emiData);
    const emi = useSavingsInvestmentEMIsStore.getState().emis[0];
    expect(useSavingsInvestmentEMIsStore.getState().emis).toHaveLength(1);

    useSavingsInvestmentEMIsStore.getState().deleteEMI(emi.id);

    expect(useSavingsInvestmentEMIsStore.getState().emis).toHaveLength(0);
    expect(useSavingsInvestmentEMIsStore.getState().getEMI(emi.id)).toBeUndefined();
  });

  it('should pause a savings/investment EMI', () => {
    // Use a future date to avoid auto-generation during test
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);
    const startDate = futureDate.toISOString().split('T')[0];
    futureDate.setMonth(futureDate.getMonth() + 12);
    const endDate = futureDate.toISOString().split('T')[0];

    const emiData: Omit<SavingsInvestmentEMI, 'id' | 'createdAt' | 'updatedAt' | 'completedInstallments'> = {
      name: 'SIP EMI',
      startDate,
      endDate,
      amount: 10000,
      accountId: 'account-1',
      destination: 'Mutual Fund ABC',
      frequency: 'Monthly',
      status: 'Active',
      totalInstallments: 12,
    };

    useSavingsInvestmentEMIsStore.getState().createEMI(emiData);
    const emi = useSavingsInvestmentEMIsStore.getState().emis[0];

    useSavingsInvestmentEMIsStore.getState().pauseEMI(emi.id);

    const pausedEMI = useSavingsInvestmentEMIsStore.getState().getEMI(emi.id);
    expect(pausedEMI?.status).toBe('Paused');
  });

  it('should resume a paused savings/investment EMI', () => {
    // Use a future date to avoid auto-generation during test
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);
    const startDate = futureDate.toISOString().split('T')[0];
    futureDate.setMonth(futureDate.getMonth() + 12);
    const endDate = futureDate.toISOString().split('T')[0];

    const emiData: Omit<SavingsInvestmentEMI, 'id' | 'createdAt' | 'updatedAt' | 'completedInstallments'> = {
      name: 'SIP EMI',
      startDate,
      endDate,
      amount: 10000,
      accountId: 'account-1',
      destination: 'Mutual Fund ABC',
      frequency: 'Monthly',
      status: 'Paused',
      totalInstallments: 12,
    };

    useSavingsInvestmentEMIsStore.getState().createEMI(emiData);
    const emi = useSavingsInvestmentEMIsStore.getState().emis[0];

    useSavingsInvestmentEMIsStore.getState().resumeEMI(emi.id);

    const resumedEMI = useSavingsInvestmentEMIsStore.getState().getEMI(emi.id);
    expect(resumedEMI?.status).toBe('Active');
  });

  it('should get active EMIs', () => {
    // Use a future date to avoid auto-generation during test
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);
    const startDate = futureDate.toISOString().split('T')[0];
    futureDate.setMonth(futureDate.getMonth() + 12);
    const endDate = futureDate.toISOString().split('T')[0];

    const emi1: Omit<SavingsInvestmentEMI, 'id' | 'createdAt' | 'updatedAt' | 'completedInstallments'> = {
      name: 'Active EMI',
      startDate,
      endDate,
      amount: 10000,
      accountId: 'account-1',
      destination: 'Mutual Fund ABC',
      frequency: 'Monthly',
      status: 'Active',
      totalInstallments: 12,
    };

    const emi2: Omit<SavingsInvestmentEMI, 'id' | 'createdAt' | 'updatedAt' | 'completedInstallments'> = {
      name: 'Paused EMI',
      startDate,
      endDate,
      amount: 5000,
      accountId: 'account-1',
      destination: 'Mutual Fund XYZ',
      frequency: 'Monthly',
      status: 'Paused',
      totalInstallments: 12,
    };

    useSavingsInvestmentEMIsStore.getState().createEMI(emi1);
    useSavingsInvestmentEMIsStore.getState().createEMI(emi2);

    const activeEMIs = useSavingsInvestmentEMIsStore.getState().getActiveEMIs();
    expect(activeEMIs).toHaveLength(1);
    expect(activeEMIs[0].status).toBe('Active');
  });

  it('should get EMIs by account', () => {
    // Use a future date to avoid auto-generation during test
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);
    const startDate = futureDate.toISOString().split('T')[0];
    futureDate.setMonth(futureDate.getMonth() + 12);
    const endDate = futureDate.toISOString().split('T')[0];

    const emi1: Omit<SavingsInvestmentEMI, 'id' | 'createdAt' | 'updatedAt' | 'completedInstallments'> = {
      name: 'EMI 1',
      startDate,
      endDate,
      amount: 10000,
      accountId: 'account-1',
      destination: 'Mutual Fund ABC',
      frequency: 'Monthly',
      status: 'Active',
      totalInstallments: 12,
    };

    const emi2: Omit<SavingsInvestmentEMI, 'id' | 'createdAt' | 'updatedAt' | 'completedInstallments'> = {
      name: 'EMI 2',
      startDate,
      endDate,
      amount: 5000,
      accountId: 'account-2',
      destination: 'Mutual Fund XYZ',
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

    useSavingsInvestmentEMIsStore.getState().createEMI(emi1);
    useSavingsInvestmentEMIsStore.getState().createEMI(emi2);

    const accountEMIs = useSavingsInvestmentEMIsStore.getState().getEMIsByAccount('account-1');
    expect(accountEMIs).toHaveLength(1);
    expect(accountEMIs[0].accountId).toBe('account-1');
  });

  it('should get EMIs by status', () => {
    // Use a future date to avoid auto-generation during test
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);
    const startDate = futureDate.toISOString().split('T')[0];
    futureDate.setMonth(futureDate.getMonth() + 12);
    const endDate = futureDate.toISOString().split('T')[0];

    const emi1: Omit<SavingsInvestmentEMI, 'id' | 'createdAt' | 'updatedAt' | 'completedInstallments'> = {
      name: 'Active EMI',
      startDate,
      endDate,
      amount: 10000,
      accountId: 'account-1',
      destination: 'Mutual Fund ABC',
      frequency: 'Monthly',
      status: 'Active',
      totalInstallments: 12,
    };

    const emi2: Omit<SavingsInvestmentEMI, 'id' | 'createdAt' | 'updatedAt' | 'completedInstallments'> = {
      name: 'Paused EMI',
      startDate,
      endDate,
      amount: 5000,
      accountId: 'account-1',
      destination: 'Mutual Fund XYZ',
      frequency: 'Monthly',
      status: 'Paused',
      totalInstallments: 12,
    };

    useSavingsInvestmentEMIsStore.getState().createEMI(emi1);
    useSavingsInvestmentEMIsStore.getState().createEMI(emi2);

    const pausedEMIs = useSavingsInvestmentEMIsStore.getState().getEMIsByStatus('Paused');
    expect(pausedEMIs).toHaveLength(1);
    expect(pausedEMIs[0].status).toBe('Paused');
  });

  it('should prevent deletion of EMI with associated transactions', () => {
    // Use a future date to avoid auto-generation during test
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);
    const startDate = futureDate.toISOString().split('T')[0];
    futureDate.setMonth(futureDate.getMonth() + 12);
    const endDate = futureDate.toISOString().split('T')[0];

    const emiData: Omit<SavingsInvestmentEMI, 'id' | 'createdAt' | 'updatedAt' | 'completedInstallments'> = {
      name: 'SIP EMI',
      startDate,
      endDate,
      amount: 10000,
      accountId: 'account-1',
      destination: 'Mutual Fund ABC',
      frequency: 'Monthly',
      status: 'Active',
      totalInstallments: 12,
    };

    useSavingsInvestmentEMIsStore.getState().createEMI(emiData);
    const emi = useSavingsInvestmentEMIsStore.getState().emis[0];

    // Mock transactions that reference this EMI
    vi.mocked(useSavingsInvestmentTransactionsStore.getState).mockReturnValue({
      transactions: [
        {
          id: 'txn-1',
          emiId: emi.id,
          accountId: 'account-1',
          date: '2024-01-01',
          amount: 10000,
          destination: 'Mutual Fund ABC',
          type: 'SIP',
          status: 'Pending',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
      ],
      createTransaction: vi.fn(),
      getTransactionsByAccount: vi.fn(() => []),
    } as any);

    expect(() => {
      useSavingsInvestmentEMIsStore.getState().deleteEMI(emi.id);
    }).toThrow('Cannot delete EMI');
  });
});

