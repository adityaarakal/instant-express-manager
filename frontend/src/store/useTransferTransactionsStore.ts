import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { TransferTransaction } from '../types/transactions';
import { getLocalforageStorage } from '../utils/storage';
import { useBankAccountsStore } from './useBankAccountsStore';
import { validateDate, validateAmount } from '../utils/validation';
import {
  updateAccountBalancesForTransfer,
  reverseAccountBalancesForTransfer,
  updateAccountBalancesForTransferUpdate,
} from '../utils/transferBalanceUpdates';

type TransferTransactionsState = {
  transfers: TransferTransaction[];
  // CRUD operations
  createTransfer: (transfer: Omit<TransferTransaction, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateTransfer: (id: string, updates: Partial<Omit<TransferTransaction, 'id' | 'createdAt'>>) => void;
  deleteTransfer: (id: string) => void;
  getTransfer: (id: string) => TransferTransaction | undefined;
  // Selectors
  getTransfersByAccount: (accountId: string) => TransferTransaction[];
  getTransfersByFromAccount: (accountId: string) => TransferTransaction[];
  getTransfersByToAccount: (accountId: string) => TransferTransaction[];
  getTransfersByDateRange: (startDate: string, endDate: string) => TransferTransaction[];
  getTransfersByCategory: (category: TransferTransaction['category']) => TransferTransaction[];
  getTotalByMonth: (monthId: string) => number; // monthId format: "YYYY-MM"
};

const storage = getLocalforageStorage('transfer-transactions');

export const useTransferTransactionsStore = create<TransferTransactionsState>()(
  devtools(
    persist(
      (set, get) => ({
        transfers: [],
        createTransfer: (transferData) => {
          // Validate fromAccountId exists
          const fromAccount = useBankAccountsStore.getState().getAccount(transferData.fromAccountId);
          if (!fromAccount) {
            throw new Error(`From account with id ${transferData.fromAccountId} does not exist`);
          }

          // Validate toAccountId exists
          const toAccount = useBankAccountsStore.getState().getAccount(transferData.toAccountId);
          if (!toAccount) {
            throw new Error(`To account with id ${transferData.toAccountId} does not exist`);
          }

          // Validate accounts are different
          if (transferData.fromAccountId === transferData.toAccountId) {
            throw new Error('From account and To account cannot be the same');
          }

          // Validate from account is not Credit Card
          const isCreditCard = fromAccount.accountType === 'CreditCard';
          if (isCreditCard) {
            throw new Error('Credit Card cannot be the source account (from account)');
          }

          // Validate date
          const dateValidation = validateDate(transferData.date, 'Transfer Date');
          if (!dateValidation.isValid) {
            throw new Error(`Date validation failed: ${dateValidation.errors.join(', ')}`);
          }

          // Validate amount
          const amountValidation = validateAmount(transferData.amount, 'Amount');
          if (!amountValidation.isValid) {
            throw new Error(`Amount validation failed: ${amountValidation.errors.join(', ')}`);
          }

          // Validate amount is positive
          if (transferData.amount <= 0) {
            throw new Error('Transfer amount must be greater than 0');
          }

          // Optional: Warn if from account has insufficient balance (for non-credit accounts)
          // After the CreditCard check above, accountType can only be 'Savings' | 'Current' | 'Wallet'
          if (
            transferData.status === 'Completed' &&
            fromAccount.currentBalance < transferData.amount
          ) {
            console.warn(
              `Transfer amount (${transferData.amount}) exceeds from account balance (${fromAccount.currentBalance})`
            );
            // Still allow - user might want to record future transfers or have pending deposits
          }

          const now = new Date().toISOString();
          const newTransfer: TransferTransaction = {
            ...transferData,
            id:
              typeof crypto !== 'undefined' && 'randomUUID' in crypto
                ? crypto.randomUUID()
                : `transfer_${Date.now()}_${Math.random().toString(36).slice(2)}`,
            createdAt: now,
            updatedAt: now,
          };

          set((state) => ({
            transfers: [...state.transfers, newTransfer],
          }));

          // Update account balances if transfer is marked as "Completed"
          if (transferData.status === 'Completed') {
            updateAccountBalancesForTransfer(newTransfer);
          }
        },
        updateTransfer: (id, updates) => {
          const state = get();
          const existingTransfer = state.transfers.find((t) => t.id === id);
          if (!existingTransfer) {
            throw new Error(`Transfer with id ${id} does not exist`);
          }

          // If updating accounts, validate
          if (updates.fromAccountId !== undefined || updates.toAccountId !== undefined) {
            const newFromAccountId = updates.fromAccountId ?? existingTransfer.fromAccountId;
            const newToAccountId = updates.toAccountId ?? existingTransfer.toAccountId;

            // Validate accounts are different
            if (newFromAccountId === newToAccountId) {
              throw new Error('From account and To account cannot be the same');
            }

            // Validate from account is not Credit Card
            const fromAccount = useBankAccountsStore.getState().getAccount(newFromAccountId);
            if (!fromAccount) {
              throw new Error(`From account with id ${newFromAccountId} does not exist`);
            }
            if (fromAccount.accountType === 'CreditCard' as const) {
              throw new Error('Credit Card cannot be the source account (from account)');
            }

            // Validate to account exists
            const toAccount = useBankAccountsStore.getState().getAccount(newToAccountId);
            if (!toAccount) {
              throw new Error(`To account with id ${newToAccountId} does not exist`);
            }
          }

          // If updating amount, validate
          if (updates.amount !== undefined) {
            const amountValidation = validateAmount(updates.amount, 'Amount');
            if (!amountValidation.isValid) {
              throw new Error(`Amount validation failed: ${amountValidation.errors.join(', ')}`);
            }
            if (updates.amount <= 0) {
              throw new Error('Transfer amount must be greater than 0');
            }
          }

          // If updating date, validate
          if (updates.date !== undefined) {
            const dateValidation = validateDate(updates.date, 'Transfer Date');
            if (!dateValidation.isValid) {
              throw new Error(`Date validation failed: ${dateValidation.errors.join(', ')}`);
            }
          }

          // Create merged transfer for balance update calculation
          const mergedTransfer: TransferTransaction = {
            ...existingTransfer,
            ...updates,
            updatedAt: new Date().toISOString(),
          };

          // Handle balance updates based on what changed
          updateAccountBalancesForTransferUpdate(mergedTransfer, existingTransfer);

          set((state) => ({
            transfers: state.transfers.map((t) => (t.id === id ? mergedTransfer : t)),
          }));
        },
        deleteTransfer: (id) => {
          const state = get();
          const transfer = state.transfers.find((t) => t.id === id);
          if (!transfer) {
            throw new Error(`Transfer with id ${id} does not exist`);
          }

          // Reverse balance changes if transfer was completed
          reverseAccountBalancesForTransfer(transfer);

          set((state) => ({
            transfers: state.transfers.filter((t) => t.id !== id),
          }));
        },
        getTransfer: (id) => {
          return get().transfers.find((t) => t.id === id);
        },
        getTransfersByAccount: (accountId) => {
          return get().transfers.filter(
            (t) => t.fromAccountId === accountId || t.toAccountId === accountId
          );
        },
        getTransfersByFromAccount: (accountId) => {
          return get().transfers.filter((t) => t.fromAccountId === accountId);
        },
        getTransfersByToAccount: (accountId) => {
          return get().transfers.filter((t) => t.toAccountId === accountId);
        },
        getTransfersByDateRange: (startDate, endDate) => {
          const start = new Date(startDate);
          const end = new Date(endDate);
          return get().transfers.filter((t) => {
            const transferDate = new Date(t.date);
            return transferDate >= start && transferDate <= end;
          });
        },
        getTransfersByCategory: (category) => {
          return get().transfers.filter((t) => t.category === category);
        },
        getTotalByMonth: (monthId) => {
          const [year, month] = monthId.split('-').map(Number);
          const startDate = new Date(year, month - 1, 1);
          const endDate = new Date(year, month, 0, 23, 59, 59);
          return get()
            .getTransfersByDateRange(startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0])
            .filter((t) => t.status === 'Completed')
            .reduce((sum, t) => sum + t.amount, 0);
        },
      }),
      {
        name: 'transfer-transactions',
        storage,
      }
    ),
    { name: 'TransferTransactionsStore' }
  )
);

