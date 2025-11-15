import { useUndoStore } from '../store/useUndoStore';
import { useBanksStore } from '../store/useBanksStore';
import { useBankAccountsStore } from '../store/useBankAccountsStore';
import { useIncomeTransactionsStore } from '../store/useIncomeTransactionsStore';
import { useExpenseTransactionsStore } from '../store/useExpenseTransactionsStore';
import { useSavingsInvestmentTransactionsStore } from '../store/useSavingsInvestmentTransactionsStore';
import { useExpenseEMIsStore } from '../store/useExpenseEMIsStore';
import { useSavingsInvestmentEMIsStore } from '../store/useSavingsInvestmentEMIsStore';
import { useRecurringIncomesStore } from '../store/useRecurringIncomesStore';
import { useRecurringExpensesStore } from '../store/useRecurringExpensesStore';
import { useRecurringSavingsInvestmentsStore } from '../store/useRecurringSavingsInvestmentsStore';
import { useToastStore } from '../store/useToastStore';
import type { Bank } from '../types/banks';
import type { BankAccount } from '../types/bankAccounts';
import type { IncomeTransaction, ExpenseTransaction, SavingsInvestmentTransaction } from '../types/transactions';
import type { ExpenseEMI, SavingsInvestmentEMI } from '../types/emis';
import type { RecurringIncome, RecurringExpense, RecurringSavingsInvestment } from '../types/recurring';

/**
 * Restores a deleted item to its original store
 * @param itemId The ID of the deleted item to restore
 * @returns true if restore was successful, false otherwise
 */
export function restoreDeletedItem(itemId: string): boolean {
  const undoStore = useUndoStore.getState();
  const deletedItem = undoStore.restoreItem(itemId);

  if (!deletedItem) {
    return false;
  }

  const { showSuccess, showError } = useToastStore.getState();

  try {
    switch (deletedItem.type) {
      case 'Bank': {
        // Restore with original ID and timestamps
        const bankData = deletedItem.data as { id: string };
        const banks = useBanksStore.getState().banks;
        // Check if bank already exists (shouldn't happen, but safety check)
        if (banks.find((b) => b.id === bankData.id)) {
          showError('Bank already exists');
          return false;
        }
        useBanksStore.setState((state) => ({
          banks: [...state.banks, deletedItem.data as Bank],
        }));
        showSuccess('Bank restored successfully');
        break;
      }

      case 'BankAccount': {
        const accountData = deletedItem.data as BankAccount;
        const accounts = useBankAccountsStore.getState().accounts;
        if (accounts.find((a) => a.id === accountData.id)) {
          showError('Account already exists');
          return false;
        }
        useBankAccountsStore.setState((state) => ({
          accounts: [...state.accounts, accountData],
        }));
        showSuccess('Bank account restored successfully');
        break;
      }

      case 'IncomeTransaction': {
        const transactionData = deletedItem.data as IncomeTransaction;
        const transactions = useIncomeTransactionsStore.getState().transactions;
        if (transactions.find((t) => t.id === transactionData.id)) {
          showError('Transaction already exists');
          return false;
        }
        useIncomeTransactionsStore.setState((state) => ({
          transactions: [...state.transactions, transactionData],
        }));
        showSuccess('Income transaction restored successfully');
        break;
      }

      case 'ExpenseTransaction': {
        const transactionData = deletedItem.data as ExpenseTransaction;
        const transactions = useExpenseTransactionsStore.getState().transactions;
        if (transactions.find((t) => t.id === transactionData.id)) {
          showError('Transaction already exists');
          return false;
        }
        useExpenseTransactionsStore.setState((state) => ({
          transactions: [...state.transactions, transactionData],
        }));
        showSuccess('Expense transaction restored successfully');
        break;
      }

      case 'SavingsInvestmentTransaction': {
        const transactionData = deletedItem.data as SavingsInvestmentTransaction;
        const transactions = useSavingsInvestmentTransactionsStore.getState().transactions;
        if (transactions.find((t) => t.id === transactionData.id)) {
          showError('Transaction already exists');
          return false;
        }
        useSavingsInvestmentTransactionsStore.setState((state) => ({
          transactions: [...state.transactions, transactionData],
        }));
        showSuccess('Savings/Investment transaction restored successfully');
        break;
      }

      case 'ExpenseEMI': {
        const emiData = deletedItem.data as ExpenseEMI;
        const emis = useExpenseEMIsStore.getState().emis;
        if (emis.find((e) => e.id === emiData.id)) {
          showError('EMI already exists');
          return false;
        }
        useExpenseEMIsStore.setState((state) => ({
          emis: [...state.emis, emiData],
        }));
        showSuccess('Expense EMI restored successfully');
        break;
      }

      case 'SavingsInvestmentEMI': {
        const emiData = deletedItem.data as SavingsInvestmentEMI;
        const emis = useSavingsInvestmentEMIsStore.getState().emis;
        if (emis.find((e) => e.id === emiData.id)) {
          showError('EMI already exists');
          return false;
        }
        useSavingsInvestmentEMIsStore.setState((state) => ({
          emis: [...state.emis, emiData],
        }));
        showSuccess('Savings/Investment EMI restored successfully');
        break;
      }

      case 'RecurringIncome': {
        const templateData = deletedItem.data as RecurringIncome;
        const templates = useRecurringIncomesStore.getState().templates;
        if (templates.find((t) => t.id === templateData.id)) {
          showError('Template already exists');
          return false;
        }
        useRecurringIncomesStore.setState((state) => ({
          templates: [...state.templates, templateData],
        }));
        showSuccess('Recurring income template restored successfully');
        break;
      }

      case 'RecurringExpense': {
        const templateData = deletedItem.data as RecurringExpense;
        const templates = useRecurringExpensesStore.getState().templates;
        if (templates.find((t) => t.id === templateData.id)) {
          showError('Template already exists');
          return false;
        }
        useRecurringExpensesStore.setState((state) => ({
          templates: [...state.templates, templateData],
        }));
        showSuccess('Recurring expense template restored successfully');
        break;
      }

      case 'RecurringSavingsInvestment': {
        const templateData = deletedItem.data as RecurringSavingsInvestment;
        const templates = useRecurringSavingsInvestmentsStore.getState().templates;
        if (templates.find((t) => t.id === templateData.id)) {
          showError('Template already exists');
          return false;
        }
        useRecurringSavingsInvestmentsStore.setState((state) => ({
          templates: [...state.templates, templateData],
        }));
        showSuccess('Recurring savings/investment template restored successfully');
        break;
      }

      default:
        showError(`Unknown entity type: ${(deletedItem as { type: string }).type}`);
        return false;
    }

    return true;
  } catch (error) {
    showError(error instanceof Error ? error.message : 'Failed to restore item');
    // Re-add to undo store if restore failed
    undoStore.addDeletedItem(deletedItem.type, deletedItem.data);
    return false;
  }
}

