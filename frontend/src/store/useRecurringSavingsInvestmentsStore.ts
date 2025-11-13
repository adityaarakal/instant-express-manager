import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { RecurringSavingsInvestment } from '../types/recurring';
import { useSavingsInvestmentTransactionsStore } from './useSavingsInvestmentTransactionsStore';
import { useBankAccountsStore } from './useBankAccountsStore';
import { getLocalforageStorage } from '../utils/storage';

type RecurringSavingsInvestmentsState = {
  templates: RecurringSavingsInvestment[];
  // CRUD operations
  createTemplate: (template: Omit<RecurringSavingsInvestment, 'id' | 'createdAt' | 'updatedAt' | 'nextDueDate'>) => void;
  updateTemplate: (id: string, updates: Partial<Omit<RecurringSavingsInvestment, 'id' | 'createdAt'>>) => void;
  deleteTemplate: (id: string) => void;
  getTemplate: (id: string) => RecurringSavingsInvestment | undefined;
  // Status management
  pauseTemplate: (id: string) => void;
  resumeTemplate: (id: string) => void;
  // Auto-generation
  checkAndGenerateTransactions: () => void;
  getGeneratedTransactions: (templateId: string) => string[]; // Returns transaction IDs
  // Selectors
  getActiveTemplates: () => RecurringSavingsInvestment[];
  getTemplatesByAccount: (accountId: string) => RecurringSavingsInvestment[];
  getTemplatesByStatus: (status: RecurringSavingsInvestment['status']) => RecurringSavingsInvestment[];
};

const storage = getLocalforageStorage('recurring-savings-investments');

const calculateNextDueDate = (
  lastDate: string,
  frequency: RecurringSavingsInvestment['frequency']
): string => {
  const date = new Date(lastDate);
  switch (frequency) {
    case 'Monthly':
      date.setMonth(date.getMonth() + 1);
      break;
    case 'Quarterly':
      date.setMonth(date.getMonth() + 3);
      break;
    case 'Yearly':
      date.setFullYear(date.getFullYear() + 1);
      break;
    default:
      date.setMonth(date.getMonth() + 1);
  }
  return date.toISOString().split('T')[0];
};

export const useRecurringSavingsInvestmentsStore = create<RecurringSavingsInvestmentsState>()(
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
          const newTemplate: RecurringSavingsInvestment = {
            ...templateData,
            nextDueDate,
            id: typeof crypto !== 'undefined' && 'randomUUID' in crypto
              ? crypto.randomUUID()
              : `recur_sav_${Date.now()}_${Math.random().toString(36).slice(2)}`,
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
              const existingTransactions = useSavingsInvestmentTransactionsStore.getState().transactions.filter(
                (t) => t.recurringTemplateId === template.id && t.date === template.nextDueDate
              );
              
              if (existingTransactions.length === 0) {
                // Create transaction
                useSavingsInvestmentTransactionsStore.getState().createTransaction({
                  date: template.nextDueDate,
                  amount: template.amount,
                  accountId: template.accountId,
                  destination: template.destination,
                  type: template.type,
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
          return useSavingsInvestmentTransactionsStore
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
        name: 'recurring-savings-investments',
        storage,
        version: 1,
      },
    ),
  ),
);

