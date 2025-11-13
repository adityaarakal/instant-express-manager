import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { BankAccount } from '../types/bankAccounts';
import { getLocalforageStorage } from '../utils/storage';
import { validateAccountBalance, validateAmount } from '../utils/validation';

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
          // Validate account data
          const amountValidation = validateAmount(accountData.currentBalance, 'Balance');
          const balanceValidation = validateAccountBalance(accountData as BankAccount);
          
          if (!amountValidation.isValid || !balanceValidation.isValid) {
            const allErrors = [...amountValidation.errors, ...balanceValidation.errors];
            console.warn('Account validation errors:', allErrors);
            // Still create the account but log warnings
            if (allErrors.length > 0 && !allErrors.some(e => e.includes('negative'))) {
              throw new Error(allErrors.join(', '));
            }
          }

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
          set((state) => {
            const account = state.accounts.find((a) => a.id === id);
            if (!account) return state;

            // Validate balance if being updated
            if (updates.currentBalance !== undefined) {
              const amountValidation = validateAmount(updates.currentBalance, 'Balance');
              const balanceValidation = validateAccountBalance(
                { ...account, ...updates } as BankAccount,
                updates.currentBalance,
              );
              
              if (!amountValidation.isValid || !balanceValidation.isValid) {
                const allErrors = [...amountValidation.errors, ...balanceValidation.errors];
                console.warn('Account update validation errors:', allErrors);
                // Still update but log warnings
                if (allErrors.length > 0 && !allErrors.some(e => e.includes('negative'))) {
                  throw new Error(allErrors.join(', '));
                }
              }
            }

            return {
              accounts: state.accounts.map((account) =>
                account.id === id
                  ? { ...account, ...updates, updatedAt: new Date().toISOString() }
                  : account
              ),
            };
          });
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
          set((state) => {
            const account = state.accounts.find((a) => a.id === id);
            if (!account) return state;

            // Validate balance
            const amountValidation = validateAmount(newBalance, 'Balance');
            const balanceValidation = validateAccountBalance(account, newBalance);
            
            if (!amountValidation.isValid || !balanceValidation.isValid) {
              const allErrors = [...amountValidation.errors, ...balanceValidation.errors];
              console.warn('Balance update validation errors:', allErrors);
              // Still update but log warnings
              if (allErrors.length > 0 && !allErrors.some(e => e.includes('negative'))) {
                throw new Error(allErrors.join(', '));
              }
            }

            return {
              accounts: state.accounts.map((account) =>
                account.id === id
                  ? {
                      ...account,
                      currentBalance: newBalance,
                      updatedAt: new Date().toISOString(),
                    }
                  : account
              ),
            };
          });
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

