import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { RecurringSavingsInvestment } from '../types/recurring';
import { useSavingsInvestmentTransactionsStore } from './useSavingsInvestmentTransactionsStore';
import { useSavingsInvestmentEMIsStore } from './useSavingsInvestmentEMIsStore';
import { useBankAccountsStore } from './useBankAccountsStore';
import { validateDate, validateAmount, validateDateRange } from '../utils/validation';
import { getLocalforageStorage } from '../utils/storage';
import { convertRecurringSavingsToEMI } from '../utils/emiRecurringConversion';
import { getEffectiveRecurringDeductionDate, calculateNextDateFromDate, calculateDateOffset, addDaysToDate } from '../utils/dateCalculations';

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
  // Conversion
  convertToEMI: (templateId: string) => string; // Returns new EMI ID
  // Date Management
  updateDeductionDate: (templateId: string, newDate: string, updateOption: 'this-date-only' | 'all-future' | 'reset-schedule') => void;
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
          const transactions = useSavingsInvestmentTransactionsStore.getState().transactions.filter(
            (t) => t.recurringTemplateId === id
          );
          
          if (transactions.length > 0) {
            throw new Error(
              `Cannot delete recurring savings/investment template: ${transactions.length} savings/investment transaction(s) still reference it. ` +
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
        convertToEMI: (templateId) => {
          const template = get().getTemplate(templateId);
          if (!template) {
            throw new Error(`Recurring template with id ${templateId} does not exist`);
          }

          // Convert Recurring template to EMI
          const convertedData = convertRecurringSavingsToEMI(template);

          // Create new EMI
          useSavingsInvestmentEMIsStore.getState().createEMI(convertedData);

          // Get the newly created EMI (find the most recent one that matches)
          const allEMIs = useSavingsInvestmentEMIsStore.getState().emis;
          const matchingEMIs = allEMIs.filter(
            (e) => e.name === template.name && e.accountId === template.accountId && e.amount === template.amount
          );
          // Sort by createdAt descending and get the first (most recent)
          const newEMI = matchingEMIs.sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
          
          if (!newEMI) {
            throw new Error('Failed to create EMI');
          }

          // Update all transactions that reference this recurring template to reference the new EMI
          const transactions = useSavingsInvestmentTransactionsStore.getState().transactions.filter((t) => t.recurringTemplateId === templateId);
          transactions.forEach((transaction) => {
            useSavingsInvestmentTransactionsStore.getState().updateTransaction(transaction.id, {
              recurringTemplateId: undefined,
              emiId: newEMI.id,
            });
          });

          // Delete the old recurring template
          get().deleteTemplate(templateId);

          return newEMI.id;
        },
        updateDeductionDate: (templateId, newDate, updateOption) => {
          const template = get().getTemplate(templateId);
          if (!template) {
            throw new Error(`Recurring template with id ${templateId} does not exist`);
          }

          // Validate new date
          const dateValidation = validateDate(newDate, 'Deduction Date');
          if (!dateValidation.isValid) {
            throw new Error(`Date validation failed: ${dateValidation.errors.join(', ')}`);
          }

          const transactionsStore = useSavingsInvestmentTransactionsStore.getState();
          const existingTransactions = transactionsStore.transactions.filter((t) => t.recurringTemplateId === templateId);

          switch (updateOption) {
            case 'this-date-only':
              // Just update the deductionDate
              get().updateTemplate(templateId, { deductionDate: newDate });
              break;

            case 'all-future':
              // Update deductionDate and shift all future pending transactions by the offset
              const currentDeductionDate = getEffectiveRecurringDeductionDate(template);
              const offset = calculateDateOffset(currentDeductionDate, newDate);
              
              // Update template
              get().updateTemplate(templateId, { deductionDate: newDate });
              
              // Update all future pending transactions
              existingTransactions
                .filter((t) => t.status === 'Pending' && t.date >= currentDeductionDate)
                .forEach((transaction) => {
                  const newTransactionDate = addDaysToDate(transaction.date, offset);
                  transactionsStore.updateTransaction(transaction.id, { date: newTransactionDate });
                });
              break;

            case 'reset-schedule':
              // Reset deductionDate and recalculate future transactions
              get().updateTemplate(templateId, { deductionDate: newDate });
              
              // Recalculate all future pending transactions based on new date
              let currentDate = newDate;
              existingTransactions
                .filter((t) => t.status === 'Pending' && t.date >= getEffectiveRecurringDeductionDate(template))
                .sort((a, b) => a.date.localeCompare(b.date))
                .forEach((transaction, index) => {
                  if (index === 0) {
                    currentDate = newDate;
                  } else {
                    currentDate = calculateNextDateFromDate(currentDate, template.frequency);
                  }
                  transactionsStore.updateTransaction(transaction.id, { date: currentDate });
                });
              break;
          }
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

