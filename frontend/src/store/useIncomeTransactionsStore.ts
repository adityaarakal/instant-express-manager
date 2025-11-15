import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { IncomeTransaction } from '../types/transactions';
import { getLocalforageStorage } from '../utils/storage';
import { useRecurringIncomesStore } from './useRecurringIncomesStore';
import { useBankAccountsStore } from './useBankAccountsStore';
import { validateDate, validateAmount } from '../utils/validation';
import { updateAccountBalanceForTransaction, reverseAccountBalanceForTransaction } from '../utils/accountBalanceUpdates';

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
          
          // Validate date
          const dateValidation = validateDate(transactionData.date, 'Transaction Date');
          if (!dateValidation.isValid) {
            throw new Error(`Date validation failed: ${dateValidation.errors.join(', ')}`);
          }
          
          // Validate amount
          const amountValidation = validateAmount(transactionData.amount, 'Amount');
          if (!amountValidation.isValid) {
            throw new Error(`Amount validation failed: ${amountValidation.errors.join(', ')}`);
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

          // Update account balance if transaction is marked as "Received"
          if (transactionData.status === 'Received') {
            updateAccountBalanceForTransaction(
              transactionData.accountId,
              transactionData.amount,
              'income',
              transactionData.status,
            );
          }
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
          
          // Validate date if being updated
          if (updates.date) {
            const dateValidation = validateDate(updates.date, 'Transaction Date');
            if (!dateValidation.isValid) {
              throw new Error(`Date validation failed: ${dateValidation.errors.join(', ')}`);
            }
          }
          
          // Validate amount if being updated
          if (updates.amount !== undefined) {
            const amountValidation = validateAmount(updates.amount, 'Amount');
            if (!amountValidation.isValid) {
              throw new Error(`Amount validation failed: ${amountValidation.errors.join(', ')}`);
            }
          }
          
          // Get the transaction before update to track status/amount changes
          const existingTransaction = get().transactions.find((t) => t.id === id);
          if (!existingTransaction) {
            throw new Error(`Transaction with id ${id} does not exist`);
          }

          // Determine what changed for balance updates
          const statusChanged = updates.status !== undefined && updates.status !== existingTransaction.status;
          const amountChanged = updates.amount !== undefined && updates.amount !== existingTransaction.amount;
          const accountChanged = updates.accountId !== undefined && updates.accountId !== existingTransaction.accountId;

          // Create merged transaction for balance updates
          const mergedTransaction = { ...existingTransaction, ...updates };
          
          set((state) => ({
            transactions: state.transactions.map((transaction) =>
              transaction.id === id
                ? { ...mergedTransaction, updatedAt: new Date().toISOString() }
                : transaction
            ),
          }));

          // Update account balance if status or amount changed
          if (statusChanged || amountChanged || accountChanged) {
            // If account changed, update both old and new accounts
            if (accountChanged && existingTransaction.accountId !== mergedTransaction.accountId) {
              // Reverse effect on old account
              if (existingTransaction.status === 'Received') {
                updateAccountBalanceForTransaction(
                  existingTransaction.accountId,
                  existingTransaction.amount,
                  'income',
                  'Pending', // Reverse by setting to Pending
                  existingTransaction.status,
                  existingTransaction.amount,
                );
              }
              // Apply effect on new account
              if (mergedTransaction.status === 'Received') {
                updateAccountBalanceForTransaction(
                  mergedTransaction.accountId,
                  mergedTransaction.amount,
                  'income',
                  mergedTransaction.status,
                );
              }
            } else {
              // Same account, just update based on status/amount change
              const accountId = mergedTransaction.accountId;
              const newAmount = mergedTransaction.amount;
              const newStatus = mergedTransaction.status;

              updateAccountBalanceForTransaction(
                accountId,
                newAmount,
                'income',
                newStatus,
                existingTransaction.status,
                existingTransaction.amount,
              );
            }
          }
        },
        deleteTransaction: (id) => {
          const transaction = get().transactions.find((t) => t.id === id);
          if (transaction) {
            // Reverse account balance change if transaction was "Received"
            if (transaction.status === 'Received') {
              reverseAccountBalanceForTransaction(
                transaction.accountId,
                transaction.amount,
                'income',
                transaction.status,
              );
            }
          }
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

