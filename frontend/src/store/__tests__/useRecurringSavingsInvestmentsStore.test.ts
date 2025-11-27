import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useRecurringSavingsInvestmentsStore } from '../useRecurringSavingsInvestmentsStore';
import { useBankAccountsStore } from '../useBankAccountsStore';
import { useSavingsInvestmentTransactionsStore } from '../useSavingsInvestmentTransactionsStore';
import type { RecurringSavingsInvestment } from '../../types/recurring';
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

describe('useRecurringSavingsInvestmentsStore', () => {
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
    useRecurringSavingsInvestmentsStore.setState({ templates: [] });
    
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
    } as any);
  });

  it('should create a recurring savings/investment template', () => {
    // Use a future date to avoid auto-generation during test
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);
    const startDate = futureDate.toISOString().split('T')[0];

    const templateData: Omit<RecurringSavingsInvestment, 'id' | 'createdAt' | 'updatedAt' | 'nextDueDate'> = {
      name: 'Monthly SIP',
      startDate,
      amount: 10000,
      accountId: 'account-1',
      type: 'Investment',
      destination: 'Mutual Fund',
      frequency: 'Monthly',
      status: 'Active',
    };

    useRecurringSavingsInvestmentsStore.getState().createTemplate(templateData);

    const templates = useRecurringSavingsInvestmentsStore.getState().templates;
    expect(templates).toHaveLength(1);
    expect(templates[0].name).toBe('Monthly SIP');
    expect(templates[0].amount).toBe(10000);
    expect(templates[0].type).toBe('Investment');
    expect(templates[0].destination).toBe('Mutual Fund');
    expect(templates[0].frequency).toBe('Monthly');
    expect(templates[0].status).toBe('Active');
    expect(templates[0].nextDueDate).toBe(startDate);
    expect(templates[0].id).toBeDefined();
    expect(templates[0].createdAt).toBeDefined();
    expect(templates[0].updatedAt).toBeDefined();
  });

  it('should throw error when creating template with invalid accountId', () => {
    const templateData: Omit<RecurringSavingsInvestment, 'id' | 'createdAt' | 'updatedAt' | 'nextDueDate'> = {
      name: 'Monthly SIP',
      startDate: '2024-01-01',
      amount: 10000,
      accountId: 'invalid-account',
      type: 'Investment',
      destination: 'Mutual Fund',
      frequency: 'Monthly',
      status: 'Active',
    };

    expect(() => {
      useRecurringSavingsInvestmentsStore.getState().createTemplate(templateData);
    }).toThrow('Account with id invalid-account does not exist');
  });

  it('should throw error when creating template with invalid startDate', () => {
    const templateData: Omit<RecurringSavingsInvestment, 'id' | 'createdAt' | 'updatedAt' | 'nextDueDate'> = {
      name: 'Monthly SIP',
      startDate: '',
      amount: 10000,
      accountId: 'account-1',
      type: 'Investment',
      destination: 'Mutual Fund',
      frequency: 'Monthly',
      status: 'Active',
    };

    expect(() => {
      useRecurringSavingsInvestmentsStore.getState().createTemplate(templateData);
    }).toThrow('Start date validation failed');
  });

  it('should throw error when creating template with invalid date range', () => {
    const templateData: Omit<RecurringSavingsInvestment, 'id' | 'createdAt' | 'updatedAt' | 'nextDueDate'> = {
      name: 'Monthly SIP',
      startDate: '2024-12-01',
      endDate: '2024-01-01', // End date before start date
      amount: 10000,
      accountId: 'account-1',
      type: 'Investment',
      destination: 'Mutual Fund',
      frequency: 'Monthly',
      status: 'Active',
    };

    expect(() => {
      useRecurringSavingsInvestmentsStore.getState().createTemplate(templateData);
    }).toThrow('Date range validation failed');
  });

  it('should throw error when creating template with invalid amount', () => {
    const templateData: Omit<RecurringSavingsInvestment, 'id' | 'createdAt' | 'updatedAt' | 'nextDueDate'> = {
      name: 'Monthly SIP',
      startDate: '2024-01-01',
      amount: -100,
      accountId: 'account-1',
      type: 'Investment',
      destination: 'Mutual Fund',
      frequency: 'Monthly',
      status: 'Active',
    };

    expect(() => {
      useRecurringSavingsInvestmentsStore.getState().createTemplate(templateData);
    }).toThrow('Amount validation failed');
  });

  it('should update a recurring savings/investment template', () => {
    // Use a future date to avoid auto-generation during test
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);
    const startDate = futureDate.toISOString().split('T')[0];

    const templateData: Omit<RecurringSavingsInvestment, 'id' | 'createdAt' | 'updatedAt' | 'nextDueDate'> = {
      name: 'Monthly SIP',
      startDate,
      amount: 10000,
      accountId: 'account-1',
      type: 'Investment',
      destination: 'Mutual Fund',
      frequency: 'Monthly',
      status: 'Active',
    };

    useRecurringSavingsInvestmentsStore.getState().createTemplate(templateData);
    const template = useRecurringSavingsInvestmentsStore.getState().templates[0];

    useRecurringSavingsInvestmentsStore.getState().updateTemplate(template.id, {
      amount: 15000,
      name: 'Updated SIP',
    });

    const updatedTemplate = useRecurringSavingsInvestmentsStore.getState().getTemplate(template.id);
    expect(updatedTemplate?.amount).toBe(15000);
    expect(updatedTemplate?.name).toBe('Updated SIP');
    expect(updatedTemplate?.updatedAt).toBeDefined();
  });

  it('should throw error when updating template with invalid accountId', () => {
    // Use a future date to avoid auto-generation during test
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);
    const startDate = futureDate.toISOString().split('T')[0];

    const templateData: Omit<RecurringSavingsInvestment, 'id' | 'createdAt' | 'updatedAt' | 'nextDueDate'> = {
      name: 'Monthly SIP',
      startDate,
      amount: 10000,
      accountId: 'account-1',
      type: 'Investment',
      destination: 'Mutual Fund',
      frequency: 'Monthly',
      status: 'Active',
    };

    useRecurringSavingsInvestmentsStore.getState().createTemplate(templateData);
    const template = useRecurringSavingsInvestmentsStore.getState().templates[0];

    expect(() => {
      useRecurringSavingsInvestmentsStore.getState().updateTemplate(template.id, {
        accountId: 'invalid-account',
      });
    }).toThrow('Account with id invalid-account does not exist');
  });

  it('should delete a recurring savings/investment template', () => {
    // Use a future date to avoid auto-generation during test
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);
    const startDate = futureDate.toISOString().split('T')[0];

    const templateData: Omit<RecurringSavingsInvestment, 'id' | 'createdAt' | 'updatedAt' | 'nextDueDate'> = {
      name: 'Monthly SIP',
      startDate,
      amount: 10000,
      accountId: 'account-1',
      type: 'Investment',
      destination: 'Mutual Fund',
      frequency: 'Monthly',
      status: 'Active',
    };

    useRecurringSavingsInvestmentsStore.getState().createTemplate(templateData);
    const template = useRecurringSavingsInvestmentsStore.getState().templates[0];
    expect(useRecurringSavingsInvestmentsStore.getState().templates).toHaveLength(1);

    useRecurringSavingsInvestmentsStore.getState().deleteTemplate(template.id);

    expect(useRecurringSavingsInvestmentsStore.getState().templates).toHaveLength(0);
    expect(useRecurringSavingsInvestmentsStore.getState().getTemplate(template.id)).toBeUndefined();
  });

  it('should pause a recurring savings/investment template', () => {
    // Use a future date to avoid auto-generation during test
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);
    const startDate = futureDate.toISOString().split('T')[0];

    const templateData: Omit<RecurringSavingsInvestment, 'id' | 'createdAt' | 'updatedAt' | 'nextDueDate'> = {
      name: 'Monthly SIP',
      startDate,
      amount: 10000,
      accountId: 'account-1',
      type: 'Investment',
      destination: 'Mutual Fund',
      frequency: 'Monthly',
      status: 'Active',
    };

    useRecurringSavingsInvestmentsStore.getState().createTemplate(templateData);
    const template = useRecurringSavingsInvestmentsStore.getState().templates[0];

    useRecurringSavingsInvestmentsStore.getState().pauseTemplate(template.id);

    const pausedTemplate = useRecurringSavingsInvestmentsStore.getState().getTemplate(template.id);
    expect(pausedTemplate?.status).toBe('Paused');
  });

  it('should resume a paused recurring savings/investment template', () => {
    // Use a future date to avoid auto-generation during test
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);
    const startDate = futureDate.toISOString().split('T')[0];

    const templateData: Omit<RecurringSavingsInvestment, 'id' | 'createdAt' | 'updatedAt' | 'nextDueDate'> = {
      name: 'Monthly SIP',
      startDate,
      amount: 10000,
      accountId: 'account-1',
      type: 'Investment',
      destination: 'Mutual Fund',
      frequency: 'Monthly',
      status: 'Paused',
    };

    useRecurringSavingsInvestmentsStore.getState().createTemplate(templateData);
    const template = useRecurringSavingsInvestmentsStore.getState().templates[0];

    useRecurringSavingsInvestmentsStore.getState().resumeTemplate(template.id);

    const resumedTemplate = useRecurringSavingsInvestmentsStore.getState().getTemplate(template.id);
    expect(resumedTemplate?.status).toBe('Active');
  });

  it('should get active templates', () => {
    // Use a future date to avoid auto-generation during test
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);
    const startDate = futureDate.toISOString().split('T')[0];

    const template1: Omit<RecurringSavingsInvestment, 'id' | 'createdAt' | 'updatedAt' | 'nextDueDate'> = {
      name: 'Active Template',
      startDate,
      amount: 10000,
      accountId: 'account-1',
      type: 'Investment',
      destination: 'Mutual Fund',
      frequency: 'Monthly',
      status: 'Active',
    };

    const template2: Omit<RecurringSavingsInvestment, 'id' | 'createdAt' | 'updatedAt' | 'nextDueDate'> = {
      name: 'Paused Template',
      startDate,
      amount: 5000,
      accountId: 'account-1',
      type: 'Savings',
      destination: 'FD',
      frequency: 'Monthly',
      status: 'Paused',
    };

    useRecurringSavingsInvestmentsStore.getState().createTemplate(template1);
    useRecurringSavingsInvestmentsStore.getState().createTemplate(template2);

    const activeTemplates = useRecurringSavingsInvestmentsStore.getState().getActiveTemplates();
    expect(activeTemplates).toHaveLength(1);
    expect(activeTemplates[0].status).toBe('Active');
  });

  it('should get templates by account', () => {
    // Use a future date to avoid auto-generation during test
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);
    const startDate = futureDate.toISOString().split('T')[0];

    const template1: Omit<RecurringSavingsInvestment, 'id' | 'createdAt' | 'updatedAt' | 'nextDueDate'> = {
      name: 'Template 1',
      startDate,
      amount: 10000,
      accountId: 'account-1',
      type: 'Investment',
      destination: 'Mutual Fund',
      frequency: 'Monthly',
      status: 'Active',
    };

    const template2: Omit<RecurringSavingsInvestment, 'id' | 'createdAt' | 'updatedAt' | 'nextDueDate'> = {
      name: 'Template 2',
      startDate,
      amount: 5000,
      accountId: 'account-2',
      type: 'Savings',
      destination: 'FD',
      frequency: 'Monthly',
      status: 'Active',
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

    useRecurringSavingsInvestmentsStore.getState().createTemplate(template1);
    useRecurringSavingsInvestmentsStore.getState().createTemplate(template2);

    const accountTemplates = useRecurringSavingsInvestmentsStore.getState().getTemplatesByAccount('account-1');
    expect(accountTemplates).toHaveLength(1);
    expect(accountTemplates[0].accountId).toBe('account-1');
  });

  it('should get templates by status', () => {
    // Use a future date to avoid auto-generation during test
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);
    const startDate = futureDate.toISOString().split('T')[0];

    const template1: Omit<RecurringSavingsInvestment, 'id' | 'createdAt' | 'updatedAt' | 'nextDueDate'> = {
      name: 'Active Template',
      startDate,
      amount: 10000,
      accountId: 'account-1',
      type: 'Investment',
      destination: 'Mutual Fund',
      frequency: 'Monthly',
      status: 'Active',
    };

    const template2: Omit<RecurringSavingsInvestment, 'id' | 'createdAt' | 'updatedAt' | 'nextDueDate'> = {
      name: 'Paused Template',
      startDate,
      amount: 5000,
      accountId: 'account-1',
      type: 'Savings',
      destination: 'FD',
      frequency: 'Monthly',
      status: 'Paused',
    };

    useRecurringSavingsInvestmentsStore.getState().createTemplate(template1);
    useRecurringSavingsInvestmentsStore.getState().createTemplate(template2);

    const pausedTemplates = useRecurringSavingsInvestmentsStore.getState().getTemplatesByStatus('Paused');
    expect(pausedTemplates).toHaveLength(1);
    expect(pausedTemplates[0].status).toBe('Paused');
  });

  it('should prevent deletion of template with associated transactions', () => {
    // Use a future date to avoid auto-generation during test
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);
    const startDate = futureDate.toISOString().split('T')[0];

    const templateData: Omit<RecurringSavingsInvestment, 'id' | 'createdAt' | 'updatedAt' | 'nextDueDate'> = {
      name: 'Monthly SIP',
      startDate,
      amount: 10000,
      accountId: 'account-1',
      type: 'Investment',
      destination: 'Mutual Fund',
      frequency: 'Monthly',
      status: 'Active',
    };

    useRecurringSavingsInvestmentsStore.getState().createTemplate(templateData);
    const template = useRecurringSavingsInvestmentsStore.getState().templates[0];

    // Mock transactions that reference this template
    vi.mocked(useSavingsInvestmentTransactionsStore.getState).mockReturnValue({
      transactions: [
        {
          id: 'txn-1',
          recurringTemplateId: template.id,
          accountId: 'account-1',
          date: '2024-01-01',
          amount: 10000,
          type: 'Investment',
          destination: 'Mutual Fund',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
      ],
      createTransaction: vi.fn(),
    } as any);

    expect(() => {
      useRecurringSavingsInvestmentsStore.getState().deleteTemplate(template.id);
    }).toThrow('Cannot delete recurring savings/investment template');
  });
});

