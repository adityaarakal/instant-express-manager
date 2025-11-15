/**
 * Utility functions for automatically updating account balances based on transfer transactions
 */

import { useBankAccountsStore } from '../store/useBankAccountsStore';
import type { TransferTransaction } from '../types/transactions';

/**
 * Update account balances based on a transfer transaction
 * @param transfer - The transfer transaction
 */
export function updateAccountBalancesForTransfer(transfer: TransferTransaction): void {
  const bankAccountsStore = useBankAccountsStore.getState();
  const fromAccount = bankAccountsStore.getAccount(transfer.fromAccountId);
  const toAccount = bankAccountsStore.getAccount(transfer.toAccountId);

  if (!fromAccount) {
    console.warn(`From account with id ${transfer.fromAccountId} not found`);
    return;
  }

  if (!toAccount) {
    console.warn(`To account with id ${transfer.toAccountId} not found`);
    return;
  }

  // Only update balances if transfer is completed
  if (transfer.status === 'Completed') {
    // From account: decrease balance
    const newFromBalance = fromAccount.currentBalance - transfer.amount;
    
    // Validate from account balance (only for non-credit accounts)
    if (fromAccount.accountType !== 'CreditCard' && newFromBalance < 0) {
      console.warn(
        `Transfer would result in negative balance for account ${fromAccount.name}. ` +
        `Current balance: ${fromAccount.currentBalance}, Transfer amount: ${transfer.amount}, New balance: ${newFromBalance}`
      );
      // Still update but log warning - user can manually adjust if needed
    }

    // To account: increase balance
    const newToBalance = toAccount.currentBalance + transfer.amount;

    bankAccountsStore.updateAccountBalance(transfer.fromAccountId, newFromBalance);
    bankAccountsStore.updateAccountBalance(transfer.toAccountId, newToBalance);
  }
}

/**
 * Reverse account balance changes when transfer is deleted or status changes to Pending
 * @param transfer - The transfer transaction to reverse
 */
export function reverseAccountBalancesForTransfer(transfer: TransferTransaction): void {
  const bankAccountsStore = useBankAccountsStore.getState();
  const fromAccount = bankAccountsStore.getAccount(transfer.fromAccountId);
  const toAccount = bankAccountsStore.getAccount(transfer.toAccountId);

  if (!fromAccount || !toAccount) {
    console.warn(`Account not found for transfer reversal`);
    return;
  }

  // Only reverse if transfer was completed
  if (transfer.status === 'Completed') {
    // Reverse: From account gets money back, To account loses money
    const newFromBalance = fromAccount.currentBalance + transfer.amount;
    const newToBalance = toAccount.currentBalance - transfer.amount;

    bankAccountsStore.updateAccountBalance(transfer.fromAccountId, newFromBalance);
    bankAccountsStore.updateAccountBalance(transfer.toAccountId, newToBalance);
  }
}

/**
 * Handle balance updates when a transfer is updated
 * @param updatedTransfer - The updated transfer
 * @param previousTransfer - The previous state of the transfer
 */
export function updateAccountBalancesForTransferUpdate(
  updatedTransfer: TransferTransaction,
  previousTransfer: TransferTransaction,
): void {
  const bankAccountsStore = useBankAccountsStore.getState();

  // Determine what changed
  const statusChanged = updatedTransfer.status !== previousTransfer.status;
  const amountChanged = updatedTransfer.amount !== previousTransfer.amount;
  const fromAccountChanged = updatedTransfer.fromAccountId !== previousTransfer.fromAccountId;
  const toAccountChanged = updatedTransfer.toAccountId !== previousTransfer.toAccountId;

  // If accounts changed, reverse on old accounts and apply to new accounts
  if (fromAccountChanged || toAccountChanged) {
    // Reverse previous transfer
    reverseAccountBalancesForTransfer(previousTransfer);
    // Apply new transfer
    updateAccountBalancesForTransfer(updatedTransfer);
    return;
  }

  // If status changed
  if (statusChanged) {
    if (previousTransfer.status === 'Completed' && updatedTransfer.status === 'Pending') {
      // Was completed, now pending - reverse
      reverseAccountBalancesForTransfer(previousTransfer);
    } else if (previousTransfer.status === 'Pending' && updatedTransfer.status === 'Completed') {
      // Was pending, now completed - apply
      updateAccountBalancesForTransfer(updatedTransfer);
    }
  }

  // If amount changed (and status is Completed)
  if (amountChanged && updatedTransfer.status === 'Completed') {
    // Reverse old amount
    const fromAccount = bankAccountsStore.getAccount(updatedTransfer.fromAccountId);
    const toAccount = bankAccountsStore.getAccount(updatedTransfer.toAccountId);
    
    if (fromAccount && toAccount) {
      // Reverse previous amount
      const oldFromBalance = fromAccount.currentBalance + previousTransfer.amount;
      const oldToBalance = toAccount.currentBalance - previousTransfer.amount;
      
      bankAccountsStore.updateAccountBalance(updatedTransfer.fromAccountId, oldFromBalance);
      bankAccountsStore.updateAccountBalance(updatedTransfer.toAccountId, oldToBalance);
      
      // Apply new amount
      updateAccountBalancesForTransfer(updatedTransfer);
    }
  }

  // If amount changed but status was already Completed (but didn't change)
  if (amountChanged && !statusChanged && previousTransfer.status === 'Completed') {
    // This case is handled above in the amountChanged check
    // But we need to ensure it only applies if status is still Completed
    if (updatedTransfer.status === 'Completed') {
      const fromAccount = bankAccountsStore.getAccount(updatedTransfer.fromAccountId);
      const toAccount = bankAccountsStore.getAccount(updatedTransfer.toAccountId);
      
      if (fromAccount && toAccount) {
        // Reverse previous amount
        const oldFromBalance = fromAccount.currentBalance + previousTransfer.amount;
        const oldToBalance = toAccount.currentBalance - previousTransfer.amount;
        
        bankAccountsStore.updateAccountBalance(updatedTransfer.fromAccountId, oldFromBalance);
        bankAccountsStore.updateAccountBalance(updatedTransfer.toAccountId, oldToBalance);
        
        // Apply new amount
        updateAccountBalancesForTransfer(updatedTransfer);
      }
    }
  }
}

