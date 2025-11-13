import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { SavingsInvestmentTransaction } from '../types/transactions';
import { getLocalforageStorage } from '../utils/storage';
import { useRecurringSavingsInvestmentsStore } from './useRecurringSavingsInvestmentsStore';
import { useSavingsInvestmentEMIsStore } from './useSavingsInvestmentEMIsStore';
import { useBankAccountsStore } from './useBankAccountsStore';

type SavingsInvestmentTransactionsState = {
  transactions: SavingsInvestmentTransaction[];
  // CRUD operations
  createTransaction: (transaction: Omit<SavingsInvestmentTransaction, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateTransaction: (id: string, updates: Partial<Omit<SavingsInvestmentTransaction, 'id' | 'createdAt'>>) => void;
  deleteTransaction: (id: string) => void;
  getTransaction: (id: string) => SavingsInvestmentTransaction | undefined;
  // Selectors
  getTransactionsByAccount: (accountId: string) => SavingsInvestmentTransaction[];
  getTransactionsByDateRange: (startDate: string, endDate: string) => SavingsInvestmentTransaction[];
  getTransactionsByType: (type: SavingsInvestmentTransaction['type']) => SavingsInvestmentTransaction[];
  getTransactionsByDestination: (destination: string) => SavingsInvestmentTransaction[];
  getTotalByMonth: (monthId: string) => number;
  getTotalByAccount: (accountId: string) => number;
  getTotalSavingsTransfer: (accountId: string, monthId?: string) => number;
};

const storage = getLocalforageStorage('savings-investment-transactions');

export const useSavingsInvestmentTransactionsStore = create<SavingsInvestmentTransactionsState>()(
  devtools(
    persist(
      (set, get) => ({
        transactions: [],
        createTransaction: (transactionData) => {
          // Validate accountId exists
          const account = useBankAccountsStore.getState().getAccount(transactionData.accountId);
          if (!account) {
            throw new Error(`Account with id ${transactionData.accountId} does not exist`);
          }
          
          // Validate recurringTemplateId if provided
          if (transactionData.recurringTemplateId) {
            const template = useRecurringSavingsInvestmentsStore.getState().getTemplate(transactionData.recurringTemplateId);
            if (!template) {
              throw new Error(`Recurring savings/investment template with id ${transactionData.recurringTemplateId} does not exist`);
            }
          }
          
          // Validate emiId if provided
          if (transactionData.emiId) {
            const emi = useSavingsInvestmentEMIsStore.getState().getEMI(transactionData.emiId);
            if (!emi) {
              throw new Error(`Savings/Investment EMI with id ${transactionData.emiId} does not exist`);
            }
          }
          
          const now = new Date().toISOString();
          const newTransaction: SavingsInvestmentTransaction = {
            ...transactionData,
            id: typeof crypto !== 'undefined' && 'randomUUID' in crypto
              ? crypto.randomUUID()
              : `savings_${Date.now()}_${Math.random().toString(36).slice(2)}`,
            createdAt: now,
            updatedAt: now,
          };
          set((state) => ({
            transactions: [...state.transactions, newTransaction],
          }));
        },
        updateTransaction: (id, updates) => {
          // Validate accountId if being updated
          if (updates.accountId) {
            const account = useBankAccountsStore.getState().getAccount(updates.accountId);
            if (!account) {
              throw new Error(`Account with id ${updates.accountId} does not exist`);
            }
          }
          
          // Validate recurringTemplateId if being updated
          if (updates.recurringTemplateId !== undefined) {
            if (updates.recurringTemplateId) {
              const template = useRecurringSavingsInvestmentsStore.getState().getTemplate(updates.recurringTemplateId);
              if (!template) {
                throw new Error(`Recurring savings/investment template with id ${updates.recurringTemplateId} does not exist`);
              }
            }
          }
          
          // Validate emiId if being updated
          if (updates.emiId !== undefined) {
            if (updates.emiId) {
              const emi = useSavingsInvestmentEMIsStore.getState().getEMI(updates.emiId);
              if (!emi) {
                throw new Error(`Savings/Investment EMI with id ${updates.emiId} does not exist`);
              }
            }
          }
          
          set((state) => ({
            transactions: state.transactions.map((transaction) =>
              transaction.id === id
                ? { ...transaction, ...updates, updatedAt: new Date().toISOString() }
                : transaction
            ),
          }));
        },
        deleteTransaction: (id) => {
          set((state) => ({
            transactions: state.transactions.filter((transaction) => transaction.id !== id),
          }));
        },
        getTransaction: (id) => {
          return get().transactions.find((transaction) => transaction.id === id);
        },
        getTransactionsByAccount: (accountId) => {
          return get().transactions.filter((transaction) => transaction.accountId === accountId);
        },
        getTransactionsByDateRange: (startDate, endDate) => {
          return get().transactions.filter(
            (transaction) => transaction.date >= startDate && transaction.date <= endDate
          );
        },
        getTransactionsByType: (type) => {
          return get().transactions.filter((transaction) => transaction.type === type);
        },
        getTransactionsByDestination: (destination) => {
          return get().transactions.filter((transaction) => transaction.destination === destination);
        },
        getTotalByMonth: (monthId) => {
          const [year, month] = monthId.split('-');
          const startDate = `${year}-${month}-01`;
          const endDate = `${year}-${month}-31`;
          return get()
            .getTransactionsByDateRange(startDate, endDate)
            .reduce((sum, t) => sum + t.amount, 0);
        },
        getTotalByAccount: (accountId) => {
          return get()
            .getTransactionsByAccount(accountId)
            .reduce((sum, t) => sum + t.amount, 0);
        },
        getTotalSavingsTransfer: (accountId, monthId) => {
          let transactions = get().getTransactionsByAccount(accountId);
          if (monthId) {
            const [year, month] = monthId.split('-');
            const startDate = `${year}-${month}-01`;
            const endDate = `${year}-${month}-31`;
            transactions = transactions.filter(
              (t) => t.date >= startDate && t.date <= endDate
            );
          }
          return transactions.reduce((sum, t) => sum + t.amount, 0);
        },
      }),
      {
        name: 'savings-investment-transactions',
        storage,
        version: 1,
      },
    ),
  ),
);

