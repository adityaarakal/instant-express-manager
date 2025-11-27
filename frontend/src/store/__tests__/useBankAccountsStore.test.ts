import { describe, it, expect, beforeEach } from 'vitest';
import { useBankAccountsStore } from '../useBankAccountsStore';
import { useBanksStore } from '../useBanksStore';
import type { BankAccount } from '../../types/bankAccounts';

describe('useBankAccountsStore', () => {
  let bankId: string;

  beforeEach(() => {
    // Reset stores
    useBanksStore.setState({ banks: [] });
    useBankAccountsStore.setState({ accounts: [] });

    // Create a test bank
    useBanksStore.getState().createBank({ name: 'Test Bank', code: 'TB' });
    const banks = useBanksStore.getState().banks;
    bankId = banks[0].id;
  });

  it('should create a bank account', () => {
    const accountData: Omit<BankAccount, 'id' | 'createdAt' | 'updatedAt'> = {
      bankId,
      name: 'Test Account',
      accountType: 'Savings',
      accountNumber: '123456',
      currentBalance: 10000,
    };

    useBankAccountsStore.getState().createAccount(accountData);

    const accounts = useBankAccountsStore.getState().accounts;
    expect(accounts).toHaveLength(1);
    expect(accounts[0].name).toBe('Test Account');
    expect(accounts[0].accountType).toBe('Savings');
    expect(accounts[0].id).toBeDefined();
  });

  it('should update a bank account', () => {
    const accountData: Omit<BankAccount, 'id' | 'createdAt' | 'updatedAt'> = {
      bankId,
      name: 'Test Account',
      accountType: 'Savings',
      accountNumber: '123456',
      currentBalance: 10000,
    };

    useBankAccountsStore.getState().createAccount(accountData);
    const accounts = useBankAccountsStore.getState().accounts;
    const accountId = accounts[0].id;

    const updatedData = { name: 'Updated Account', currentBalance: 20000 };
    useBankAccountsStore.getState().updateAccount(accountId, updatedData);

    const account = useBankAccountsStore.getState().getAccount(accountId);
    expect(account?.name).toBe('Updated Account');
    expect(account?.currentBalance).toBe(20000);
  });

  it('should delete a bank account', () => {
    const accountData: Omit<BankAccount, 'id' | 'createdAt' | 'updatedAt'> = {
      bankId,
      name: 'Test Account',
      accountType: 'Savings',
      accountNumber: '123456',
      currentBalance: 10000,
    };

    useBankAccountsStore.getState().createAccount(accountData);
    const accounts = useBankAccountsStore.getState().accounts;
    const accountId = accounts[0].id;
    expect(useBankAccountsStore.getState().accounts).toHaveLength(1);

    useBankAccountsStore.getState().deleteAccount(accountId);

    expect(useBankAccountsStore.getState().accounts).toHaveLength(0);
    expect(useBankAccountsStore.getState().getAccount(accountId)).toBeUndefined();
  });

  it('should get accounts by bank id', () => {
    useBankAccountsStore.getState().createAccount({
      bankId,
      name: 'Account 1',
      accountType: 'Savings',
      accountNumber: '123456',
      currentBalance: 10000,
    });

    useBanksStore.getState().createBank({ name: 'Bank 2', code: 'B2' });
    const banks = useBanksStore.getState().banks;
    const secondBankId = banks.find(b => b.name === 'Bank 2')?.id;
    
    useBankAccountsStore.getState().createAccount({
      bankId: secondBankId!,
      name: 'Account 2',
      accountType: 'Savings',
      accountNumber: '789012',
      currentBalance: 20000,
    });

    const accounts = useBankAccountsStore.getState().getAccountsByBank(bankId);
    expect(accounts).toHaveLength(1);
    expect(accounts[0].name).toBe('Account 1');
  });

  it('should validate bank id exists', () => {
    expect(() => {
      useBankAccountsStore.getState().createAccount({
        bankId: 'non-existent-bank-id',
        name: 'Test Account',
        accountType: 'Savings',
        accountNumber: '123456',
        currentBalance: 10000,
      });
    }).toThrow();
  });
});

