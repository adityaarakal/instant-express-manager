import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useRecurringIncomesStore } from '../useRecurringIncomesStore';
import { useBankAccountsStore } from '../useBankAccountsStore';
import { useIncomeTransactionsStore } from '../useIncomeTransactionsStore';
import type { RecurringIncome } from '../../types/recurring';
import type { BankAccount } from '../../types/bankAccounts';

// Mock dependencies
vi.mock('../useBankAccountsStore', () => ({
  useBankAccountsStore: {
    getState: vi.fn(),
  },
}));

vi.mock('../useIncomeTransactionsStore', () => ({
  useIncomeTransactionsStore: {
    getState: vi.fn(),
  },
}));

describe('useRecurringIncomesStore', () => {
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
    useRecurringIncomesStore.setState({ templates: [] });
    
    // Setup default mocks
    vi.mocked(useBankAccountsStore.getState).mockReturnValue({
      getAccount: vi.fn((id: string) => {
        if (id === 'account-1') return mockAccount;
        return undefined;
      }),
    } as any);

    vi.mocked(useIncomeTransactionsStore.getState).mockReturnValue({
      transactions: [],
      createTransaction: vi.fn(),
    } as any);
  });

  it('should create a recurring income template', () => {
    // Use a future date to avoid auto-generation during test
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);
    const startDate = futureDate.toISOString().split('T')[0];

    const templateData: Omit<RecurringIncome, 'id' | 'createdAt' | 'updatedAt' | 'nextDueDate'> = {
      name: 'Monthly Salary',
      startDate,
      amount: 50000,
      accountId: 'account-1',
      category: 'Salary',
      frequency: 'Monthly',
      status: 'Active',
    };

    useRecurringIncomesStore.getState().createTemplate(templateData);

    const templates = useRecurringIncomesStore.getState().templates;
    expect(templates).toHaveLength(1);
    expect(templates[0].name).toBe('Monthly Salary');
    expect(templates[0].amount).toBe(50000);
    expect(templates[0].category).toBe('Salary');
    expect(templates[0].frequency).toBe('Monthly');
    expect(templates[0].status).toBe('Active');
    expect(templates[0].nextDueDate).toBe(startDate);
    expect(templates[0].id).toBeDefined();
    expect(templates[0].createdAt).toBeDefined();
    expect(templates[0].updatedAt).toBeDefined();
  });

  it('should throw error when creating template with invalid accountId', () => {
    const templateData: Omit<RecurringIncome, 'id' | 'createdAt' | 'updatedAt' | 'nextDueDate'> = {
      name: 'Monthly Salary',
      startDate: '2024-01-01',
      amount: 50000,
      accountId: 'invalid-account',
      category: 'Salary',
      frequency: 'Monthly',
      status: 'Active',
    };

    expect(() => {
      useRecurringIncomesStore.getState().createTemplate(templateData);
    }).toThrow('Account with id invalid-account does not exist');
  });

  it('should throw error when creating template with invalid startDate', () => {
    const templateData: Omit<RecurringIncome, 'id' | 'createdAt' | 'updatedAt' | 'nextDueDate'> = {
      name: 'Monthly Salary',
      startDate: '',
      amount: 50000,
      accountId: 'account-1',
      category: 'Salary',
      frequency: 'Monthly',
      status: 'Active',
    };

    expect(() => {
      useRecurringIncomesStore.getState().createTemplate(templateData);
    }).toThrow('Start date validation failed');
  });

  it('should throw error when creating template with invalid date range', () => {
    const templateData: Omit<RecurringIncome, 'id' | 'createdAt' | 'updatedAt' | 'nextDueDate'> = {
      name: 'Monthly Salary',
      startDate: '2024-12-01',
      endDate: '2024-01-01', // End date before start date
      amount: 50000,
      accountId: 'account-1',
      category: 'Salary',
      frequency: 'Monthly',
      status: 'Active',
    };

    expect(() => {
      useRecurringIncomesStore.getState().createTemplate(templateData);
    }).toThrow('Date range validation failed');
  });

  it('should throw error when creating template with invalid amount', () => {
    const templateData: Omit<RecurringIncome, 'id' | 'createdAt' | 'updatedAt' | 'nextDueDate'> = {
      name: 'Monthly Salary',
      startDate: '2024-01-01',
      amount: -100,
      accountId: 'account-1',
      category: 'Salary',
      frequency: 'Monthly',
      status: 'Active',
    };

    expect(() => {
      useRecurringIncomesStore.getState().createTemplate(templateData);
    }).toThrow('Amount validation failed');
  });

  it('should update a recurring income template', () => {
    // Use a future date to avoid auto-generation during test
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);
    const startDate = futureDate.toISOString().split('T')[0];

    const templateData: Omit<RecurringIncome, 'id' | 'createdAt' | 'updatedAt' | 'nextDueDate'> = {
      name: 'Monthly Salary',
      startDate,
      amount: 50000,
      accountId: 'account-1',
      category: 'Salary',
      frequency: 'Monthly',
      status: 'Active',
    };

    useRecurringIncomesStore.getState().createTemplate(templateData);
    const template = useRecurringIncomesStore.getState().templates[0];

    useRecurringIncomesStore.getState().updateTemplate(template.id, {
      amount: 60000,
      name: 'Updated Salary',
    });

    const updatedTemplate = useRecurringIncomesStore.getState().getTemplate(template.id);
    expect(updatedTemplate?.amount).toBe(60000);
    expect(updatedTemplate?.name).toBe('Updated Salary');
    expect(updatedTemplate?.updatedAt).toBeDefined();
  });

  it('should throw error when updating template with invalid accountId', () => {
    // Use a future date to avoid auto-generation during test
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);
    const startDate = futureDate.toISOString().split('T')[0];

    const templateData: Omit<RecurringIncome, 'id' | 'createdAt' | 'updatedAt' | 'nextDueDate'> = {
      name: 'Monthly Salary',
      startDate,
      amount: 50000,
      accountId: 'account-1',
      category: 'Salary',
      frequency: 'Monthly',
      status: 'Active',
    };

    useRecurringIncomesStore.getState().createTemplate(templateData);
    const template = useRecurringIncomesStore.getState().templates[0];

    expect(() => {
      useRecurringIncomesStore.getState().updateTemplate(template.id, {
        accountId: 'invalid-account',
      });
    }).toThrow('Account with id invalid-account does not exist');
  });

  it('should delete a recurring income template', () => {
    // Use a future date to avoid auto-generation during test
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);
    const startDate = futureDate.toISOString().split('T')[0];

    const templateData: Omit<RecurringIncome, 'id' | 'createdAt' | 'updatedAt' | 'nextDueDate'> = {
      name: 'Monthly Salary',
      startDate,
      amount: 50000,
      accountId: 'account-1',
      category: 'Salary',
      frequency: 'Monthly',
      status: 'Active',
    };

    useRecurringIncomesStore.getState().createTemplate(templateData);
    const template = useRecurringIncomesStore.getState().templates[0];
    expect(useRecurringIncomesStore.getState().templates).toHaveLength(1);

    useRecurringIncomesStore.getState().deleteTemplate(template.id);

    expect(useRecurringIncomesStore.getState().templates).toHaveLength(0);
    expect(useRecurringIncomesStore.getState().getTemplate(template.id)).toBeUndefined();
  });

  it('should pause a recurring income template', () => {
    // Use a future date to avoid auto-generation during test
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);
    const startDate = futureDate.toISOString().split('T')[0];

    const templateData: Omit<RecurringIncome, 'id' | 'createdAt' | 'updatedAt' | 'nextDueDate'> = {
      name: 'Monthly Salary',
      startDate,
      amount: 50000,
      accountId: 'account-1',
      category: 'Salary',
      frequency: 'Monthly',
      status: 'Active',
    };

    useRecurringIncomesStore.getState().createTemplate(templateData);
    const template = useRecurringIncomesStore.getState().templates[0];

    useRecurringIncomesStore.getState().pauseTemplate(template.id);

    const pausedTemplate = useRecurringIncomesStore.getState().getTemplate(template.id);
    expect(pausedTemplate?.status).toBe('Paused');
  });

  it('should resume a paused recurring income template', () => {
    // Use a future date to avoid auto-generation during test
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);
    const startDate = futureDate.toISOString().split('T')[0];

    const templateData: Omit<RecurringIncome, 'id' | 'createdAt' | 'updatedAt' | 'nextDueDate'> = {
      name: 'Monthly Salary',
      startDate,
      amount: 50000,
      accountId: 'account-1',
      category: 'Salary',
      frequency: 'Monthly',
      status: 'Paused',
    };

    useRecurringIncomesStore.getState().createTemplate(templateData);
    const template = useRecurringIncomesStore.getState().templates[0];

    useRecurringIncomesStore.getState().resumeTemplate(template.id);

    const resumedTemplate = useRecurringIncomesStore.getState().getTemplate(template.id);
    expect(resumedTemplate?.status).toBe('Active');
  });

  it('should get active templates', () => {
    // Use a future date to avoid auto-generation during test
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);
    const startDate = futureDate.toISOString().split('T')[0];

    const template1: Omit<RecurringIncome, 'id' | 'createdAt' | 'updatedAt' | 'nextDueDate'> = {
      name: 'Active Template',
      startDate,
      amount: 50000,
      accountId: 'account-1',
      category: 'Salary',
      frequency: 'Monthly',
      status: 'Active',
    };

    const template2: Omit<RecurringIncome, 'id' | 'createdAt' | 'updatedAt' | 'nextDueDate'> = {
      name: 'Paused Template',
      startDate,
      amount: 30000,
      accountId: 'account-1',
      category: 'Bonus',
      frequency: 'Monthly',
      status: 'Paused',
    };

    useRecurringIncomesStore.getState().createTemplate(template1);
    useRecurringIncomesStore.getState().createTemplate(template2);

    const activeTemplates = useRecurringIncomesStore.getState().getActiveTemplates();
    expect(activeTemplates).toHaveLength(1);
    expect(activeTemplates[0].status).toBe('Active');
  });

  it('should get templates by account', () => {
    // Use a future date to avoid auto-generation during test
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);
    const startDate = futureDate.toISOString().split('T')[0];

    const template1: Omit<RecurringIncome, 'id' | 'createdAt' | 'updatedAt' | 'nextDueDate'> = {
      name: 'Template 1',
      startDate,
      amount: 50000,
      accountId: 'account-1',
      category: 'Salary',
      frequency: 'Monthly',
      status: 'Active',
    };

    const template2: Omit<RecurringIncome, 'id' | 'createdAt' | 'updatedAt' | 'nextDueDate'> = {
      name: 'Template 2',
      startDate,
      amount: 30000,
      accountId: 'account-2',
      category: 'Bonus',
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
    } as any);

    useRecurringIncomesStore.getState().createTemplate(template1);
    useRecurringIncomesStore.getState().createTemplate(template2);

    const accountTemplates = useRecurringIncomesStore.getState().getTemplatesByAccount('account-1');
    expect(accountTemplates).toHaveLength(1);
    expect(accountTemplates[0].accountId).toBe('account-1');
  });

  it('should get templates by status', () => {
    // Use a future date to avoid auto-generation during test
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);
    const startDate = futureDate.toISOString().split('T')[0];

    const template1: Omit<RecurringIncome, 'id' | 'createdAt' | 'updatedAt' | 'nextDueDate'> = {
      name: 'Active Template',
      startDate,
      amount: 50000,
      accountId: 'account-1',
      category: 'Salary',
      frequency: 'Monthly',
      status: 'Active',
    };

    const template2: Omit<RecurringIncome, 'id' | 'createdAt' | 'updatedAt' | 'nextDueDate'> = {
      name: 'Paused Template',
      startDate,
      amount: 30000,
      accountId: 'account-1',
      category: 'Bonus',
      frequency: 'Monthly',
      status: 'Paused',
    };

    useRecurringIncomesStore.getState().createTemplate(template1);
    useRecurringIncomesStore.getState().createTemplate(template2);

    const pausedTemplates = useRecurringIncomesStore.getState().getTemplatesByStatus('Paused');
    expect(pausedTemplates).toHaveLength(1);
    expect(pausedTemplates[0].status).toBe('Paused');
  });

  it('should prevent deletion of template with associated transactions', () => {
    // Use a future date to avoid auto-generation during test
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);
    const startDate = futureDate.toISOString().split('T')[0];

    const templateData: Omit<RecurringIncome, 'id' | 'createdAt' | 'updatedAt' | 'nextDueDate'> = {
      name: 'Monthly Salary',
      startDate,
      amount: 50000,
      accountId: 'account-1',
      category: 'Salary',
      frequency: 'Monthly',
      status: 'Active',
    };

    useRecurringIncomesStore.getState().createTemplate(templateData);
    const template = useRecurringIncomesStore.getState().templates[0];

    // Mock transactions that reference this template
    vi.mocked(useIncomeTransactionsStore.getState).mockReturnValue({
      transactions: [
        {
          id: 'txn-1',
          recurringTemplateId: template.id,
          accountId: 'account-1',
          date: '2024-01-01',
          amount: 50000,
          category: 'Salary',
          description: 'Monthly Salary',
          status: 'Received',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
      ],
      createTransaction: vi.fn(),
    } as any);

    expect(() => {
      useRecurringIncomesStore.getState().deleteTemplate(template.id);
    }).toThrow('Cannot delete recurring income template');
  });
});

