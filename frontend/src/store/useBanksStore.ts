import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { Bank } from '../types/banks';
import { getLocalforageStorage } from '../utils/storage';
import { useBankAccountsStore } from './useBankAccountsStore';

type BanksState = {
  banks: Bank[];
  // CRUD operations
  createBank: (bank: Omit<Bank, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateBank: (id: string, updates: Partial<Omit<Bank, 'id' | 'createdAt'>>) => void;
  deleteBank: (id: string) => void;
  getBank: (id: string) => Bank | undefined;
  getBanksByType: (type: Bank['type']) => Bank[];
  // Aggregate queries
  getAccountsCount: (bankId: string) => number;
  getBankSummary: (bankId: string) => {
    bank: Bank | undefined;
    accountsCount: number;
    totalBalance: number;
  };
};

const storage = getLocalforageStorage('banks');

export const useBanksStore = create<BanksState>()(
  devtools(
    persist(
      (set, get) => ({
        banks: [],
        createBank: (bankData) => {
          const now = new Date().toISOString();
          const newBank: Bank = {
            ...bankData,
            id: typeof crypto !== 'undefined' && 'randomUUID' in crypto
              ? crypto.randomUUID()
              : `bank_${Date.now()}_${Math.random().toString(36).slice(2)}`,
            createdAt: now,
            updatedAt: now,
          };
          set((state) => ({
            banks: [...state.banks, newBank],
          }));
        },
        updateBank: (id, updates) => {
          set((state) => ({
            banks: state.banks.map((bank) =>
              bank.id === id
                ? { ...bank, ...updates, updatedAt: new Date().toISOString() }
                : bank
            ),
          }));
        },
        deleteBank: (id) => {
          // Check if any accounts reference this bank
          const accounts = useBankAccountsStore.getState().getAccountsByBank(id);
          if (accounts.length > 0) {
            throw new Error(
              `Cannot delete bank: ${accounts.length} account(s) still reference it. Please delete or reassign the accounts first.`
            );
          }
          set((state) => ({
            banks: state.banks.filter((bank) => bank.id !== id),
          }));
        },
        getBank: (id) => {
          return get().banks.find((bank) => bank.id === id);
        },
        getBanksByType: (type) => {
          return get().banks.filter((bank) => bank.type === type);
        },
        getAccountsCount: (bankId) => {
          return useBankAccountsStore.getState().getAccountsByBank(bankId).length;
        },
        getBankSummary: (bankId) => {
          const bank = get().getBank(bankId);
          const accounts = useBankAccountsStore.getState().getAccountsByBank(bankId);
          const totalBalance = accounts.reduce((sum, acc) => sum + acc.currentBalance, 0);
          return {
            bank,
            accountsCount: accounts.length,
            totalBalance,
          };
        },
      }),
      {
        name: 'banks',
        storage,
        version: 1,
      },
    ),
  ),
);

