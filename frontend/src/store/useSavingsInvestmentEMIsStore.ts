import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { SavingsInvestmentEMI } from '../types/emis';
import { useSavingsInvestmentTransactionsStore } from './useSavingsInvestmentTransactionsStore';
import { useBankAccountsStore } from './useBankAccountsStore';
import { validateDateRange, validateAmount } from '../utils/validation';
import { getLocalforageStorage } from '../utils/storage';

type SavingsInvestmentEMIsState = {
  emis: SavingsInvestmentEMI[];
  // CRUD operations
  createEMI: (emi: Omit<SavingsInvestmentEMI, 'id' | 'createdAt' | 'updatedAt' | 'completedInstallments'>) => void;
  updateEMI: (id: string, updates: Partial<Omit<SavingsInvestmentEMI, 'id' | 'createdAt'>>) => void;
  deleteEMI: (id: string) => void;
  getEMI: (id: string) => SavingsInvestmentEMI | undefined;
  // Status management
  pauseEMI: (id: string) => void;
  resumeEMI: (id: string) => void;
  // Auto-generation
  checkAndGenerateTransactions: () => void;
  getGeneratedTransactions: (emiId: string) => string[]; // Returns transaction IDs
  // Selectors
  getActiveEMIs: () => SavingsInvestmentEMI[];
  getEMIsByAccount: (accountId: string) => SavingsInvestmentEMI[];
  getEMIsByStatus: (status: SavingsInvestmentEMI['status']) => SavingsInvestmentEMI[];
};

const storage = getLocalforageStorage('savings-investment-emis');

const calculateNextDueDate = (startDate: string, frequency: SavingsInvestmentEMI['frequency'], installmentNumber: number): string => {
  const start = new Date(startDate);
  const monthsToAdd = frequency === 'Monthly' ? installmentNumber : installmentNumber * 3;
  const nextDate = new Date(start.getFullYear(), start.getMonth() + monthsToAdd, start.getDate());
  return nextDate.toISOString().split('T')[0];
};

export const useSavingsInvestmentEMIsStore = create<SavingsInvestmentEMIsState>()(
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
          
          const now = new Date().toISOString();
          const newEMI: SavingsInvestmentEMI = {
            ...emiData,
            completedInstallments: 0,
            id: typeof crypto !== 'undefined' && 'randomUUID' in crypto
              ? crypto.randomUUID()
              : `emi_sav_${Date.now()}_${Math.random().toString(36).slice(2)}`,
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
          const transactions = useSavingsInvestmentTransactionsStore.getState().transactions.filter(
            (t) => t.emiId === id
          );
          
          if (transactions.length > 0) {
            throw new Error(
              `Cannot delete EMI: ${transactions.length} savings/investment transaction(s) still reference it. ` +
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
              const existingTransactions = useSavingsInvestmentTransactionsStore.getState().transactions.filter(
                (t) => t.emiId === emi.id && t.date === nextDueDate
              );
              
              if (existingTransactions.length === 0) {
                // Create transaction
                useSavingsInvestmentTransactionsStore.getState().createTransaction({
                  date: nextDueDate,
                  amount: emi.amount,
                  accountId: emi.accountId,
                  destination: emi.destination,
                  type: 'SIP',
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
          return useSavingsInvestmentTransactionsStore
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
        name: 'savings-investment-emis',
        storage,
        version: 1,
      },
    ),
  ),
);

