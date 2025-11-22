/**
 * Command Helper Functions
 * Utilities for creating commands for different entity types
 */

import type { Command } from '../store/useCommandHistoryStore';
import type {
  IncomeTransaction,
  ExpenseTransaction,
  SavingsInvestmentTransaction,
} from '../types/transactions';
import type { BankAccount } from '../types/bankAccounts';
import { useIncomeTransactionsStore } from '../store/useIncomeTransactionsStore';
import { useExpenseTransactionsStore } from '../store/useExpenseTransactionsStore';
import { useSavingsInvestmentTransactionsStore } from '../store/useSavingsInvestmentTransactionsStore';
import { useBankAccountsStore } from '../store/useBankAccountsStore';

/**
 * Create a command for creating an income transaction
 */
export function createIncomeTransactionCommand(
  transaction: Omit<IncomeTransaction, 'id' | 'createdAt' | 'updatedAt'>,
): Omit<Command, 'id' | 'timestamp'> {
  const store = useIncomeTransactionsStore.getState();
  let createdId = '';

  return {
    type: 'create-income-transaction',
    description: `Create income transaction: ${transaction.description || 'Untitled'}`,
    execute: () => {
      store.createTransaction(transaction);
      // Get the created transaction ID (we'll need to modify store to return ID)
      const transactions = store.transactions;
      const created = transactions[transactions.length - 1];
      createdId = created.id;
    },
    undo: () => {
      if (createdId) {
        store.deleteTransaction(createdId);
      }
    },
  };
}

/**
 * Create a command for updating an income transaction
 */
export function updateIncomeTransactionCommand(
  id: string,
  updates: Partial<Omit<IncomeTransaction, 'id' | 'createdAt'>>,
): Omit<Command, 'id' | 'timestamp'> {
  const store = useIncomeTransactionsStore.getState();
  const original = store.getTransaction(id);
  if (!original) {
    throw new Error(`Transaction ${id} not found`);
  }

  return {
    type: 'update-income-transaction',
    description: `Update income transaction: ${original.description || 'Untitled'}`,
    execute: () => {
      store.updateTransaction(id, updates);
    },
    undo: () => {
      store.updateTransaction(id, {
        amount: original.amount,
        date: original.date,
        accountId: original.accountId,
        category: original.category,
        description: original.description,
        status: original.status,
        clientName: original.clientName,
        projectName: original.projectName,
        notes: original.notes,
      });
    },
  };
}

/**
 * Create a command for deleting an income transaction
 */
export function deleteIncomeTransactionCommand(
  id: string,
): Omit<Command, 'id' | 'timestamp'> {
  const store = useIncomeTransactionsStore.getState();
  const original = store.getTransaction(id);
  if (!original) {
    throw new Error(`Transaction ${id} not found`);
  }

  return {
    type: 'delete-income-transaction',
    description: `Delete income transaction: ${original.description || 'Untitled'}`,
    execute: () => {
      store.deleteTransaction(id);
    },
    undo: () => {
      store.createTransaction({
        amount: original.amount,
        date: original.date,
        accountId: original.accountId,
        category: original.category,
        description: original.description,
        status: original.status,
        clientName: original.clientName,
        projectName: original.projectName,
        notes: original.notes,
      });
    },
  };
}

/**
 * Create a command for updating a bucket status
 */
export function updateBucketStatusCommand(
  monthId: string,
  bucketId: string,
  newStatus: 'Pending' | 'Paid',
): Omit<Command, 'id' | 'timestamp'> {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { useAggregatedPlannedMonthsStore } = require('../store/useAggregatedPlannedMonthsStore');
  const store = useAggregatedPlannedMonthsStore.getState();
  const oldStatus = store.statusByBucket[monthId]?.[bucketId] || 'Pending';

  return {
    type: 'update-bucket-status',
    description: `Update bucket status to ${newStatus}`,
    execute: () => {
      store.updateBucketStatus(monthId, bucketId, newStatus);
    },
    undo: () => {
      store.updateBucketStatus(monthId, bucketId, oldStatus as 'Pending' | 'Paid');
    },
  };
}

/**
 * Create a command for updating a bank account
 */
export function updateBankAccountCommand(
  id: string,
  updates: Partial<Omit<BankAccount, 'id' | 'createdAt' | 'updatedAt'>>,
): Omit<Command, 'id' | 'timestamp'> {
  const store = useBankAccountsStore.getState();
  const original = store.getAccount(id);
  if (!original) {
    throw new Error(`Account ${id} not found`);
  }

  return {
    type: 'update-bank-account',
    description: `Update account: ${original.name}`,
    execute: () => {
      store.updateAccount(id, updates);
    },
    undo: () => {
      store.updateAccount(id, {
        name: original.name,
        accountType: original.accountType,
        currentBalance: original.currentBalance,
        bankId: original.bankId,
        // Note: initialBalance is preserved automatically in updateAccount
        // and cannot be changed via updates
      });
    },
  };
}

// Similar functions for expense and savings transactions...
export function createExpenseTransactionCommand(
  transaction: Omit<ExpenseTransaction, 'id' | 'createdAt' | 'updatedAt'>,
): Omit<Command, 'id' | 'timestamp'> {
  const store = useExpenseTransactionsStore.getState();
  let createdId = '';

  return {
    type: 'create-expense-transaction',
    description: `Create expense transaction: ${transaction.description || 'Untitled'}`,
    execute: () => {
      store.createTransaction(transaction);
      const transactions = store.transactions;
      const created = transactions[transactions.length - 1];
      createdId = created.id;
    },
    undo: () => {
      if (createdId) {
        store.deleteTransaction(createdId);
      }
    },
  };
}

export function updateExpenseTransactionCommand(
  id: string,
  updates: Partial<Omit<ExpenseTransaction, 'id' | 'createdAt'>>,
): Omit<Command, 'id' | 'timestamp'> {
  const store = useExpenseTransactionsStore.getState();
  const original = store.getTransaction(id);
  if (!original) {
    throw new Error(`Transaction ${id} not found`);
  }

  return {
    type: 'update-expense-transaction',
    description: `Update expense transaction: ${original.description || 'Untitled'}`,
    execute: () => {
      store.updateTransaction(id, updates);
    },
    undo: () => {
      store.updateTransaction(id, {
        amount: original.amount,
        date: original.date,
        accountId: original.accountId,
        category: original.category,
        description: original.description,
        status: original.status,
        bucket: original.bucket,
        notes: original.notes,
      });
    },
  };
}

export function deleteExpenseTransactionCommand(
  id: string,
): Omit<Command, 'id' | 'timestamp'> {
  const store = useExpenseTransactionsStore.getState();
  const original = store.getTransaction(id);
  if (!original) {
    throw new Error(`Transaction ${id} not found`);
  }

  return {
    type: 'delete-expense-transaction',
    description: `Delete expense transaction: ${original.description || 'Untitled'}`,
    execute: () => {
      store.deleteTransaction(id);
    },
    undo: () => {
      store.createTransaction({
        amount: original.amount,
        date: original.date,
        accountId: original.accountId,
        category: original.category,
        description: original.description,
        status: original.status,
        bucket: original.bucket,
        notes: original.notes,
      });
    },
  };
}

export function createSavingsTransactionCommand(
  transaction: Omit<SavingsInvestmentTransaction, 'id' | 'createdAt' | 'updatedAt'>,
): Omit<Command, 'id' | 'timestamp'> {
  const store = useSavingsInvestmentTransactionsStore.getState();
  let createdId = '';

  return {
    type: 'create-savings-transaction',
    description: `Create savings transaction: ${transaction.description || 'Untitled'}`,
    execute: () => {
      store.createTransaction(transaction);
      const transactions = store.transactions;
      const created = transactions[transactions.length - 1];
      createdId = created.id;
    },
    undo: () => {
      if (createdId) {
        store.deleteTransaction(createdId);
      }
    },
  };
}

export function updateSavingsTransactionCommand(
  id: string,
  updates: Partial<Omit<SavingsInvestmentTransaction, 'id' | 'createdAt'>>,
): Omit<Command, 'id' | 'timestamp'> {
  const store = useSavingsInvestmentTransactionsStore.getState();
  const original = store.getTransaction(id);
  if (!original) {
    throw new Error(`Transaction ${id} not found`);
  }

  return {
    type: 'update-savings-transaction',
    description: `Update savings transaction: ${original.description || 'Untitled'}`,
    execute: () => {
      store.updateTransaction(id, updates);
    },
    undo: () => {
      store.updateTransaction(id, {
        amount: original.amount,
        date: original.date,
        accountId: original.accountId,
        type: original.type,
        description: original.description,
        status: original.status,
        notes: original.notes,
      });
    },
  };
}

export function deleteSavingsTransactionCommand(
  id: string,
): Omit<Command, 'id' | 'timestamp'> {
  const store = useSavingsInvestmentTransactionsStore.getState();
  const original = store.getTransaction(id);
  if (!original) {
    throw new Error(`Transaction ${id} not found`);
  }

  return {
    type: 'delete-savings-transaction',
    description: `Delete savings transaction: ${original.description || 'Untitled'}`,
    execute: () => {
      store.deleteTransaction(id);
    },
    undo: () => {
      store.createTransaction({
        amount: original.amount,
        date: original.date,
        accountId: original.accountId,
        type: original.type,
        description: original.description,
        status: original.status,
        notes: original.notes,
        destination: original.destination,
      });
    },
  };
}

