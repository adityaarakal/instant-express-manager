/**
 * Integration tests for Bank and Bank Account CRUD operations
 * Tests the complete flow of creating, reading, updating, and deleting banks and accounts
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useBanksStore } from '../../store/useBanksStore';
import { useBankAccountsStore } from '../../store/useBankAccountsStore';

describe('Bank and Bank Account CRUD Integration', () => {
  beforeEach(() => {
    // Clear stores before each test
    useBanksStore.getState().banks = [];
    useBankAccountsStore.getState().accounts = [];
  });

  describe('Create Bank and Account Flow', () => {
    it('should create a bank and then create an account for that bank', () => {
      const { createBank, getBank } = useBanksStore.getState();
      const { createAccount } = useBankAccountsStore.getState();

      // Create a bank
      createBank({ name: 'Test Bank', type: 'Bank' as const });
      expect(useBanksStore.getState().banks).toHaveLength(1);
      const bank = useBanksStore.getState().banks[0];
      expect(bank.name).toBe('Test Bank');

      // Create an account for the bank
      createAccount({
        bankId: bank.id,
        name: 'Test Account',
        accountType: 'Savings',
        currentBalance: 1000,
        accountNumber: '123456',
      });

      expect(useBankAccountsStore.getState().accounts).toHaveLength(1);
      const account = useBankAccountsStore.getState().accounts[0];
      expect(account.name).toBe('Test Account');
      expect(account.bankId).toBe(bank.id);

      // Verify relationship
      const accounts = useBankAccountsStore.getState().accounts;
      const createdAccount = accounts.find((a) => a.id === account.id);
      expect(createdAccount?.bankId).toBe(bank.id);
    });

    it('should prevent creating account for non-existent bank', () => {
      const { createAccount } = useBankAccountsStore.getState();

      expect(() => {
        createAccount({
          bankId: 'non-existent-id',
          name: 'Test Account',
          accountType: 'Savings',
          currentBalance: 1000,
          accountNumber: '123456',
        });
      }).toThrow();
    });
  });

  describe('Update Bank and Account Flow', () => {
    it('should update bank and verify account relationship is maintained', () => {
      const { createBank, updateBank } = useBanksStore.getState();
      const { createAccount } = useBankAccountsStore.getState();

      // Create bank and account
      createBank({ name: 'Original Bank', type: 'Bank' as const });
      const bank = useBanksStore.getState().banks[0];
      createAccount({
        bankId: bank.id,
        name: 'Test Account',
        accountType: 'Savings',
        currentBalance: 1000,
        accountNumber: '123456',
      });
      const account = useBankAccountsStore.getState().accounts[0];

      // Update bank name
      updateBank(bank.id, { name: 'Updated Bank' });

      // Verify bank is updated
      const updatedBank = useBanksStore.getState().banks.find((b) => b.id === bank.id);
      expect(updatedBank?.name).toBe('Updated Bank');

      // Verify account relationship is still intact
      const updatedAccount = useBankAccountsStore.getState().accounts.find((a) => a.id === account.id);
      expect(updatedAccount?.bankId).toBe(bank.id);
    });

    it('should update account balance and verify it persists', () => {
      const { createBank } = useBanksStore.getState();
      const { createAccount, updateAccount } = useBankAccountsStore.getState();

      // Create bank and account
      createBank({ name: 'Test Bank', type: 'Bank' as const });
      const bank = useBanksStore.getState().banks[0];
      createAccount({
        bankId: bank.id,
        name: 'Test Account',
        accountType: 'Savings',
        currentBalance: 1000,
        accountNumber: '123456',
      });
      const account = useBankAccountsStore.getState().accounts[0];

      // Update account balance
      updateAccount(account.id, { currentBalance: 2000 });

      // Verify balance is updated
      const updatedAccount = useBankAccountsStore.getState().accounts.find((a) => a.id === account.id);
      expect(updatedAccount?.currentBalance).toBe(2000);
    });
  });

  describe('Delete Bank and Account Flow', () => {
    it('should delete account and verify it is removed', () => {
      const { createBank } = useBanksStore.getState();
      const { createAccount, deleteAccount } = useBankAccountsStore.getState();

      // Create bank and account
      createBank({ name: 'Test Bank', type: 'Bank' as const });
      const bank = useBanksStore.getState().banks[0];
      createAccount({
        bankId: bank.id,
        name: 'Test Account',
        accountType: 'Savings',
        currentBalance: 1000,
        accountNumber: '123456',
      });
      const account = useBankAccountsStore.getState().accounts[0];

      expect(useBankAccountsStore.getState().accounts).toHaveLength(1);

      // Delete account
      deleteAccount(account.id);

      // Verify account is deleted
      expect(useBankAccountsStore.getState().accounts).toHaveLength(0);
      expect(useBankAccountsStore.getState().accounts.find((a) => a.id === account.id)).toBeUndefined();

      // Verify bank still exists
      expect(useBanksStore.getState().banks).toHaveLength(1);
    });

    it('should prevent deleting bank with accounts (validation)', () => {
      const { createBank, deleteBank } = useBanksStore.getState();
      const { createAccount, deleteAccount } = useBankAccountsStore.getState();

      // Create bank and multiple accounts
      createBank({ name: 'Test Bank', type: 'Bank' as const });
      const bank = useBanksStore.getState().banks[0];
      createAccount({
        bankId: bank.id,
        name: 'Account 1',
        accountType: 'Savings',
        currentBalance: 1000,
        accountNumber: '123456',
      });
      createAccount({
        bankId: bank.id,
        name: 'Account 2',
        accountType: 'Current',
        currentBalance: 2000,
        accountNumber: '789012',
      });
      const account1 = useBankAccountsStore.getState().accounts[0];
      const account2 = useBankAccountsStore.getState().accounts[1];

      expect(useBankAccountsStore.getState().accounts).toHaveLength(2);

      // Try to delete bank (should fail because accounts exist)
      expect(() => {
        deleteBank(bank.id);
      }).toThrow();

      // Verify bank and accounts still exist
      expect(useBanksStore.getState().banks).toHaveLength(1);
      expect(useBankAccountsStore.getState().accounts).toHaveLength(2);

      // Delete accounts first
      deleteAccount(account1.id);
      deleteAccount(account2.id);

      // Now delete bank should succeed
      deleteBank(bank.id);

      // Verify bank is deleted
      expect(useBanksStore.getState().banks).toHaveLength(0);
      expect(useBankAccountsStore.getState().accounts).toHaveLength(0);
    });
  });

  describe('Multiple Banks and Accounts Flow', () => {
    it('should manage multiple banks with multiple accounts each', () => {
      const { createBank } = useBanksStore.getState();
      const { createAccount } = useBankAccountsStore.getState();

      // Create two banks
      createBank({ name: 'Bank 1', type: 'Bank' as const });
      createBank({ name: 'Bank 2', type: 'Bank' as const });
      const banks = useBanksStore.getState().banks;
      const bank1 = banks[0];
      const bank2 = banks[1];

      // Create accounts for each bank
      createAccount({
        bankId: bank1.id,
        name: 'Bank 1 Account A',
        accountType: 'Savings',
        currentBalance: 1000,
        accountNumber: '111111',
      });
      createAccount({
        bankId: bank1.id,
        name: 'Bank 1 Account B',
        accountType: 'Current',
        currentBalance: 2000,
        accountNumber: '222222',
      });
      createAccount({
        bankId: bank2.id,
        name: 'Bank 2 Account A',
        accountType: 'Savings',
        currentBalance: 3000,
        accountNumber: '333333',
      });

      // Verify counts
      expect(useBanksStore.getState().banks).toHaveLength(2);
      expect(useBankAccountsStore.getState().accounts).toHaveLength(3);

      // Verify relationships
      const accounts = useBankAccountsStore.getState().accounts;
      const bank1Accounts = accounts.filter((a) => a.bankId === bank1.id);
      const bank2Accounts = accounts.filter((a) => a.bankId === bank2.id);

      expect(bank1Accounts).toHaveLength(2);
      expect(bank2Accounts).toHaveLength(1);
      expect(bank1Accounts.map((a) => a.name)).toContain('Bank 1 Account A');
      expect(bank1Accounts.map((a) => a.name)).toContain('Bank 1 Account B');
      expect(bank2Accounts.map((a) => a.name)).toContain('Bank 2 Account A');
    });
  });
});

