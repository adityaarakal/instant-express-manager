import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { ExpenseTransaction } from '../types/transactions';
import { getLocalforageStorage } from '../utils/storage';
import { useRecurringExpensesStore } from './useRecurringExpensesStore';
import { useExpenseEMIsStore } from './useExpenseEMIsStore';
import { useBankAccountsStore } from './useBankAccountsStore';
import { validateDate, validateAmount } from '../utils/validation';
import { updateAccountBalanceForTransaction, reverseAccountBalanceForTransaction } from '../utils/accountBalanceUpdates';
import { calculateNextDateFromDate } from '../utils/dateCalculations';

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
          // Validate accountId exists
          const account = useBankAccountsStore.getState().getAccount(transactionData.accountId);
          if (!account) {
            throw new Error(`Account with id ${transactionData.accountId} does not exist`);
          }
          
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

          // Update account balance if transaction is marked as "Paid"
          if (transactionData.status === 'Paid') {
            updateAccountBalanceForTransaction(
              transactionData.accountId,
              transactionData.amount,
              'expense',
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
              if (existingTransaction.status === 'Paid') {
                updateAccountBalanceForTransaction(
                  existingTransaction.accountId,
                  existingTransaction.amount,
                  'expense',
                  'Pending', // Reverse by setting to Pending
                  existingTransaction.status,
                  existingTransaction.amount,
                );
              }
              // Apply effect on new account
              if (mergedTransaction.status === 'Paid') {
                updateAccountBalanceForTransaction(
                  mergedTransaction.accountId,
                  mergedTransaction.amount,
                  'expense',
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
                'expense',
                newStatus,
                existingTransaction.status,
                existingTransaction.amount,
              );
            }
          }

          // Update recurring template's nextDueDate if transaction is linked to a template
          // and status changed to/from Paid
          if (statusChanged && mergedTransaction.recurringTemplateId) {
            const template = useRecurringExpensesStore.getState().getTemplate(mergedTransaction.recurringTemplateId);
            if (template) {
              // Get all transactions for this template (using updated state), sorted by date
              const allTransactions = get().transactions;
              const templateTransactions = allTransactions
                .filter((t) => t.recurringTemplateId === template.id)
                .sort((a, b) => a.date.localeCompare(b.date));

              // Find the earliest pending transaction
              const nextPendingTransaction = templateTransactions.find((t) => t.status === 'Pending');

              if (nextPendingTransaction) {
                // Update nextDueDate to the earliest pending transaction date
                useRecurringExpensesStore.getState().updateTemplate(template.id, {
                  nextDueDate: nextPendingTransaction.date,
                });
              } else {
                // All transactions are paid - find the last paid transaction and calculate next date
                const paidTransactions = templateTransactions.filter((t) => t.status === 'Paid');
                if (paidTransactions.length > 0) {
                  const lastPaidDate = paidTransactions[paidTransactions.length - 1].date;
                  const nextDate = calculateNextDateFromDate(lastPaidDate, template.frequency);
                  
                  // Check if nextDate is beyond endDate
                  const isCompleted = template.endDate && nextDate > template.endDate;
                  
                  if (isCompleted) {
                    // Mark template as completed
                    useRecurringExpensesStore.getState().updateTemplate(template.id, {
                      status: 'Completed',
                      nextDueDate: template.endDate || nextDate,
                    });
                  } else {
                    // Update nextDueDate to calculated next date
                    useRecurringExpensesStore.getState().updateTemplate(template.id, {
                      nextDueDate: nextDate,
                    });
                  }
                }
              }
            }
          }
        },
        deleteTransaction: (id) => {
          const transaction = get().transactions.find((t) => t.id === id);
          if (transaction) {
            // Reverse account balance change if transaction was "Paid"
            if (transaction.status === 'Paid') {
              reverseAccountBalanceForTransaction(
                transaction.accountId,
                transaction.amount,
                'expense',
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

