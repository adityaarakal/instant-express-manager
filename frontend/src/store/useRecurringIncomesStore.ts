import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { RecurringIncome } from '../types/recurring';
import { useIncomeTransactionsStore } from './useIncomeTransactionsStore';
import { useBankAccountsStore } from './useBankAccountsStore';
import { validateDate, validateAmount, validateDateRange } from '../utils/validation';
import { getLocalforageStorage } from '../utils/storage';

type RecurringIncomesState = {
  templates: RecurringIncome[];
  // CRUD operations
  createTemplate: (template: Omit<RecurringIncome, 'id' | 'createdAt' | 'updatedAt' | 'nextDueDate'>) => void;
  updateTemplate: (id: string, updates: Partial<Omit<RecurringIncome, 'id' | 'createdAt'>>) => void;
  deleteTemplate: (id: string) => void;
  getTemplate: (id: string) => RecurringIncome | undefined;
  // Status management
  pauseTemplate: (id: string) => void;
  resumeTemplate: (id: string) => void;
  // Auto-generation
  checkAndGenerateTransactions: () => void;
  getGeneratedTransactions: (templateId: string) => string[]; // Returns transaction IDs
  // Selectors
  getActiveTemplates: () => RecurringIncome[];
  getTemplatesByAccount: (accountId: string) => RecurringIncome[];
  getTemplatesByStatus: (status: RecurringIncome['status']) => RecurringIncome[];
};

const storage = getLocalforageStorage('recurring-incomes');

const calculateNextDueDate = (
  lastDate: string,
  frequency: RecurringIncome['frequency']
): string => {
  const date = new Date(lastDate);
  switch (frequency) {
    case 'Monthly':
      date.setMonth(date.getMonth() + 1);
      break;
    case 'Weekly':
      date.setDate(date.getDate() + 7);
      break;
    case 'Yearly':
      date.setFullYear(date.getFullYear() + 1);
      break;
    default:
      date.setMonth(date.getMonth() + 1);
  }
  return date.toISOString().split('T')[0];
};

export const useRecurringIncomesStore = create<RecurringIncomesState>()(
  devtools(
    persist(
      (set, get) => ({
        templates: [],
        createTemplate: (templateData) => {
          // Validate accountId exists
          const account = useBankAccountsStore.getState().getAccount(templateData.accountId);
          if (!account) {
            throw new Error(`Account with id ${templateData.accountId} does not exist`);
          }
          
          // Validate startDate
          const startDateValidation = validateDate(templateData.startDate, 'Start Date');
          if (!startDateValidation.isValid) {
            throw new Error(`Start date validation failed: ${startDateValidation.errors.join(', ')}`);
          }
          
          // Validate endDate if provided
          if (templateData.endDate) {
            const dateRangeValidation = validateDateRange(templateData.startDate, templateData.endDate);
            if (!dateRangeValidation.isValid) {
              throw new Error(`Date range validation failed: ${dateRangeValidation.errors.join(', ')}`);
            }
          }
          
          // Validate amount
          const amountValidation = validateAmount(templateData.amount, 'Amount');
          if (!amountValidation.isValid) {
            throw new Error(`Amount validation failed: ${amountValidation.errors.join(', ')}`);
          }
          
          const now = new Date().toISOString();
          const nextDueDate = templateData.startDate;
          const newTemplate: RecurringIncome = {
            ...templateData,
            nextDueDate,
            id: typeof crypto !== 'undefined' && 'randomUUID' in crypto
              ? crypto.randomUUID()
              : `recur_inc_${Date.now()}_${Math.random().toString(36).slice(2)}`,
            createdAt: now,
            updatedAt: now,
          };
          set((state) => ({
            templates: [...state.templates, newTemplate],
          }));
          // Auto-generate first transaction if start date is today or past
          get().checkAndGenerateTransactions();
        },
        updateTemplate: (id, updates) => {
          // Validate accountId if being updated
          if (updates.accountId) {
            const account = useBankAccountsStore.getState().getAccount(updates.accountId);
            if (!account) {
              throw new Error(`Account with id ${updates.accountId} does not exist`);
            }
          }
          
          // Validate dates if being updated
          if (updates.startDate || updates.endDate !== undefined) {
            set((state) => {
              const template = state.templates.find((t) => t.id === id);
              if (template) {
                const startDate = updates.startDate || template.startDate;
                const endDate = updates.endDate !== undefined ? updates.endDate : template.endDate;
                
                const startDateValidation = validateDate(startDate, 'Start Date');
                if (!startDateValidation.isValid) {
                  throw new Error(`Start date validation failed: ${startDateValidation.errors.join(', ')}`);
                }
                
                if (endDate) {
                  const dateRangeValidation = validateDateRange(startDate, endDate);
                  if (!dateRangeValidation.isValid) {
                    throw new Error(`Date range validation failed: ${dateRangeValidation.errors.join(', ')}`);
                  }
                }
              }
              return state;
            });
          }
          
          // Validate amount if being updated
          if (updates.amount !== undefined) {
            const amountValidation = validateAmount(updates.amount, 'Amount');
            if (!amountValidation.isValid) {
              throw new Error(`Amount validation failed: ${amountValidation.errors.join(', ')}`);
            }
          }
          
          set((state) => ({
            templates: state.templates.map((template) =>
              template.id === id
                ? { ...template, ...updates, updatedAt: new Date().toISOString() }
                : template
            ),
          }));
        },
        deleteTemplate: (id) => {
          // Check if any transactions reference this template
          const transactions = useIncomeTransactionsStore.getState().transactions.filter(
            (t) => t.recurringTemplateId === id
          );
          
          if (transactions.length > 0) {
            throw new Error(
              `Cannot delete recurring income template: ${transactions.length} income transaction(s) still reference it. ` +
              `Please delete or update the transactions first.`
            );
          }
          
          set((state) => ({
            templates: state.templates.filter((template) => template.id !== id),
          }));
        },
        getTemplate: (id) => {
          return get().templates.find((template) => template.id === id);
        },
        pauseTemplate: (id) => {
          get().updateTemplate(id, { status: 'Paused' });
        },
        resumeTemplate: (id) => {
          get().updateTemplate(id, { status: 'Active' });
        },
        checkAndGenerateTransactions: () => {
          const today = new Date().toISOString().split('T')[0];
          const activeTemplates = get().getActiveTemplates();
          
          activeTemplates.forEach((template) => {
            if (template.nextDueDate <= today) {
              // Check if transaction already exists for this template and date
              const existingTransactions = useIncomeTransactionsStore.getState().transactions.filter(
                (t) => t.recurringTemplateId === template.id && t.date === template.nextDueDate
              );
              
              if (existingTransactions.length === 0) {
                // Create transaction
                useIncomeTransactionsStore.getState().createTransaction({
                  date: template.nextDueDate,
                  amount: template.amount,
                  accountId: template.accountId,
                  category: template.category,
                  description: template.name,
                  status: 'Pending',
                  recurringTemplateId: template.id,
                });
                
                // Calculate next due date
                const nextDue = calculateNextDueDate(template.nextDueDate, template.frequency);
                
                // Check if end date reached
                const isCompleted = template.endDate && nextDue > template.endDate;
                
                // Update template
                get().updateTemplate(template.id, {
                  nextDueDate: nextDue,
                  status: isCompleted ? 'Completed' : template.status,
                });
              }
            }
          });
        },
        getGeneratedTransactions: (templateId) => {
          return useIncomeTransactionsStore
            .getState()
            .transactions.filter((t) => t.recurringTemplateId === templateId)
            .map((t) => t.id);
        },
        getActiveTemplates: () => {
          return get().templates.filter((template) => template.status === 'Active');
        },
        getTemplatesByAccount: (accountId) => {
          return get().templates.filter((template) => template.accountId === accountId);
        },
        getTemplatesByStatus: (status) => {
          return get().templates.filter((template) => template.status === status);
        },
      }),
      {
        name: 'recurring-incomes',
        storage,
        version: 1,
      },
    ),
  ),
);

