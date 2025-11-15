import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { ExpenseEMI } from '../types/emis';
import { useExpenseTransactionsStore } from './useExpenseTransactionsStore';
import { useRecurringExpensesStore } from './useRecurringExpensesStore';
import { useBankAccountsStore } from './useBankAccountsStore';
import { validateDateRange, validateAmount } from '../utils/validation';
import { getLocalforageStorage } from '../utils/storage';
import { convertExpenseEMIToRecurring, getNextDueDateFromEMI } from '../utils/emiRecurringConversion';

type ExpenseEMIsState = {
  emis: ExpenseEMI[];
  // CRUD operations
  createEMI: (emi: Omit<ExpenseEMI, 'id' | 'createdAt' | 'updatedAt' | 'completedInstallments'>) => void;
  updateEMI: (id: string, updates: Partial<Omit<ExpenseEMI, 'id' | 'createdAt'>>) => void;
  deleteEMI: (id: string) => void;
  getEMI: (id: string) => ExpenseEMI | undefined;
  // Status management
  pauseEMI: (id: string) => void;
  resumeEMI: (id: string) => void;
  // Auto-generation
  checkAndGenerateTransactions: () => void;
  getGeneratedTransactions: (emiId: string) => string[]; // Returns transaction IDs
  // Selectors
  getActiveEMIs: () => ExpenseEMI[];
  getEMIsByAccount: (accountId: string) => ExpenseEMI[];
  getEMIsByStatus: (status: ExpenseEMI['status']) => ExpenseEMI[];
  // Conversion
  convertToRecurring: (emiId: string) => string; // Returns new recurring template ID
};

const storage = getLocalforageStorage('expense-emis');

const calculateNextDueDate = (startDate: string, frequency: ExpenseEMI['frequency'], installmentNumber: number): string => {
  const start = new Date(startDate);
  const monthsToAdd = frequency === 'Monthly' ? installmentNumber : installmentNumber * 3;
  const nextDate = new Date(start.getFullYear(), start.getMonth() + monthsToAdd, start.getDate());
  return nextDate.toISOString().split('T')[0];
};

export const useExpenseEMIsStore = create<ExpenseEMIsState>()(
  devtools(
    persist(
      (set, get) => ({
        emis: [],
        createEMI: (emiData) => {
          // Validate accountId exists
          const account = useBankAccountsStore.getState().getAccount(emiData.accountId);
          if (!account) {
            throw new Error(`Account with id ${emiData.accountId} does not exist`);
          }
          
          // Validate creditCardId if provided (for CC EMIs)
          if (emiData.category === 'CCEMI' && emiData.creditCardId) {
            const creditCard = useBankAccountsStore.getState().getAccount(emiData.creditCardId);
            if (!creditCard) {
              throw new Error(`Credit card account with id ${emiData.creditCardId} does not exist`);
            }
            if (creditCard.accountType !== 'CreditCard') {
              throw new Error(`creditCardId must reference a CreditCard account, but found ${creditCard.accountType}`);
            }
          }
          
          // Validate date range
          const dateValidation = validateDateRange(emiData.startDate, emiData.endDate);
          if (!dateValidation.isValid) {
            throw new Error(`Date validation failed: ${dateValidation.errors.join(', ')}`);
          }
          
          // Validate amount
          const amountValidation = validateAmount(emiData.amount, 'EMI Amount');
          if (!amountValidation.isValid) {
            throw new Error(`Amount validation failed: ${amountValidation.errors.join(', ')}`);
          }
          
          // Validate totalInstallments
          if (emiData.totalInstallments <= 0) {
            throw new Error('Total installments must be greater than 0');
          }
          if (!Number.isInteger(emiData.totalInstallments)) {
            throw new Error('Total installments must be an integer');
          }
          
          const now = new Date().toISOString();
          const newEMI: ExpenseEMI = {
            ...emiData,
            completedInstallments: 0,
            id: typeof crypto !== 'undefined' && 'randomUUID' in crypto
              ? crypto.randomUUID()
              : `emi_exp_${Date.now()}_${Math.random().toString(36).slice(2)}`,
            createdAt: now,
            updatedAt: now,
          };
          set((state) => ({
            emis: [...state.emis, newEMI],
          }));
          // Auto-generate first transaction if start date is today or past
          get().checkAndGenerateTransactions();
        },
        updateEMI: (id, updates) => {
          // Validate accountId if being updated
          if (updates.accountId) {
            const account = useBankAccountsStore.getState().getAccount(updates.accountId);
            if (!account) {
              throw new Error(`Account with id ${updates.accountId} does not exist`);
            }
          }
          
          // Validate creditCardId if being updated
          if (updates.creditCardId !== undefined) {
            if (updates.creditCardId) {
              const creditCard = useBankAccountsStore.getState().getAccount(updates.creditCardId);
              if (!creditCard) {
                throw new Error(`Credit card account with id ${updates.creditCardId} does not exist`);
              }
              if (creditCard.accountType !== 'CreditCard') {
                throw new Error(`creditCardId must reference a CreditCard account, but found ${creditCard.accountType}`);
              }
            }
          }
          
          // Validate date range if dates are being updated
          if (updates.startDate || updates.endDate) {
            set((state) => {
              const emi = state.emis.find((e) => e.id === id);
              if (emi) {
                const startDate = updates.startDate || emi.startDate;
                const endDate = updates.endDate || emi.endDate;
                const dateValidation = validateDateRange(startDate, endDate);
                if (!dateValidation.isValid) {
                  throw new Error(`Date validation failed: ${dateValidation.errors.join(', ')}`);
                }
              }
              return state;
            });
          }
          
          // Validate amount if being updated
          if (updates.amount !== undefined) {
            const amountValidation = validateAmount(updates.amount, 'EMI Amount');
            if (!amountValidation.isValid) {
              throw new Error(`Amount validation failed: ${amountValidation.errors.join(', ')}`);
            }
          }
          
          // Validate totalInstallments if being updated
          if (updates.totalInstallments !== undefined) {
            const totalInstallments = updates.totalInstallments;
            if (totalInstallments <= 0) {
              throw new Error('Total installments must be greater than 0');
            }
            if (!Number.isInteger(totalInstallments)) {
              throw new Error('Total installments must be an integer');
            }
            // Check if new totalInstallments is less than current completedInstallments
            set((state) => {
              const emi = state.emis.find((e) => e.id === id);
              if (emi && totalInstallments < emi.completedInstallments) {
                throw new Error(`Total installments (${totalInstallments}) cannot be less than completed installments (${emi.completedInstallments})`);
              }
              return state;
            });
          }
          
          // Validate completedInstallments if being updated
          if (updates.completedInstallments !== undefined) {
            const completedInstallments = updates.completedInstallments;
            if (completedInstallments < 0) {
              throw new Error('Completed installments cannot be negative');
            }
            if (!Number.isInteger(completedInstallments)) {
              throw new Error('Completed installments must be an integer');
            }
            // Check if completedInstallments exceeds totalInstallments
            set((state) => {
              const emi = state.emis.find((e) => e.id === id);
              if (emi) {
                const totalInstallments = updates.totalInstallments !== undefined ? updates.totalInstallments : emi.totalInstallments;
                if (completedInstallments > totalInstallments) {
                  throw new Error(`Completed installments (${completedInstallments}) cannot exceed total installments (${totalInstallments})`);
                }
              }
              return state;
            });
          }
          
          set((state) => ({
            emis: state.emis.map((emi) =>
              emi.id === id
                ? { ...emi, ...updates, updatedAt: new Date().toISOString() }
                : emi
            ),
          }));
        },
        deleteEMI: (id) => {
          // Check if any transactions reference this EMI
          const transactions = useExpenseTransactionsStore.getState().transactions.filter(
            (t) => t.emiId === id
          );
          
          if (transactions.length > 0) {
            throw new Error(
              `Cannot delete EMI: ${transactions.length} expense transaction(s) still reference it. ` +
              `Please delete or update the transactions first.`
            );
          }
          
          set((state) => ({
            emis: state.emis.filter((emi) => emi.id !== id),
          }));
        },
        getEMI: (id) => {
          return get().emis.find((emi) => emi.id === id);
        },
        pauseEMI: (id) => {
          get().updateEMI(id, { status: 'Paused' });
        },
        resumeEMI: (id) => {
          get().updateEMI(id, { status: 'Active' });
        },
        checkAndGenerateTransactions: () => {
          const today = new Date().toISOString().split('T')[0];
          const activeEMIs = get().getActiveEMIs();
          
          activeEMIs.forEach((emi) => {
            const nextDueDate = calculateNextDueDate(emi.startDate, emi.frequency, emi.completedInstallments);
            
            if (nextDueDate <= today && emi.completedInstallments < emi.totalInstallments) {
              // Check if transaction already exists for this EMI and date
              const existingTransactions = useExpenseTransactionsStore.getState().transactions.filter(
                (t) => t.emiId === emi.id && t.date === nextDueDate
              );
              
              if (existingTransactions.length === 0) {
                // Create transaction
                useExpenseTransactionsStore.getState().createTransaction({
                  date: nextDueDate,
                  amount: emi.amount,
                  accountId: emi.accountId,
                  category: emi.category === 'CCEMI' ? 'CCBill' : 'Other',
                  description: `${emi.name} - Installment ${emi.completedInstallments + 1}`,
                  bucket: emi.category === 'CCEMI' ? 'CCBill' : 'Expense',
                  status: 'Pending',
                  emiId: emi.id,
                });
                
                // Update EMI
                const newCompletedCount = emi.completedInstallments + 1;
                get().updateEMI(emi.id, {
                  completedInstallments: newCompletedCount,
                  status: newCompletedCount >= emi.totalInstallments ? 'Completed' : emi.status,
                });
              }
            }
          });
        },
        getGeneratedTransactions: (emiId) => {
          return useExpenseTransactionsStore
            .getState()
            .transactions.filter((t) => t.emiId === emiId)
            .map((t) => t.id);
        },
        getActiveEMIs: () => {
          return get().emis.filter((emi) => emi.status === 'Active');
        },
        getEMIsByAccount: (accountId) => {
          return get().emis.filter((emi) => emi.accountId === accountId);
        },
        getEMIsByStatus: (status) => {
          return get().emis.filter((emi) => emi.status === status);
        },
        convertToRecurring: (emiId) => {
          const emi = get().getEMI(emiId);
          if (!emi) {
            throw new Error(`EMI with id ${emiId} does not exist`);
          }

          // Convert EMI to Recurring template
          const convertedData = convertExpenseEMIToRecurring(emi);
          const nextDueDate = getNextDueDateFromEMI(emi);

          // Create new recurring template
          useRecurringExpensesStore.getState().createTemplate({
            ...convertedData,
            nextDueDate,
          });

          // Get the newly created template (find the most recent one that matches)
          const allTemplates = useRecurringExpensesStore.getState().templates;
          const matchingTemplates = allTemplates.filter(
            (t) => t.name === emi.name && t.accountId === emi.accountId && t.amount === emi.amount
          );
          // Sort by createdAt descending and get the first (most recent)
          const newTemplate = matchingTemplates.sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
          
          if (!newTemplate) {
            throw new Error('Failed to create recurring template');
          }

          // Update all transactions that reference this EMI to reference the new recurring template
          const transactions = useExpenseTransactionsStore.getState().transactions.filter((t) => t.emiId === emiId);
          transactions.forEach((transaction) => {
            useExpenseTransactionsStore.getState().updateTransaction(transaction.id, {
              emiId: undefined,
              recurringTemplateId: newTemplate.id,
            });
          });

          // Delete the old EMI
          get().deleteEMI(emiId);

          return newTemplate.id;
        },
      }),
      {
        name: 'expense-emis',
        storage,
        version: 1,
      },
    ),
  ),
);

