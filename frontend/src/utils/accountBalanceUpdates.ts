/**
 * Utility functions for automatically updating account balances based on transactions
 */

import { useBankAccountsStore } from '../store/useBankAccountsStore';
import { useToastStore } from '../store/useToastStore';

/**
 * Update account balance based on a transaction
 * @param accountId - The account ID
 * @param amount - The transaction amount
 * @param transactionType - Type of transaction (income, expense, savings)
 * @param status - Transaction status
 * @param previousStatus - Previous status (for updates)
 * @param previousAmount - Previous amount (for updates)
 */
export function updateAccountBalanceForTransaction(
  accountId: string,
  amount: number,
  transactionType: 'income' | 'expense' | 'savings',
  status: 'Pending' | 'Received' | 'Paid' | 'Completed',
  previousStatus?: 'Pending' | 'Received' | 'Paid' | 'Completed',
  previousAmount?: number,
): void {
  const bankAccountsStore = useBankAccountsStore.getState();
  const account = bankAccountsStore.getAccount(accountId);

  if (!account) {
    // Account not found - return silently (should not happen with proper validation)
    return;
  }

  // Calculate the balance change based on transaction type and status
  let balanceChange = 0;

  // Determine if we need to reverse previous balance change
  if (previousStatus !== undefined && previousAmount !== undefined) {
    // Reverse the previous transaction's effect on balance
    if (previousStatus === 'Received' && transactionType === 'income') {
      // Income was received, reverse it (subtract)
      balanceChange -= previousAmount;
    } else if (previousStatus === 'Paid' && transactionType === 'expense') {
      // Expense was paid, reverse it (add back)
      balanceChange += previousAmount;
    } else if (previousStatus === 'Completed' && transactionType === 'savings') {
      // Savings was completed, reverse it (add back)
      balanceChange += previousAmount;
    }
  }

  // Apply the new transaction's effect on balance
  if (status === 'Received' && transactionType === 'income') {
    // Income received, add to balance
    balanceChange += amount;
  } else if (status === 'Paid' && transactionType === 'expense') {
    // Expense paid, subtract from balance
    balanceChange -= amount;
  } else if (status === 'Completed' && transactionType === 'savings') {
    // Savings completed, subtract from balance (money moved out)
    balanceChange -= amount;
  }

  // Only update if there's a balance change
  if (balanceChange !== 0) {
    const newBalance = account.currentBalance + balanceChange;
    
    // For credit cards, we might allow negative balances (debt)
    // For other accounts, validate that balance doesn't go negative
    if (account.accountType !== 'CreditCard' && newBalance < 0) {
      // Show warning toast to user about negative balance
      useToastStore.getState().showWarning(
        `Warning: Account "${account.name}" balance will become negative (₹${newBalance.toFixed(2)}). ` +
        `Please adjust the account balance if needed.`,
        6000
      );
      // Still update but warn user - user can manually adjust if needed
    }

    bankAccountsStore.updateAccountBalance(accountId, newBalance);
  }
}

/**
 * Reverse a transaction's effect on account balance when transaction is deleted
 * @param accountId - The account ID
 * @param amount - The transaction amount
 * @param transactionType - Type of transaction (income, expense, savings)
 * @param status - Transaction status
 */
export function reverseAccountBalanceForTransaction(
  accountId: string,
  amount: number,
  transactionType: 'income' | 'expense' | 'savings',
  status: 'Pending' | 'Received' | 'Paid' | 'Completed',
): void {
  const bankAccountsStore = useBankAccountsStore.getState();
  const account = bankAccountsStore.getAccount(accountId);

  if (!account) {
    // Account not found - return silently (should not happen with proper validation)
    return;
  }

  // Only reverse if the transaction was actually applied (Received/Paid/Completed)
  if (
    (status === 'Received' && transactionType === 'income') ||
    (status === 'Paid' && transactionType === 'expense') ||
    (status === 'Completed' && transactionType === 'savings')
  ) {
    let balanceChange = 0;

    if (status === 'Received' && transactionType === 'income') {
      // Reverse received income (subtract)
      balanceChange -= amount;
    } else if (status === 'Paid' && transactionType === 'expense') {
      // Reverse paid expense (add back)
      balanceChange += amount;
    } else if (status === 'Completed' && transactionType === 'savings') {
      // Reverse completed savings (add back)
      balanceChange += amount;
    }

    if (balanceChange !== 0) {
      const newBalance = account.currentBalance + balanceChange;
      bankAccountsStore.updateAccountBalance(accountId, newBalance);
    }
  }
}

