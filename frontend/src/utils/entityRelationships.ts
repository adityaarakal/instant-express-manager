/**
 * Entity relationship utilities
 * Provides helper functions to query entity dependencies and relationships
 */

import { useIncomeTransactionsStore } from '../store/useIncomeTransactionsStore';
import { useExpenseTransactionsStore } from '../store/useExpenseTransactionsStore';
import { useSavingsInvestmentTransactionsStore } from '../store/useSavingsInvestmentTransactionsStore';
import { useExpenseEMIsStore } from '../store/useExpenseEMIsStore';
import { useSavingsInvestmentEMIsStore } from '../store/useSavingsInvestmentEMIsStore';
import { useRecurringIncomesStore } from '../store/useRecurringIncomesStore';
import { useRecurringExpensesStore } from '../store/useRecurringExpensesStore';
import { useRecurringSavingsInvestmentsStore } from '../store/useRecurringSavingsInvestmentsStore';
import { useBankAccountsStore } from '../store/useBankAccountsStore';

export type EntityType =
  | 'Bank'
  | 'BankAccount'
  | 'IncomeTransaction'
  | 'ExpenseTransaction'
  | 'SavingsInvestmentTransaction'
  | 'ExpenseEMI'
  | 'SavingsInvestmentEMI'
  | 'RecurringIncome'
  | 'RecurringExpense'
  | 'RecurringSavingsInvestment';

export interface EntityDependency {
  entityType: EntityType;
  entityId: string;
  relationship: string;
}

/**
 * Get all entities that depend on the given entity
 * Returns a list of dependent entities with their relationship type
 */
export function getEntityDependencies(
  entityType: EntityType,
  entityId: string,
): EntityDependency[] {
  const dependencies: EntityDependency[] = [];

  switch (entityType) {
    case 'Bank': {
      const accounts = useBankAccountsStore.getState().getAccountsByBank(entityId);
      accounts.forEach((account) => {
        dependencies.push({
          entityType: 'BankAccount',
          entityId: account.id,
          relationship: 'bankId',
        });
      });
      break;
    }

    case 'BankAccount': {
      // Transactions
      const incomeTransactions = useIncomeTransactionsStore
        .getState()
        .getTransactionsByAccount(entityId);
      incomeTransactions.forEach((t) => {
        dependencies.push({
          entityType: 'IncomeTransaction',
          entityId: t.id,
          relationship: 'accountId',
        });
      });

      const expenseTransactions = useExpenseTransactionsStore
        .getState()
        .getTransactionsByAccount(entityId);
      expenseTransactions.forEach((t) => {
        dependencies.push({
          entityType: 'ExpenseTransaction',
          entityId: t.id,
          relationship: 'accountId',
        });
      });

      const savingsTransactions = useSavingsInvestmentTransactionsStore
        .getState()
        .getTransactionsByAccount(entityId);
      savingsTransactions.forEach((t) => {
        dependencies.push({
          entityType: 'SavingsInvestmentTransaction',
          entityId: t.id,
          relationship: 'accountId',
        });
      });

      // EMIs
      const expenseEMIs = useExpenseEMIsStore.getState().getEMIsByAccount(entityId);
      expenseEMIs.forEach((emi) => {
        dependencies.push({
          entityType: 'ExpenseEMI',
          entityId: emi.id,
          relationship: 'accountId',
        });
      });

      const savingsEMIs = useSavingsInvestmentEMIsStore.getState().getEMIsByAccount(entityId);
      savingsEMIs.forEach((emi) => {
        dependencies.push({
          entityType: 'SavingsInvestmentEMI',
          entityId: emi.id,
          relationship: 'accountId',
        });
      });

      // Recurring Templates
      const recurringIncomes = useRecurringIncomesStore.getState().getTemplatesByAccount(entityId);
      recurringIncomes.forEach((template) => {
        dependencies.push({
          entityType: 'RecurringIncome',
          entityId: template.id,
          relationship: 'accountId',
        });
      });

      const recurringExpenses = useRecurringExpensesStore.getState().getTemplatesByAccount(entityId);
      recurringExpenses.forEach((template) => {
        dependencies.push({
          entityType: 'RecurringExpense',
          entityId: template.id,
          relationship: 'accountId',
        });
      });

      const recurringSavings = useRecurringSavingsInvestmentsStore
        .getState()
        .getTemplatesByAccount(entityId);
      recurringSavings.forEach((template) => {
        dependencies.push({
          entityType: 'RecurringSavingsInvestment',
          entityId: template.id,
          relationship: 'accountId',
        });
      });

      // Credit Card EMIs (where this account is the creditCardId)
      const creditCardEMIs = useExpenseEMIsStore
        .getState()
        .emis.filter((emi) => emi.creditCardId === entityId);
      creditCardEMIs.forEach((emi) => {
        dependencies.push({
          entityType: 'ExpenseEMI',
          entityId: emi.id,
          relationship: 'creditCardId',
        });
      });
      break;
    }

    case 'RecurringIncome': {
      const transactions = useIncomeTransactionsStore
        .getState()
        .transactions.filter((t) => t.recurringTemplateId === entityId);
      transactions.forEach((t) => {
        dependencies.push({
          entityType: 'IncomeTransaction',
          entityId: t.id,
          relationship: 'recurringTemplateId',
        });
      });
      break;
    }

    case 'RecurringExpense': {
      const transactions = useExpenseTransactionsStore
        .getState()
        .transactions.filter((t) => t.recurringTemplateId === entityId);
      transactions.forEach((t) => {
        dependencies.push({
          entityType: 'ExpenseTransaction',
          entityId: t.id,
          relationship: 'recurringTemplateId',
        });
      });
      break;
    }

    case 'RecurringSavingsInvestment': {
      const transactions = useSavingsInvestmentTransactionsStore
        .getState()
        .transactions.filter((t) => t.recurringTemplateId === entityId);
      transactions.forEach((t) => {
        dependencies.push({
          entityType: 'SavingsInvestmentTransaction',
          entityId: t.id,
          relationship: 'recurringTemplateId',
        });
      });
      break;
    }

    case 'ExpenseEMI': {
      const transactions = useExpenseTransactionsStore
        .getState()
        .transactions.filter((t) => t.emiId === entityId);
      transactions.forEach((t) => {
        dependencies.push({
          entityType: 'ExpenseTransaction',
          entityId: t.id,
          relationship: 'emiId',
        });
      });
      break;
    }

    case 'SavingsInvestmentEMI': {
      const transactions = useSavingsInvestmentTransactionsStore
        .getState()
        .transactions.filter((t) => t.emiId === entityId);
      transactions.forEach((t) => {
        dependencies.push({
          entityType: 'SavingsInvestmentTransaction',
          entityId: t.id,
          relationship: 'emiId',
        });
      });
      break;
    }

    // Transactions don't have dependencies (they are leaf nodes)
    case 'IncomeTransaction':
    case 'ExpenseTransaction':
    case 'SavingsInvestmentTransaction':
      break;
  }

  return dependencies;
}

