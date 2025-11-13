import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { ExpenseTransaction } from '../types/transactions';
import { getLocalforageStorage } from '../utils/storage';
import { useRecurringExpensesStore } from './useRecurringExpensesStore';
import { useExpenseEMIsStore } from './useExpenseEMIsStore';

type ExpenseTransactionsState = {
  transactions: ExpenseTransaction[];
  // CRUD operations
  createTransaction: (transaction: Omit<ExpenseTransaction, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateTransaction: (id: string, updates: Partial<Omit<ExpenseTransaction, 'id' | 'createdAt'>>) => void;
  deleteTransaction: (id: string) => void;
  getTransaction: (id: string) => ExpenseTransaction | undefined;
  // Selectors
  getTransactionsByAccount: (accountId: string) => ExpenseTransaction[];
  getTransactionsByDateRange: (startDate: string, endDate: string) => ExpenseTransaction[];
  getTransactionsByCategory: (category: ExpenseTransaction['category']) => ExpenseTransaction[];
  getTransactionsByBucket: (bucket: ExpenseTransaction['bucket']) => ExpenseTransaction[];
  getTransactionsByStatus: (status: ExpenseTransaction['status']) => ExpenseTransaction[];
  getTotalByMonth: (monthId: string) => number;
  getTotalByBucket: (bucket: ExpenseTransaction['bucket'], monthId?: string) => number;
  getPendingTotalByBucket: (bucket: ExpenseTransaction['bucket'], monthId?: string) => number;
  getPaidTotalByBucket: (bucket: ExpenseTransaction['bucket'], monthId?: string) => number;
};

const storage = getLocalforageStorage('expense-transactions');

export const useExpenseTransactionsStore = create<ExpenseTransactionsState>()(
  devtools(
    persist(
      (set, get) => ({
        transactions: [],
        createTransaction: (transactionData) => {
          // Validate recurringTemplateId if provided
          if (transactionData.recurringTemplateId) {
            const template = useRecurringExpensesStore.getState().getTemplate(transactionData.recurringTemplateId);
            if (!template) {
              throw new Error(`Recurring expense template with id ${transactionData.recurringTemplateId} does not exist`);
            }
          }
          
          // Validate emiId if provided
          if (transactionData.emiId) {
            const emi = useExpenseEMIsStore.getState().getEMI(transactionData.emiId);
            if (!emi) {
              throw new Error(`Expense EMI with id ${transactionData.emiId} does not exist`);
            }
          }
          
          const now = new Date().toISOString();
          const newTransaction: ExpenseTransaction = {
            ...transactionData,
            id: typeof crypto !== 'undefined' && 'randomUUID' in crypto
              ? crypto.randomUUID()
              : `expense_${Date.now()}_${Math.random().toString(36).slice(2)}`,
            createdAt: now,
            updatedAt: now,
          };
          set((state) => ({
            transactions: [...state.transactions, newTransaction],
          }));
        },
        updateTransaction: (id, updates) => {
          // Validate recurringTemplateId if being updated
          if (updates.recurringTemplateId !== undefined) {
            if (updates.recurringTemplateId) {
              const template = useRecurringExpensesStore.getState().getTemplate(updates.recurringTemplateId);
              if (!template) {
                throw new Error(`Recurring expense template with id ${updates.recurringTemplateId} does not exist`);
              }
            }
          }
          
          // Validate emiId if being updated
          if (updates.emiId !== undefined) {
            if (updates.emiId) {
              const emi = useExpenseEMIsStore.getState().getEMI(updates.emiId);
              if (!emi) {
                throw new Error(`Expense EMI with id ${updates.emiId} does not exist`);
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
        getTransactionsByBucket: (bucket) => {
          return get().transactions.filter((transaction) => transaction.bucket === bucket);
        },
        getTransactionsByStatus: (status) => {
          return get().transactions.filter((transaction) => transaction.status === status);
        },
        getTotalByMonth: (monthId) => {
          const [year, month] = monthId.split('-');
          const startDate = `${year}-${month}-01`;
          const endDate = `${year}-${month}-31`;
          return get()
            .getTransactionsByDateRange(startDate, endDate)
            .reduce((sum, t) => sum + t.amount, 0);
        },
        getTotalByBucket: (bucket, monthId) => {
          let transactions = get().getTransactionsByBucket(bucket);
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
        getPendingTotalByBucket: (bucket, monthId) => {
          let transactions = get().getTransactionsByBucket(bucket).filter((t) => t.status === 'Pending');
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
        getPaidTotalByBucket: (bucket, monthId) => {
          let transactions = get().getTransactionsByBucket(bucket).filter((t) => t.status === 'Paid');
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
        name: 'expense-transactions',
        storage,
        version: 1,
      },
    ),
  ),
);

