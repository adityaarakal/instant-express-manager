import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useRecurringExpensesStore } from '../useRecurringExpensesStore';
import { useBankAccountsStore } from '../useBankAccountsStore';
import { useExpenseTransactionsStore } from '../useExpenseTransactionsStore';
import type { RecurringExpense } from '../../types/recurring';
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

describe('useRecurringExpensesStore', () => {
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
    useRecurringExpensesStore.setState({ templates: [] });
    
    // Setup default mocks
    vi.mocked(useBankAccountsStore.getState).mockReturnValue({
      getAccount: vi.fn((id: string) => {
        if (id === 'account-1') return mockAccount;
        return undefined;
      }),
    } as any);

    vi.mocked(useExpenseTransactionsStore.getState).mockReturnValue({
      transactions: [],
      createTransaction: vi.fn(),
    } as any);
  });

  it('should create a recurring expense template', () => {
    // Use a future date to avoid auto-generation during test
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);
    const startDate = futureDate.toISOString().split('T')[0];

    const templateData: Omit<RecurringExpense, 'id' | 'createdAt' | 'updatedAt' | 'nextDueDate'> = {
      name: 'Monthly Rent',
      startDate,
      amount: 15000,
      accountId: 'account-1',
      category: 'Housing',
      bucket: 'Needs',
      frequency: 'Monthly',
      status: 'Active',
    };

    useRecurringExpensesStore.getState().createTemplate(templateData);

    const templates = useRecurringExpensesStore.getState().templates;
    expect(templates).toHaveLength(1);
    expect(templates[0].name).toBe('Monthly Rent');
    expect(templates[0].amount).toBe(15000);
    expect(templates[0].category).toBe('Housing');
    expect(templates[0].bucket).toBe('Needs');
    expect(templates[0].frequency).toBe('Monthly');
    expect(templates[0].status).toBe('Active');
    expect(templates[0].nextDueDate).toBe(startDate);
    expect(templates[0].id).toBeDefined();
    expect(templates[0].createdAt).toBeDefined();
    expect(templates[0].updatedAt).toBeDefined();
  });

  it('should throw error when creating template with invalid accountId', () => {
    const templateData: Omit<RecurringExpense, 'id' | 'createdAt' | 'updatedAt' | 'nextDueDate'> = {
      name: 'Monthly Rent',
      startDate: '2024-01-01',
      amount: 15000,
      accountId: 'invalid-account',
      category: 'Housing',
      bucket: 'Needs',
      frequency: 'Monthly',
      status: 'Active',
    };

    expect(() => {
      useRecurringExpensesStore.getState().createTemplate(templateData);
    }).toThrow('Account with id invalid-account does not exist');
  });

  it('should throw error when creating template with invalid startDate', () => {
    const templateData: Omit<RecurringExpense, 'id' | 'createdAt' | 'updatedAt' | 'nextDueDate'> = {
      name: 'Monthly Rent',
      startDate: '',
      amount: 15000,
      accountId: 'account-1',
      category: 'Housing',
      bucket: 'Needs',
      frequency: 'Monthly',
      status: 'Active',
    };

    expect(() => {
      useRecurringExpensesStore.getState().createTemplate(templateData);
    }).toThrow('Start date validation failed');
  });

  it('should throw error when creating template with invalid date range', () => {
    const templateData: Omit<RecurringExpense, 'id' | 'createdAt' | 'updatedAt' | 'nextDueDate'> = {
      name: 'Monthly Rent',
      startDate: '2024-12-01',
      endDate: '2024-01-01', // End date before start date
      amount: 15000,
      accountId: 'account-1',
      category: 'Housing',
      bucket: 'Needs',
      frequency: 'Monthly',
      status: 'Active',
    };

    expect(() => {
      useRecurringExpensesStore.getState().createTemplate(templateData);
    }).toThrow('Date range validation failed');
  });

  it('should throw error when creating template with invalid amount', () => {
    const templateData: Omit<RecurringExpense, 'id' | 'createdAt' | 'updatedAt' | 'nextDueDate'> = {
      name: 'Monthly Rent',
      startDate: '2024-01-01',
      amount: -100,
      accountId: 'account-1',
      category: 'Housing',
      bucket: 'Needs',
      frequency: 'Monthly',
      status: 'Active',
    };

    expect(() => {
      useRecurringExpensesStore.getState().createTemplate(templateData);
    }).toThrow('Amount validation failed');
  });

  it('should update a recurring expense template', () => {
    // Use a future date to avoid auto-generation during test
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);
    const startDate = futureDate.toISOString().split('T')[0];

    const templateData: Omit<RecurringExpense, 'id' | 'createdAt' | 'updatedAt' | 'nextDueDate'> = {
      name: 'Monthly Rent',
      startDate,
      amount: 15000,
      accountId: 'account-1',
      category: 'Housing',
      bucket: 'Needs',
      frequency: 'Monthly',
      status: 'Active',
    };

    useRecurringExpensesStore.getState().createTemplate(templateData);
    const template = useRecurringExpensesStore.getState().templates[0];

    useRecurringExpensesStore.getState().updateTemplate(template.id, {
      amount: 18000,
      name: 'Updated Rent',
    });

    const updatedTemplate = useRecurringExpensesStore.getState().getTemplate(template.id);
    expect(updatedTemplate?.amount).toBe(18000);
    expect(updatedTemplate?.name).toBe('Updated Rent');
    expect(updatedTemplate?.updatedAt).toBeDefined();
  });

  it('should throw error when updating template with invalid accountId', () => {
    // Use a future date to avoid auto-generation during test
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);
    const startDate = futureDate.toISOString().split('T')[0];

    const templateData: Omit<RecurringExpense, 'id' | 'createdAt' | 'updatedAt' | 'nextDueDate'> = {
      name: 'Monthly Rent',
      startDate,
      amount: 15000,
      accountId: 'account-1',
      category: 'Housing',
      bucket: 'Needs',
      frequency: 'Monthly',
      status: 'Active',
    };

    useRecurringExpensesStore.getState().createTemplate(templateData);
    const template = useRecurringExpensesStore.getState().templates[0];

    expect(() => {
      useRecurringExpensesStore.getState().updateTemplate(template.id, {
        accountId: 'invalid-account',
      });
    }).toThrow('Account with id invalid-account does not exist');
  });

  it('should delete a recurring expense template', () => {
    // Use a future date to avoid auto-generation during test
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);
    const startDate = futureDate.toISOString().split('T')[0];

    const templateData: Omit<RecurringExpense, 'id' | 'createdAt' | 'updatedAt' | 'nextDueDate'> = {
      name: 'Monthly Rent',
      startDate,
      amount: 15000,
      accountId: 'account-1',
      category: 'Housing',
      bucket: 'Needs',
      frequency: 'Monthly',
      status: 'Active',
    };

    useRecurringExpensesStore.getState().createTemplate(templateData);
    const template = useRecurringExpensesStore.getState().templates[0];
    expect(useRecurringExpensesStore.getState().templates).toHaveLength(1);

    useRecurringExpensesStore.getState().deleteTemplate(template.id);

    expect(useRecurringExpensesStore.getState().templates).toHaveLength(0);
    expect(useRecurringExpensesStore.getState().getTemplate(template.id)).toBeUndefined();
  });

  it('should pause a recurring expense template', () => {
    // Use a future date to avoid auto-generation during test
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);
    const startDate = futureDate.toISOString().split('T')[0];

    const templateData: Omit<RecurringExpense, 'id' | 'createdAt' | 'updatedAt' | 'nextDueDate'> = {
      name: 'Monthly Rent',
      startDate,
      amount: 15000,
      accountId: 'account-1',
      category: 'Housing',
      bucket: 'Needs',
      frequency: 'Monthly',
      status: 'Active',
    };

    useRecurringExpensesStore.getState().createTemplate(templateData);
    const template = useRecurringExpensesStore.getState().templates[0];

    useRecurringExpensesStore.getState().pauseTemplate(template.id);

    const pausedTemplate = useRecurringExpensesStore.getState().getTemplate(template.id);
    expect(pausedTemplate?.status).toBe('Paused');
  });

  it('should resume a paused recurring expense template', () => {
    // Use a future date to avoid auto-generation during test
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);
    const startDate = futureDate.toISOString().split('T')[0];

    const templateData: Omit<RecurringExpense, 'id' | 'createdAt' | 'updatedAt' | 'nextDueDate'> = {
      name: 'Monthly Rent',
      startDate,
      amount: 15000,
      accountId: 'account-1',
      category: 'Housing',
      bucket: 'Needs',
      frequency: 'Monthly',
      status: 'Paused',
    };

    useRecurringExpensesStore.getState().createTemplate(templateData);
    const template = useRecurringExpensesStore.getState().templates[0];

    useRecurringExpensesStore.getState().resumeTemplate(template.id);

    const resumedTemplate = useRecurringExpensesStore.getState().getTemplate(template.id);
    expect(resumedTemplate?.status).toBe('Active');
  });

  it('should get active templates', () => {
    // Use a future date to avoid auto-generation during test
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);
    const startDate = futureDate.toISOString().split('T')[0];

    const template1: Omit<RecurringExpense, 'id' | 'createdAt' | 'updatedAt' | 'nextDueDate'> = {
      name: 'Active Template',
      startDate,
      amount: 15000,
      accountId: 'account-1',
      category: 'Housing',
      bucket: 'Needs',
      frequency: 'Monthly',
      status: 'Active',
    };

    const template2: Omit<RecurringExpense, 'id' | 'createdAt' | 'updatedAt' | 'nextDueDate'> = {
      name: 'Paused Template',
      startDate,
      amount: 5000,
      accountId: 'account-1',
      category: 'Food',
      bucket: 'Needs',
      frequency: 'Monthly',
      status: 'Paused',
    };

    useRecurringExpensesStore.getState().createTemplate(template1);
    useRecurringExpensesStore.getState().createTemplate(template2);

    const activeTemplates = useRecurringExpensesStore.getState().getActiveTemplates();
    expect(activeTemplates).toHaveLength(1);
    expect(activeTemplates[0].status).toBe('Active');
  });

  it('should get templates by account', () => {
    // Use a future date to avoid auto-generation during test
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);
    const startDate = futureDate.toISOString().split('T')[0];

    const template1: Omit<RecurringExpense, 'id' | 'createdAt' | 'updatedAt' | 'nextDueDate'> = {
      name: 'Template 1',
      startDate,
      amount: 15000,
      accountId: 'account-1',
      category: 'Housing',
      bucket: 'Needs',
      frequency: 'Monthly',
      status: 'Active',
    };

    const template2: Omit<RecurringExpense, 'id' | 'createdAt' | 'updatedAt' | 'nextDueDate'> = {
      name: 'Template 2',
      startDate,
      amount: 5000,
      accountId: 'account-2',
      category: 'Food',
      bucket: 'Needs',
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

    useRecurringExpensesStore.getState().createTemplate(template1);
    useRecurringExpensesStore.getState().createTemplate(template2);

    const accountTemplates = useRecurringExpensesStore.getState().getTemplatesByAccount('account-1');
    expect(accountTemplates).toHaveLength(1);
    expect(accountTemplates[0].accountId).toBe('account-1');
  });

  it('should get templates by status', () => {
    // Use a future date to avoid auto-generation during test
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);
    const startDate = futureDate.toISOString().split('T')[0];

    const template1: Omit<RecurringExpense, 'id' | 'createdAt' | 'updatedAt' | 'nextDueDate'> = {
      name: 'Active Template',
      startDate,
      amount: 15000,
      accountId: 'account-1',
      category: 'Housing',
      bucket: 'Needs',
      frequency: 'Monthly',
      status: 'Active',
    };

    const template2: Omit<RecurringExpense, 'id' | 'createdAt' | 'updatedAt' | 'nextDueDate'> = {
      name: 'Paused Template',
      startDate,
      amount: 5000,
      accountId: 'account-1',
      category: 'Food',
      bucket: 'Needs',
      frequency: 'Monthly',
      status: 'Paused',
    };

    useRecurringExpensesStore.getState().createTemplate(template1);
    useRecurringExpensesStore.getState().createTemplate(template2);

    const pausedTemplates = useRecurringExpensesStore.getState().getTemplatesByStatus('Paused');
    expect(pausedTemplates).toHaveLength(1);
    expect(pausedTemplates[0].status).toBe('Paused');
  });

  it('should prevent deletion of template with associated transactions', () => {
    // Use a future date to avoid auto-generation during test
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);
    const startDate = futureDate.toISOString().split('T')[0];

    const templateData: Omit<RecurringExpense, 'id' | 'createdAt' | 'updatedAt' | 'nextDueDate'> = {
      name: 'Monthly Rent',
      startDate,
      amount: 15000,
      accountId: 'account-1',
      category: 'Housing',
      bucket: 'Needs',
      frequency: 'Monthly',
      status: 'Active',
    };

    useRecurringExpensesStore.getState().createTemplate(templateData);
    const template = useRecurringExpensesStore.getState().templates[0];

    // Mock transactions that reference this template
    vi.mocked(useExpenseTransactionsStore.getState).mockReturnValue({
      transactions: [
        {
          id: 'txn-1',
          recurringTemplateId: template.id,
          accountId: 'account-1',
          date: '2024-01-01',
          amount: 15000,
          category: 'Housing',
          bucket: 'Needs',
          description: 'Monthly Rent',
          status: 'Paid',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
      ],
      createTransaction: vi.fn(),
    } as any);

    expect(() => {
      useRecurringExpensesStore.getState().deleteTemplate(template.id);
    }).toThrow('Cannot delete recurring expense template');
  });
});

