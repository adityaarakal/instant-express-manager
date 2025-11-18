import { describe, it, expect, beforeEach, vi } from 'vitest';
import { migrateData, initializeSchemaVersion, validateDataIntegrity } from '../dataMigration';
import { useSchemaVersionStore, CURRENT_SCHEMA_VERSION } from '../../store/useSchemaVersionStore';

// Mock stores
vi.mock('../../store/useBanksStore', () => ({
  useBanksStore: {
    getState: vi.fn(() => ({
      banks: [
        { id: 'bank-1', name: 'Bank 1' },
        { id: 'bank-2', name: 'Bank 2' },
      ],
    })),
  },
}));

vi.mock('../../store/useBankAccountsStore', () => ({
  useBankAccountsStore: {
    getState: vi.fn(() => ({
      accounts: [
        { id: 'acc-1', name: 'Account 1', bankId: 'bank-1' },
        { id: 'acc-2', name: 'Account 2', bankId: 'bank-1' },
        { id: 'acc-3', name: 'Account 3', bankId: 'bank-2' },
      ],
    })),
  },
}));

vi.mock('../../store/useIncomeTransactionsStore', () => ({
  useIncomeTransactionsStore: {
    getState: vi.fn(() => ({
      transactions: [
        { id: 't1', accountId: 'acc-1', amount: 1000, description: 'Income 1' },
        { id: 't2', accountId: 'acc-2', amount: 2000, description: 'Income 2' },
      ],
    })),
  },
}));

vi.mock('../../store/useExpenseTransactionsStore', () => ({
  useExpenseTransactionsStore: {
    getState: vi.fn(() => ({
      transactions: [
        { id: 't3', accountId: 'acc-1', amount: 500, description: 'Expense 1' },
      ],
    })),
  },
}));

vi.mock('../../store/useSavingsInvestmentTransactionsStore', () => ({
  useSavingsInvestmentTransactionsStore: {
    getState: vi.fn(() => ({
      transactions: [
        { id: 't4', accountId: 'acc-2', amount: 3000, description: 'Savings 1' },
      ],
    })),
  },
}));

vi.mock('../../store/useTransferTransactionsStore', () => ({
  useTransferTransactionsStore: {
    getState: vi.fn(() => ({
      transfers: [
        { id: 'tr1', fromAccountId: 'acc-1', toAccountId: 'acc-2', amount: 100 },
      ],
    })),
  },
}));

describe('dataMigration', () => {
  beforeEach(() => {
    // Reset schema version store before each test
    useSchemaVersionStore.setState({ schemaVersion: CURRENT_SCHEMA_VERSION });
    vi.clearAllMocks();
  });

  describe('migrateData', () => {
    it('should return success with no migration if versions match', async () => {
      useSchemaVersionStore.setState({ schemaVersion: CURRENT_SCHEMA_VERSION });
      
      const result = await migrateData();
      
      expect(result.success).toBe(true);
      expect(result.migrated).toBe(false);
      expect(result.fromVersion).toBe(CURRENT_SCHEMA_VERSION);
      expect(result.toVersion).toBe(CURRENT_SCHEMA_VERSION);
      expect(result.errors).toBeUndefined();
    });

    it('should migrate from older version to current version', async () => {
      useSchemaVersionStore.setState({ schemaVersion: '1.0.0' });
      
      const result = await migrateData();
      
      expect(result.success).toBe(true);
      expect(result.migrated).toBe(true);
      expect(result.fromVersion).toBe('1.0.0');
      expect(result.toVersion).toBe(CURRENT_SCHEMA_VERSION);
      expect(result.errors).toBeUndefined();
      
      // Verify schema version was updated
      expect(useSchemaVersionStore.getState().schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
    });

    it('should handle downgrade scenario (newer stored version)', async () => {
      useSchemaVersionStore.setState({ schemaVersion: '2.0.0' });
      
      const result = await migrateData();
      
      expect(result.success).toBe(false);
      expect(result.migrated).toBe(false);
      expect(result.fromVersion).toBe('2.0.0');
      expect(result.toVersion).toBe(CURRENT_SCHEMA_VERSION);
      expect(result.errors).toBeDefined();
      expect(result.errors?.length).toBeGreaterThan(0);
      expect(result.errors?.[0]).toContain('newer than app version');
    });

    it('should handle patch version migration', async () => {
      // Test with a version that's definitely older
      const olderVersion = '0.9.0';
      useSchemaVersionStore.setState({ schemaVersion: olderVersion });
      
      const result = await migrateData();
      
      expect(result.success).toBe(true);
      expect(result.migrated).toBe(true);
      expect(result.fromVersion).toBe(olderVersion);
      expect(result.toVersion).toBe(CURRENT_SCHEMA_VERSION);
    });

    it('should handle error during migration', async () => {
      useSchemaVersionStore.setState({ schemaVersion: '0.9.0' });
      
      // Mock an error by replacing setSchemaVersion temporarily
      const originalSetVersion = useSchemaVersionStore.getState().setSchemaVersion;
      const mockSetVersion = vi.fn(() => {
        throw new Error('Migration error');
      });
      
      // Replace the setSchemaVersion method
      const store = useSchemaVersionStore.getState();
      store.setSchemaVersion = mockSetVersion;
      
      const result = await migrateData();
      
      expect(result.success).toBe(false);
      expect(result.migrated).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors?.[0]).toContain('Migration failed');
      
      // Restore original implementation
      store.setSchemaVersion = originalSetVersion;
    });
  });

  describe('initializeSchemaVersion', () => {
    it('should initialize schema version for new installation', () => {
      useSchemaVersionStore.setState({ schemaVersion: '' });
      
      initializeSchemaVersion();
      
      expect(useSchemaVersionStore.getState().schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
    });

    it('should not override existing schema version', () => {
      const existingVersion = '1.0.0';
      useSchemaVersionStore.setState({ schemaVersion: existingVersion });
      
      initializeSchemaVersion();
      
      // Should not change if already set
      expect(useSchemaVersionStore.getState().schemaVersion).toBe(existingVersion);
    });

    it('should initialize when schema version is undefined', () => {
      // @ts-expect-error - Testing undefined case
      useSchemaVersionStore.setState({ schemaVersion: undefined });
      
      initializeSchemaVersion();
      
      expect(useSchemaVersionStore.getState().schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
    });
  });

  describe('validateDataIntegrity', () => {
    it('should return valid when all references are correct', () => {
      const result = validateDataIntegrity();
      
      // Using mocked stores, all references should be valid
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    // Note: Tests for invalid references require dynamic require() mocking which is complex
    // These are covered by integration tests. The function is tested with valid data here.
    it('should validate data structure correctly', () => {
      const result = validateDataIntegrity();
      
      expect(result).toHaveProperty('isValid');
      expect(result).toHaveProperty('errors');
      expect(Array.isArray(result.errors)).toBe(true);
    });
  });
});

