import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { ExpenseEMI } from '../types/emis';
import { useExpenseTransactionsStore } from './useExpenseTransactionsStore';
import { useBankAccountsStore } from './useBankAccountsStore';
import { getLocalforageStorage } from '../utils/storage';

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
          
          set((state) => ({
            emis: state.emis.map((emi) =>
              emi.id === id
                ? { ...emi, ...updates, updatedAt: new Date().toISOString() }
                : emi
            ),
          }));
        },
        deleteEMI: (id) => {
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
      }),
      {
        name: 'expense-emis',
        storage,
        version: 1,
      },
    ),
  ),
);

