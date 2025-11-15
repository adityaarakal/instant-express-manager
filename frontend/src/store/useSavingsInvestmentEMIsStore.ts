import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { SavingsInvestmentEMI } from '../types/emis';
import type { RecurringSavingsInvestment } from '../types/recurring';
import { useSavingsInvestmentTransactionsStore } from './useSavingsInvestmentTransactionsStore';
import { useRecurringSavingsInvestmentsStore } from './useRecurringSavingsInvestmentsStore';
import { useBankAccountsStore } from './useBankAccountsStore';
import { validateDateRange, validateAmount, validateDate } from '../utils/validation';
import { getLocalforageStorage } from '../utils/storage';
import { convertSavingsEMIToRecurring, getNextDueDateFromEMI } from '../utils/emiRecurringConversion';
import { getEffectiveEMIDeductionDate, calculateNextDateFromDate, calculateDateOffset, addDaysToDate } from '../utils/dateCalculations';

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
  // Conversion
  convertToRecurring: (emiId: string) => string; // Returns new recurring template ID
  // Date Management
  updateDeductionDate: (emiId: string, newDate: string, updateOption: 'this-date-only' | 'all-future' | 'reset-schedule') => void;
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
          
          // Validate totalInstallments
          if (emiData.totalInstallments <= 0) {
            throw new Error('Total installments must be greater than 0');
          }
          if (!Number.isInteger(emiData.totalInstallments)) {
            throw new Error('Total installments must be an integer');
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
            // Use deductionDate if set, otherwise calculate from installments
            const deductionDate = getEffectiveEMIDeductionDate(emi);
            
            if (deductionDate <= today && emi.completedInstallments < emi.totalInstallments) {
              // Check if transaction already exists for this EMI and date
              const existingTransactions = useSavingsInvestmentTransactionsStore.getState().transactions.filter(
                (t) => t.emiId === emi.id && t.date === deductionDate
              );
              
              if (existingTransactions.length === 0) {
                // Create transaction
                useSavingsInvestmentTransactionsStore.getState().createTransaction({
                  date: deductionDate,
                  amount: emi.amount,
                  accountId: emi.accountId,
                  destination: emi.destination,
                  type: 'SIP',
                  status: 'Pending',
                  emiId: emi.id,
                });
                
                // Update EMI
                const newCompletedCount = emi.completedInstallments + 1;
                const updateData: Partial<SavingsInvestmentEMI> = {
                  completedInstallments: newCompletedCount,
                  status: newCompletedCount >= emi.totalInstallments ? 'Completed' : emi.status,
                };
                
                // If deductionDate was set, calculate next date based on frequency
                if (emi.deductionDate) {
                  updateData.deductionDate = calculateNextDateFromDate(deductionDate, emi.frequency);
                }
                
                get().updateEMI(emi.id, updateData);
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
        convertToRecurring: (emiId) => {
          const emi = get().getEMI(emiId);
          if (!emi) {
            throw new Error(`EMI with id ${emiId} does not exist`);
          }

          // Get all transactions BEFORE conversion to ensure we capture them all
          const transactions = useSavingsInvestmentTransactionsStore.getState().transactions.filter((t) => t.emiId === emiId);

          // Convert EMI to Recurring template
          const convertedData = convertSavingsEMIToRecurring(emi);
          const nextDueDate = getNextDueDateFromEMI(emi);

          // Create new recurring template manually (without auto-generation)
          // This prevents checkAndGenerateTransactions() from creating unwanted transactions
          const now = new Date().toISOString();
          const newTemplate: RecurringSavingsInvestment = {
            ...convertedData,
            nextDueDate,
            id: typeof crypto !== 'undefined' && 'randomUUID' in crypto
              ? crypto.randomUUID()
              : `recur_sav_${Date.now()}_${Math.random().toString(36).slice(2)}`,
            createdAt: now,
            updatedAt: now,
          };
          
          // Manually add template to store (bypassing createTemplate to avoid auto-generation)
          useRecurringSavingsInvestmentsStore.setState((state) => ({
            templates: [...state.templates, newTemplate],
          }));

          // Update all transactions that reference this EMI to reference the new recurring template
          transactions.forEach((transaction) => {
            useSavingsInvestmentTransactionsStore.getState().updateTransaction(transaction.id, {
              emiId: undefined,
              recurringTemplateId: newTemplate.id,
            });
          });

          // Delete the old EMI (this won't affect transactions since we've already updated them)
          get().deleteEMI(emiId);

          // Clean up: Remove any auto-generated transactions that might have been created
          // (in case createTemplate was called, though we're now bypassing it)
          const autoGeneratedTransactions = useSavingsInvestmentTransactionsStore.getState().transactions.filter(
            (t) => t.recurringTemplateId === newTemplate.id && 
                   t.emiId === undefined &&
                   !transactions.some(ot => ot.id === t.id)
          );
          autoGeneratedTransactions.forEach((transaction) => {
            useSavingsInvestmentTransactionsStore.getState().deleteTransaction(transaction.id);
          });

          return newTemplate.id;
        },
        updateDeductionDate: (emiId, newDate, updateOption) => {
          const emi = get().getEMI(emiId);
          if (!emi) {
            throw new Error(`EMI with id ${emiId} does not exist`);
          }

          // Validate new date
          const dateValidation = validateDate(newDate, 'Deduction Date');
          if (!dateValidation.isValid) {
            throw new Error(`Date validation failed: ${dateValidation.errors.join(', ')}`);
          }

          const transactionsStore = useSavingsInvestmentTransactionsStore.getState();
          const existingTransactions = transactionsStore.transactions.filter((t) => t.emiId === emiId);

          switch (updateOption) {
            case 'this-date-only':
              // Just update the deductionDate
              get().updateEMI(emiId, { deductionDate: newDate });
              break;

            case 'all-future':
              // Update deductionDate and shift all future pending transactions by the offset
              const currentDeductionDate = getEffectiveEMIDeductionDate(emi);
              const offset = calculateDateOffset(currentDeductionDate, newDate);
              
              // Update EMI
              get().updateEMI(emiId, { deductionDate: newDate });
              
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
              get().updateEMI(emiId, { deductionDate: newDate });
              
              // Recalculate all future pending transactions based on new date
              let currentDate = newDate;
              existingTransactions
                .filter((t) => t.status === 'Pending' && t.date >= getEffectiveEMIDeductionDate(emi))
                .sort((a, b) => a.date.localeCompare(b.date))
                .forEach((transaction, index) => {
                  if (index === 0) {
                    currentDate = newDate;
                  } else {
                    currentDate = calculateNextDateFromDate(currentDate, emi.frequency);
                  }
                  transactionsStore.updateTransaction(transaction.id, { date: currentDate });
                });
              break;
          }
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

