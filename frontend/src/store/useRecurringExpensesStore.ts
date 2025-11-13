import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { RecurringExpense } from '../types/recurring';
import { useExpenseTransactionsStore } from './useExpenseTransactionsStore';
import { useBankAccountsStore } from './useBankAccountsStore';
import { getLocalforageStorage } from '../utils/storage';

type RecurringExpensesState = {
  templates: RecurringExpense[];
  // CRUD operations
  createTemplate: (template: Omit<RecurringExpense, 'id' | 'createdAt' | 'updatedAt' | 'nextDueDate'>) => void;
  updateTemplate: (id: string, updates: Partial<Omit<RecurringExpense, 'id' | 'createdAt'>>) => void;
  deleteTemplate: (id: string) => void;
  getTemplate: (id: string) => RecurringExpense | undefined;
  // Status management
  pauseTemplate: (id: string) => void;
  resumeTemplate: (id: string) => void;
  // Auto-generation
  checkAndGenerateTransactions: () => void;
  getGeneratedTransactions: (templateId: string) => string[]; // Returns transaction IDs
  // Selectors
  getActiveTemplates: () => RecurringExpense[];
  getTemplatesByAccount: (accountId: string) => RecurringExpense[];
  getTemplatesByStatus: (status: RecurringExpense['status']) => RecurringExpense[];
};

const storage = getLocalforageStorage('recurring-expenses');

const calculateNextDueDate = (
  lastDate: string,
  frequency: RecurringExpense['frequency']
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

export const useRecurringExpensesStore = create<RecurringExpensesState>()(
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
          
          const now = new Date().toISOString();
          const nextDueDate = templateData.startDate;
          const newTemplate: RecurringExpense = {
            ...templateData,
            nextDueDate,
            id: typeof crypto !== 'undefined' && 'randomUUID' in crypto
              ? crypto.randomUUID()
              : `recur_exp_${Date.now()}_${Math.random().toString(36).slice(2)}`,
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
          
          set((state) => ({
            templates: state.templates.map((template) =>
              template.id === id
                ? { ...template, ...updates, updatedAt: new Date().toISOString() }
                : template
            ),
          }));
        },
        deleteTemplate: (id) => {
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
              const existingTransactions = useExpenseTransactionsStore.getState().transactions.filter(
                (t) => t.recurringTemplateId === template.id && t.date === template.nextDueDate
              );
              
              if (existingTransactions.length === 0) {
                // Create transaction
                useExpenseTransactionsStore.getState().createTransaction({
                  date: template.nextDueDate,
                  amount: template.amount,
                  accountId: template.accountId,
                  category: template.category,
                  description: template.name,
                  bucket: template.bucket,
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
          return useExpenseTransactionsStore
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
        name: 'recurring-expenses',
        storage,
        version: 1,
      },
    ),
  ),
);

