import { describe, it, expect, beforeEach } from 'vitest';
import { useBanksStore } from '../useBanksStore';
import type { Bank } from '../../types/banks';

describe('useBanksStore', () => {
  beforeEach(() => {
    // Reset store before each test
    useBanksStore.setState({ banks: [] });
  });

  it('should create a bank', () => {
    const bankData: Omit<Bank, 'id' | 'createdAt' | 'updatedAt'> = {
      name: 'Test Bank',
      code: 'TB',
    };

    const bankId = useBanksStore.getState().createBank(bankData);

    expect(bankId).toBeDefined();
    const banks = useBanksStore.getState().banks;
    expect(banks).toHaveLength(1);
    expect(banks[0].name).toBe('Test Bank');
    expect(banks[0].code).toBe('TB');
  });

  it('should update a bank', () => {
    const bankData: Omit<Bank, 'id' | 'createdAt' | 'updatedAt'> = {
      name: 'Test Bank',
      code: 'TB',
    };

    const bankId = useBanksStore.getState().createBank(bankData);
    const updatedData = { name: 'Updated Bank', code: 'UB' };

    useBanksStore.getState().updateBank(bankId, updatedData);

    const bank = useBanksStore.getState().getBank(bankId);
    expect(bank?.name).toBe('Updated Bank');
    expect(bank?.code).toBe('UB');
  });

  it('should delete a bank', () => {
    const bankData: Omit<Bank, 'id' | 'createdAt' | 'updatedAt'> = {
      name: 'Test Bank',
      code: 'TB',
    };

    const bankId = useBanksStore.getState().createBank(bankData);
    expect(useBanksStore.getState().banks).toHaveLength(1);

    useBanksStore.getState().deleteBank(bankId);

    expect(useBanksStore.getState().banks).toHaveLength(0);
    expect(useBanksStore.getState().getBank(bankId)).toBeUndefined();
  });

  it('should get a bank by id', () => {
    const bankData: Omit<Bank, 'id' | 'createdAt' | 'updatedAt'> = {
      name: 'Test Bank',
      code: 'TB',
    };

    const bankId = useBanksStore.getState().createBank(bankData);
    const bank = useBanksStore.getState().getBank(bankId);

    expect(bank).toBeDefined();
    expect(bank?.id).toBe(bankId);
    expect(bank?.name).toBe('Test Bank');
  });

  it('should get all banks', () => {
    useBanksStore.getState().createBank({ name: 'Bank 1', code: 'B1' });
    useBanksStore.getState().createBank({ name: 'Bank 2', code: 'B2' });

    const banks = useBanksStore.getState().banks;
    expect(banks).toHaveLength(2);
  });

  it('should validate bank name is required', () => {
    expect(() => {
      useBanksStore.getState().createBank({ name: '', code: 'TB' });
    }).toThrow();
  });
});

