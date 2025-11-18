import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { BankAccount } from '../types/bankAccounts';
import { getLocalforageStorage } from '../utils/storage';
import { validateAccountBalance, validateAmount } from '../utils/validation';
import { useIncomeTransactionsStore } from './useIncomeTransactionsStore';
import { useExpenseTransactionsStore } from './useExpenseTransactionsStore';
import { useSavingsInvestmentTransactionsStore } from './useSavingsInvestmentTransactionsStore';
import { useExpenseEMIsStore } from './useExpenseEMIsStore';
import { useSavingsInvestmentEMIsStore } from './useSavingsInvestmentEMIsStore';
import { useRecurringIncomesStore } from './useRecurringIncomesStore';
import { useRecurringExpensesStore } from './useRecurringExpensesStore';
import { useRecurringSavingsInvestmentsStore } from './useRecurringSavingsInvestmentsStore';
import { useBanksStore } from './useBanksStore';

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
  // Aggregate queries
  getTotalTransactionsCount: (accountId: string) => number;
  getTotalBalanceImpact: (accountId: string) => number;
  getBankAccountSummary: (accountId: string) => {
    account: BankAccount | undefined;
    incomeTransactionsCount: number;
    expenseTransactionsCount: number;
    savingsTransactionsCount: number;
    expenseEMIsCount: number;
    savingsEMIsCount: number;
    recurringIncomesCount: number;
    recurringExpensesCount: number;
    recurringSavingsCount: number;
    creditCardEMIsCount: number;
    totalTransactionsCount: number;
    totalBalanceImpact: number;
  };
};

const storage = getLocalforageStorage('bank-accounts');

export const useBankAccountsStore = create<BankAccountsState>()(
  devtools(
    persist(
      (set, get) => ({
        accounts: [],
        createAccount: (accountData) => {
          // Validate bankId exists
          const bank = useBanksStore.getState().getBank(accountData.bankId);
          if (!bank) {
            throw new Error(`Bank with id ${accountData.bankId} does not exist`);
          }
          
          // Validate account data
          const amountValidation = validateAmount(accountData.currentBalance, 'Balance');
          const balanceValidation = validateAccountBalance(accountData as BankAccount);
          
          if (!amountValidation.isValid || !balanceValidation.isValid) {
            const allErrors = [...amountValidation.errors, ...balanceValidation.errors];
            // Errors are thrown below, so no need to log here
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

            // Validate bankId if being updated
            if (updates.bankId) {
              const bank = useBanksStore.getState().getBank(updates.bankId);
              if (!bank) {
                throw new Error(`Bank with id ${updates.bankId} does not exist`);
              }
            }

            // Validate balance if being updated
            if (updates.currentBalance !== undefined) {
              const amountValidation = validateAmount(updates.currentBalance, 'Balance');
              const balanceValidation = validateAccountBalance(
                { ...account, ...updates } as BankAccount,
                updates.currentBalance,
              );
              
              if (!amountValidation.isValid || !balanceValidation.isValid) {
                const allErrors = [...amountValidation.errors, ...balanceValidation.errors];
                // Errors are thrown below, so no need to log here
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
          // Check all references to this account
          const incomeCount = useIncomeTransactionsStore.getState().getTransactionsByAccount(id).length;
          const expenseCount = useExpenseTransactionsStore.getState().getTransactionsByAccount(id).length;
          const savingsCount = useSavingsInvestmentTransactionsStore.getState().getTransactionsByAccount(id).length;
          const expenseEMIs = useExpenseEMIsStore.getState().getEMIsByAccount(id).length;
          const savingsEMIs = useSavingsInvestmentEMIsStore.getState().getEMIsByAccount(id).length;
          const recurringIncomes = useRecurringIncomesStore.getState().getTemplatesByAccount(id).length;
          const recurringExpenses = useRecurringExpensesStore.getState().getTemplatesByAccount(id).length;
          const recurringSavings = useRecurringSavingsInvestmentsStore.getState().getTemplatesByAccount(id).length;
          
          // Also check if this account is referenced as creditCardId in ExpenseEMIs
          const creditCardEMIs = useExpenseEMIsStore.getState().emis.filter((emi) => emi.creditCardId === id).length;
          
          const totalReferences = incomeCount + expenseCount + savingsCount + expenseEMIs + savingsEMIs + 
                                 recurringIncomes + recurringExpenses + recurringSavings + creditCardEMIs;
          
          if (totalReferences > 0) {
            const details = [];
            if (incomeCount > 0) details.push(`${incomeCount} income transaction(s)`);
            if (expenseCount > 0) details.push(`${expenseCount} expense transaction(s)`);
            if (savingsCount > 0) details.push(`${savingsCount} savings transaction(s)`);
            if (expenseEMIs > 0) details.push(`${expenseEMIs} expense EMI(s)`);
            if (savingsEMIs > 0) details.push(`${savingsEMIs} savings EMI(s)`);
            if (recurringIncomes > 0) details.push(`${recurringIncomes} recurring income template(s)`);
            if (recurringExpenses > 0) details.push(`${recurringExpenses} recurring expense template(s)`);
            if (recurringSavings > 0) details.push(`${recurringSavings} recurring savings template(s)`);
            if (creditCardEMIs > 0) details.push(`${creditCardEMIs} credit card EMI reference(s)`);
            
            throw new Error(
              `Cannot delete account: ${totalReferences} record(s) still reference it.\n` +
              `Details: ${details.join(', ')}\n` +
              `Please delete or reassign these records first.`
            );
          }
          
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
              // Errors are thrown below, so no need to log here
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
        getTotalTransactionsCount: (accountId) => {
          const incomeCount = useIncomeTransactionsStore.getState().getTransactionsByAccount(accountId).length;
          const expenseCount = useExpenseTransactionsStore.getState().getTransactionsByAccount(accountId).length;
          const savingsCount = useSavingsInvestmentTransactionsStore.getState().getTransactionsByAccount(accountId).length;
          return incomeCount + expenseCount + savingsCount;
        },
        getTotalBalanceImpact: (accountId) => {
          const account = get().getAccount(accountId);
          if (!account) return 0;
          
          const incomeTransactions = useIncomeTransactionsStore.getState().getTransactionsByAccount(accountId);
          const expenseTransactions = useExpenseTransactionsStore.getState().getTransactionsByAccount(accountId);
          const savingsTransactions = useSavingsInvestmentTransactionsStore.getState().getTransactionsByAccount(accountId);
          
          // Calculate net impact from transactions
          const totalIncome = incomeTransactions
            .filter((t) => t.status === 'Received')
            .reduce((sum, t) => sum + t.amount, 0);
          
          const totalExpenses = expenseTransactions
            .filter((t) => t.status === 'Paid')
            .reduce((sum, t) => sum + t.amount, 0);
          
          const totalSavings = savingsTransactions
            .filter((t) => t.status === 'Completed')
            .reduce((sum, t) => sum + t.amount, 0);
          
          // Net impact: income - expenses - savings
          return totalIncome - totalExpenses - totalSavings;
        },
        getBankAccountSummary: (accountId) => {
          const account = get().getAccount(accountId);
          const incomeCount = useIncomeTransactionsStore.getState().getTransactionsByAccount(accountId).length;
          const expenseCount = useExpenseTransactionsStore.getState().getTransactionsByAccount(accountId).length;
          const savingsCount = useSavingsInvestmentTransactionsStore.getState().getTransactionsByAccount(accountId).length;
          const expenseEMIsCount = useExpenseEMIsStore.getState().getEMIsByAccount(accountId).length;
          const savingsEMIsCount = useSavingsInvestmentEMIsStore.getState().getEMIsByAccount(accountId).length;
          const recurringIncomesCount = useRecurringIncomesStore.getState().getTemplatesByAccount(accountId).length;
          const recurringExpensesCount = useRecurringExpensesStore.getState().getTemplatesByAccount(accountId).length;
          const recurringSavingsCount = useRecurringSavingsInvestmentsStore.getState().getTemplatesByAccount(accountId).length;
          const creditCardEMIsCount = useExpenseEMIsStore.getState().emis.filter((emi) => emi.creditCardId === accountId).length;
          
          const totalTransactionsCount = incomeCount + expenseCount + savingsCount;
          const totalBalanceImpact = get().getTotalBalanceImpact(accountId);
          
          return {
            account,
            incomeTransactionsCount: incomeCount,
            expenseTransactionsCount: expenseCount,
            savingsTransactionsCount: savingsCount,
            expenseEMIsCount,
            savingsEMIsCount,
            recurringIncomesCount,
            recurringExpensesCount,
            recurringSavingsCount,
            creditCardEMIsCount,
            totalTransactionsCount,
            totalBalanceImpact,
          };
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

