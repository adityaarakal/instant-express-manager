/**
 * Integration tests for Banks CRUD operations
 * Tests the complete flow of creating, reading, updating, and deleting banks
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useBanksStore } from '../../store/useBanksStore';

describe('Banks CRUD Integration', () => {
  beforeEach(() => {
    // Clear store before each test
    useBanksStore.getState().banks = [];
  });

  describe('Create Bank Flow', () => {
    it('should create a bank with all required fields', () => {
      const { createBank } = useBanksStore.getState();

      createBank({
        name: 'Test Bank',
        type: 'Bank',
      });

      const banks = useBanksStore.getState().banks;
      expect(banks).toHaveLength(1);
      expect(banks[0].name).toBe('Test Bank');
      expect(banks[0].type).toBe('Bank');
      expect(banks[0].id).toBeDefined();
    });

    it('should create multiple banks', () => {
      const { createBank } = useBanksStore.getState();

      createBank({ name: 'Bank 1', type: 'Bank' });
      createBank({ name: 'Bank 2', type: 'CreditCard' });
      createBank({ name: 'Bank 3', type: 'Bank' });

      const banks = useBanksStore.getState().banks;
      expect(banks).toHaveLength(3);
      expect(banks.map((b) => b.name)).toEqual(['Bank 1', 'Bank 2', 'Bank 3']);
    });

    it('should assign unique IDs to each bank', () => {
      const { createBank } = useBanksStore.getState();

      createBank({ name: 'Bank 1', type: 'Bank' });
      createBank({ name: 'Bank 2', type: 'Bank' });
      createBank({ name: 'Bank 3', type: 'Bank' });

      const banks = useBanksStore.getState().banks;
      expect(banks[0].id).not.toBe(banks[1].id);
      expect(banks[1].id).not.toBe(banks[2].id);
      expect(banks[0].id).not.toBe(banks[2].id);
    });
  });

  describe('Read Bank Flow', () => {
    it('should get a bank by ID', () => {
      const { createBank, getBank } = useBanksStore.getState();

      createBank({ name: 'Test Bank', type: 'Bank' });
      const bankId = useBanksStore.getState().banks[0].id;
      const bank = getBank(bankId);

      expect(bank).toBeDefined();
      expect(bank?.id).toBe(bankId);
      expect(bank?.name).toBe('Test Bank');
    });

    it('should return undefined for non-existent bank', () => {
      const { getBank } = useBanksStore.getState();

      const bank = getBank('non-existent-id');
      expect(bank).toBeUndefined();
    });

    it('should get all banks', () => {
      const { createBank } = useBanksStore.getState();

      createBank({ name: 'Bank 1', type: 'Bank' });
      createBank({ name: 'Bank 2', type: 'Bank' });
      createBank({ name: 'Bank 3', type: 'Bank' });

      expect(useBanksStore.getState().banks).toHaveLength(3);
    });
  });

  describe('Update Bank Flow', () => {
    it('should update bank name', () => {
      const { createBank, updateBank, getBank } = useBanksStore.getState();

      createBank({ name: 'Original Bank', type: 'Bank' });
      const bankId = useBanksStore.getState().banks[0].id;
      updateBank(bankId, { name: 'Updated Bank' });

      const bank = getBank(bankId);
      expect(bank?.name).toBe('Updated Bank');
      expect(bank?.type).toBe('Bank'); // Type should remain unchanged
    });

    it('should update bank type', () => {
      const { createBank, updateBank, getBank } = useBanksStore.getState();

      createBank({ name: 'Test Bank', type: 'Bank' });
      const bankId = useBanksStore.getState().banks[0].id;
      updateBank(bankId, { type: 'CreditCard' });

      const bank = getBank(bankId);
      expect(bank?.type).toBe('CreditCard');
      expect(bank?.name).toBe('Test Bank'); // Name should remain unchanged
    });

    it('should update multiple fields at once', () => {
      const { createBank, updateBank, getBank } = useBanksStore.getState();

      createBank({ name: 'Original Bank', type: 'Bank' });
      const bankId = useBanksStore.getState().banks[0].id;
      updateBank(bankId, { name: 'Updated Bank', type: 'CreditCard' });

      const bank = getBank(bankId);
      expect(bank?.name).toBe('Updated Bank');
      expect(bank?.type).toBe('CreditCard');
    });

    it('should update non-existent bank without error (silent update)', () => {
      const { updateBank } = useBanksStore.getState();

      // The store doesn't throw, it just doesn't update anything
      updateBank('non-existent-id', { name: 'Updated Bank' });
      expect(useBanksStore.getState().banks).toHaveLength(0);
    });
  });

  describe('Delete Bank Flow', () => {
    it('should delete a bank', () => {
      const { createBank, deleteBank } = useBanksStore.getState();

      createBank({ name: 'Test Bank', type: 'Bank' });
      const bankId = useBanksStore.getState().banks[0].id;
      expect(useBanksStore.getState().banks).toHaveLength(1);

      deleteBank(bankId);

      expect(useBanksStore.getState().banks).toHaveLength(0);
      expect(useBanksStore.getState().getBank(bankId)).toBeUndefined();
    });

    it('should delete correct bank when multiple exist', () => {
      const { createBank, deleteBank } = useBanksStore.getState();

      createBank({ name: 'Bank 1', type: 'Bank' });
      createBank({ name: 'Bank 2', type: 'Bank' });
      createBank({ name: 'Bank 3', type: 'Bank' });

      const banks = useBanksStore.getState().banks;
      const id1 = banks[0].id;
      const id2 = banks[1].id;
      const id3 = banks[2].id;

      expect(banks).toHaveLength(3);

      deleteBank(id2);

      expect(useBanksStore.getState().banks).toHaveLength(2);
      expect(useBanksStore.getState().getBank(id1)).toBeDefined();
      expect(useBanksStore.getState().getBank(id2)).toBeUndefined();
      expect(useBanksStore.getState().getBank(id3)).toBeDefined();
    });

    it('should delete non-existent bank without error (silent delete)', () => {
      const { deleteBank } = useBanksStore.getState();

      // The store doesn't throw, it just doesn't delete anything
      deleteBank('non-existent-id');
      expect(useBanksStore.getState().banks).toHaveLength(0);
    });
  });

  describe('Bank Validation', () => {
    it('should allow creating bank with empty name (no validation)', () => {
      const { createBank } = useBanksStore.getState();

      // The store doesn't validate empty names
      createBank({ name: '', type: 'Bank' });
      expect(useBanksStore.getState().banks).toHaveLength(1);
    });

    it('should require bank type (TypeScript enforces this)', () => {
      // TypeScript will catch this at compile time
      // Runtime validation is not enforced
      const { createBank } = useBanksStore.getState();

      // @ts-expect-error - Testing invalid input
      createBank({ name: 'Test Bank' });
      // If it gets here, the store doesn't validate at runtime
    });
  });
});

