import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { BankAccount } from '../types/bankAccounts';
import { getLocalforageStorage } from '../utils/storage';

type BankAccountsState = {
  accounts: BankAccount[];
  // CRUD operations
  createAccount: (account: Omit<BankAccount, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateAccount: (id: string, updates: Partial<Omit<BankAccount, 'id' | 'createdAt'>>) => void;
  deleteAccount: (id: string) => void;
  getAccount: (id: string) => BankAccount | undefined;
  getAccountsByBank: (bankId: string) => BankAccount[];
  getAccountsByType: (type: BankAccount['accountType']) => BankAccount[];
  updateAccountBalance: (id: string, newBalance: number) => void;
};

const storage = getLocalforageStorage('bank-accounts');

export const useBankAccountsStore = create<BankAccountsState>()(
  devtools(
    persist(
      (set, get) => ({
        accounts: [],
        createAccount: (accountData) => {
          const now = new Date().toISOString();
          const newAccount: BankAccount = {
            ...accountData,
            id: typeof crypto !== 'undefined' && 'randomUUID' in crypto
              ? crypto.randomUUID()
              : `account_${Date.now()}_${Math.random().toString(36).slice(2)}`,
            createdAt: now,
            updatedAt: now,
          };
          set((state) => ({
            accounts: [...state.accounts, newAccount],
          }));
        },
        updateAccount: (id, updates) => {
          set((state) => ({
            accounts: state.accounts.map((account) =>
              account.id === id
                ? { ...account, ...updates, updatedAt: new Date().toISOString() }
                : account
            ),
          }));
        },
        deleteAccount: (id) => {
          set((state) => ({
            accounts: state.accounts.filter((account) => account.id !== id),
          }));
        },
        getAccount: (id) => {
          return get().accounts.find((account) => account.id === id);
        },
        getAccountsByBank: (bankId) => {
          return get().accounts.filter((account) => account.bankId === bankId);
        },
        getAccountsByType: (type) => {
          return get().accounts.filter((account) => account.accountType === type);
        },
        updateAccountBalance: (id, newBalance) => {
          set((state) => ({
            accounts: state.accounts.map((account) =>
              account.id === id
                ? {
                    ...account,
                    currentBalance: newBalance,
                    updatedAt: new Date().toISOString(),
                  }
                : account
            ),
          }));
        },
      }),
      {
        name: 'bank-accounts',
        storage,
        version: 1,
      },
    ),
  ),
);

