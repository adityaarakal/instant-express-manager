import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { SavingsInvestmentTransaction } from '../types/transactions';
import { getLocalforageStorage } from '../utils/storage';

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

