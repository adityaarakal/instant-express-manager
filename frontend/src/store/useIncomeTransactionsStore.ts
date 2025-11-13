import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { IncomeTransaction } from '../types/transactions';
import { getLocalforageStorage } from '../utils/storage';
import { useRecurringIncomesStore } from './useRecurringIncomesStore';
import { useBankAccountsStore } from './useBankAccountsStore';

type IncomeTransactionsState = {
  transactions: IncomeTransaction[];
  // CRUD operations
  createTransaction: (transaction: Omit<IncomeTransaction, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateTransaction: (id: string, updates: Partial<Omit<IncomeTransaction, 'id' | 'createdAt'>>) => void;
  deleteTransaction: (id: string) => void;
  getTransaction: (id: string) => IncomeTransaction | undefined;
  // Selectors
  getTransactionsByAccount: (accountId: string) => IncomeTransaction[];
  getTransactionsByDateRange: (startDate: string, endDate: string) => IncomeTransaction[];
  getTransactionsByCategory: (category: IncomeTransaction['category']) => IncomeTransaction[];
  getTotalByMonth: (monthId: string) => number; // monthId format: "YYYY-MM"
  getTotalByAccount: (accountId: string) => number;
};

const storage = getLocalforageStorage('income-transactions');

export const useIncomeTransactionsStore = create<IncomeTransactionsState>()(
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
            const template = useRecurringIncomesStore.getState().getTemplate(transactionData.recurringTemplateId);
            if (!template) {
              throw new Error(`Recurring income template with id ${transactionData.recurringTemplateId} does not exist`);
            }
          }
          
          const now = new Date().toISOString();
          const newTransaction: IncomeTransaction = {
            ...transactionData,
            id: typeof crypto !== 'undefined' && 'randomUUID' in crypto
              ? crypto.randomUUID()
              : `income_${Date.now()}_${Math.random().toString(36).slice(2)}`,
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
              const template = useRecurringIncomesStore.getState().getTemplate(updates.recurringTemplateId);
              if (!template) {
                throw new Error(`Recurring income template with id ${updates.recurringTemplateId} does not exist`);
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
        getTransactionsByCategory: (category) => {
          return get().transactions.filter((transaction) => transaction.category === category);
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
      }),
      {
        name: 'income-transactions',
        storage,
        version: 1,
      },
    ),
  ),
);

