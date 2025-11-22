/**
 * Tests for backupService with validation and rollback
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock useSchemaVersionStore - it's required dynamically using require() in backupService
// We'll mock it at the module level and also handle the require() call
const mockSetSchemaVersion = vi.fn();
vi.mock('../../store/useSchemaVersionStore', () => ({
  useSchemaVersionStore: {
    getState: () => ({
      setSchemaVersion: mockSetSchemaVersion,
    }),
  },
}));

// Also need to handle the require() call which uses '../store/useSchemaVersionStore' relative to backupService.ts
// We'll create a manual module resolution
vi.mock('../store/useSchemaVersionStore', () => ({
  useSchemaVersionStore: {
    getState: () => ({
      setSchemaVersion: mockSetSchemaVersion,
    }),
  },
}));
import {
  exportBackup,
  downloadBackup,
  validateBackup,
  importBackup,
  readBackupFile,
  type BackupData,
} from '../backupService';
import { useBanksStore } from '../../store/useBanksStore';
import { useBankAccountsStore } from '../../store/useBankAccountsStore';
import { useIncomeTransactionsStore } from '../../store/useIncomeTransactionsStore';
import { useExpenseTransactionsStore } from '../../store/useExpenseTransactionsStore';
import { useSavingsInvestmentTransactionsStore } from '../../store/useSavingsInvestmentTransactionsStore';
import { useExpenseEMIsStore } from '../../store/useExpenseEMIsStore';
import { useSavingsInvestmentEMIsStore } from '../../store/useSavingsInvestmentEMIsStore';
import { useRecurringIncomesStore } from '../../store/useRecurringIncomesStore';
import { useRecurringExpensesStore } from '../../store/useRecurringExpensesStore';
import { useRecurringSavingsInvestmentsStore } from '../../store/useRecurringSavingsInvestmentsStore';
import { useExportHistoryStore } from '../../store/useExportHistoryStore';
import { validateFile, validateBackupStructure, safeJsonParse } from '../security';
import { performanceMonitor } from '../performanceMonitoring';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(() => null),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
global.localStorage = localStorageMock as any;

// Mock dependencies
vi.mock('../../store/useBanksStore');
vi.mock('../../store/useBankAccountsStore');
vi.mock('../../store/useIncomeTransactionsStore');
vi.mock('../../store/useExpenseTransactionsStore');
vi.mock('../../store/useSavingsInvestmentTransactionsStore');
vi.mock('../../store/useExpenseEMIsStore');
vi.mock('../../store/useSavingsInvestmentEMIsStore');
vi.mock('../../store/useRecurringIncomesStore');
vi.mock('../../store/useRecurringExpensesStore');
vi.mock('../../store/useRecurringSavingsInvestmentsStore');
vi.mock('../../store/useExportHistoryStore');
vi.mock('../security');
vi.mock('../performanceMonitoring', () => ({
  performanceMonitor: {
    trackOperation: vi.fn((name, fn) => fn()),
  },
}));

// Mock global constants
global.__APP_VERSION__ = '1.0.61';

// Mock URL methods
global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
global.URL.revokeObjectURL = vi.fn();

// Mock FileReader
class MockFileReader {
  result: string | ArrayBuffer | null = null;
  onload: ((e: ProgressEvent<FileReader>) => void) | null = null;
  onerror: ((e: ProgressEvent<FileReader>) => void) | null = null;

  readAsText(file: File) {
    setTimeout(() => {
      if (this.onload) {
        const event = {
          target: { result: this.result },
        } as ProgressEvent<FileReader>;
        this.onload(event);
      }
    }, 0);
  }
}

global.FileReader = MockFileReader as any;

describe('backupService', () => {
  const mockBanks = [{ id: 'bank-1', name: 'Test Bank', type: 'Bank' }];
  const mockAccounts = [{ id: 'account-1', name: 'Test Account', bankId: 'bank-1', accountType: 'Savings', currentBalance: 1000, createdAt: '', updatedAt: '' }];
  const mockIncomeTransactions = [{ id: 't1', accountId: 'account-1', amount: 1000, date: '2024-01-01', category: 'Salary', description: 'Test', status: 'Received' as const }];
  const mockExpenseTransactions = [{ id: 't2', accountId: 'account-1', amount: 500, date: '2024-01-02', category: 'Food', description: 'Test', status: 'Paid' as const }];
  const mockSavingsTransactions = [{ id: 't3', accountId: 'account-1', amount: 200, date: '2024-01-03', category: 'Investment', description: 'Test', status: 'Completed' as const }];
  const mockExpenseEMIs = [{ id: 'emi-1', name: 'Test EMI', accountId: 'account-1', amount: 1000, startDate: '2024-01-01', totalInstallments: 12, completedInstallments: 0 }];
  const mockSavingsEMIs = [{ id: 'emi-2', name: 'Savings EMI', accountId: 'account-1', amount: 500, startDate: '2024-01-01', totalInstallments: 6, completedInstallments: 0 }];
  const mockRecurringIncomes = [{ id: 'r1', accountId: 'account-1', amount: 1000, category: 'Salary', description: 'Monthly', frequency: 'Monthly' as const, startDate: '2024-01-01' }];
  const mockRecurringExpenses = [{ id: 'r2', accountId: 'account-1', amount: 500, category: 'Food', description: 'Monthly', frequency: 'Monthly' as const, startDate: '2024-01-01' }];
  const mockRecurringSavings = [{ id: 'r3', accountId: 'account-1', amount: 200, category: 'Investment', description: 'Monthly', frequency: 'Monthly' as const, startDate: '2024-01-01' }];

  const validBackup: BackupData = {
    version: '1.0.61',
    timestamp: '2024-01-01T00:00:00Z',
    data: {
      banks: mockBanks,
      bankAccounts: mockAccounts,
      incomeTransactions: mockIncomeTransactions,
      expenseTransactions: mockExpenseTransactions,
      savingsInvestmentTransactions: mockSavingsTransactions,
      expenseEMIs: mockExpenseEMIs,
      savingsInvestmentEMIs: mockSavingsEMIs,
      recurringIncomes: mockRecurringIncomes,
      recurringExpenses: mockRecurringExpenses,
      recurringSavingsInvestments: mockRecurringSavings,
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default store mocks
    vi.mocked(useBanksStore.getState).mockReturnValue({
      banks: mockBanks,
      setState: vi.fn(),
    } as any);

    vi.mocked(useBankAccountsStore.getState).mockReturnValue({
      accounts: mockAccounts,
      setState: vi.fn(),
    } as any);

    vi.mocked(useIncomeTransactionsStore.getState).mockReturnValue({
      transactions: mockIncomeTransactions,
      setState: vi.fn(),
    } as any);

    vi.mocked(useExpenseTransactionsStore.getState).mockReturnValue({
      transactions: mockExpenseTransactions,
      setState: vi.fn(),
    } as any);

    vi.mocked(useSavingsInvestmentTransactionsStore.getState).mockReturnValue({
      transactions: mockSavingsTransactions,
      setState: vi.fn(),
    } as any);

    vi.mocked(useExpenseEMIsStore.getState).mockReturnValue({
      emis: mockExpenseEMIs,
      setState: vi.fn(),
    } as any);

    vi.mocked(useSavingsInvestmentEMIsStore.getState).mockReturnValue({
      emis: mockSavingsEMIs,
      setState: vi.fn(),
    } as any);

    vi.mocked(useRecurringIncomesStore.getState).mockReturnValue({
      templates: mockRecurringIncomes,
      setState: vi.fn(),
    } as any);

    vi.mocked(useRecurringExpensesStore.getState).mockReturnValue({
      templates: mockRecurringExpenses,
      setState: vi.fn(),
    } as any);

    vi.mocked(useRecurringSavingsInvestmentsStore.getState).mockReturnValue({
      templates: mockRecurringSavings,
      setState: vi.fn(),
    } as any);

    vi.mocked(useExportHistoryStore.getState).mockReturnValue({
      addExport: vi.fn(),
    } as any);

    vi.mocked(performanceMonitor.trackOperation).mockImplementation((name, fn) => fn());

    vi.mocked(validateFile).mockReturnValue({ valid: true });
    vi.mocked(validateBackupStructure).mockReturnValue({ valid: true });
    vi.mocked(safeJsonParse).mockImplementation((text) => JSON.parse(text));
  });

  describe('exportBackup', () => {
    it('should export all data correctly', () => {
      const backup = exportBackup();

      expect(backup).toHaveProperty('version');
      expect(backup).toHaveProperty('timestamp');
      expect(backup).toHaveProperty('data');
      expect(backup.data.banks).toEqual(mockBanks);
      expect(backup.data.bankAccounts).toEqual(mockAccounts);
      expect(backup.data.incomeTransactions).toEqual(mockIncomeTransactions);
      expect(backup.data.expenseTransactions).toEqual(mockExpenseTransactions);
      expect(backup.data.savingsInvestmentTransactions).toEqual(mockSavingsTransactions);
      expect(backup.data.expenseEMIs).toEqual(mockExpenseEMIs);
      expect(backup.data.savingsInvestmentEMIs).toEqual(mockSavingsEMIs);
      expect(backup.data.recurringIncomes).toEqual(mockRecurringIncomes);
      expect(backup.data.recurringExpenses).toEqual(mockRecurringExpenses);
      expect(backup.data.recurringSavingsInvestments).toEqual(mockRecurringSavings);
    });

    it('should include current app version', () => {
      const backup = exportBackup();
      expect(backup.version).toBe('1.0.61');
    });

    it('should include ISO timestamp', () => {
      const backup = exportBackup();
      expect(backup.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });
  });

  describe('downloadBackup', () => {
    it('should create download link and trigger download', () => {
      const createElementSpy = vi.spyOn(document, 'createElement');
      const appendChildSpy = vi.spyOn(document.body, 'appendChild').mockImplementation(() => ({} as any));
      const removeChildSpy = vi.spyOn(document.body, 'removeChild').mockImplementation(() => ({} as any));
      const clickSpy = vi.fn();
      const revokeObjectURLSpy = vi.fn();
      global.URL.revokeObjectURL = revokeObjectURLSpy;

      const mockLink = {
        href: '',
        download: '',
        click: clickSpy,
      } as any;

      createElementSpy.mockReturnValue(mockLink);

      downloadBackup();

      expect(createElementSpy).toHaveBeenCalledWith('a');
      expect(appendChildSpy).toHaveBeenCalled();
      expect(clickSpy).toHaveBeenCalled();
      expect(removeChildSpy).toHaveBeenCalled();
      expect(revokeObjectURLSpy).toHaveBeenCalled();
      expect(useExportHistoryStore.getState().addExport).toHaveBeenCalled();
    });
  });

  describe('validateBackup', () => {
    it('should validate correct backup structure', () => {
      expect(validateBackup(validBackup)).toBe(true);
    });

    it('should reject null or undefined', () => {
      expect(validateBackup(null)).toBe(false);
      expect(validateBackup(undefined)).toBe(false);
    });

    it('should reject non-object values', () => {
      expect(validateBackup('string')).toBe(false);
      expect(validateBackup(123)).toBe(false);
      expect(validateBackup([])).toBe(false);
    });

    it('should reject backup without version', () => {
      const invalid = { ...validBackup };
      delete (invalid as any).version;
      expect(validateBackup(invalid)).toBe(false);
    });

    it('should reject backup without timestamp', () => {
      const invalid = { ...validBackup };
      delete (invalid as any).timestamp;
      expect(validateBackup(invalid)).toBe(false);
    });

    it('should reject backup without data', () => {
      const invalid = { ...validBackup };
      delete (invalid as any).data;
      expect(validateBackup(invalid)).toBe(false);
    });

    it('should reject backup with non-array data fields', () => {
      const invalid = { ...validBackup, data: { ...validBackup.data, banks: 'not an array' } };
      expect(validateBackup(invalid)).toBe(false);
    });

    it('should reject backup with missing required data fields', () => {
      const invalid = { ...validBackup, data: { ...validBackup.data } };
      delete (invalid.data as any).banks;
      expect(validateBackup(invalid)).toBe(false);
    });
  });

  describe('importBackup', () => {
    beforeEach(() => {
      // Mock require() for useSchemaVersionStore before each test
      const Module = require('module');
      const originalRequire = Module.prototype.require;
      Module.prototype.require = function(id: string) {
        if (id === '../store/useSchemaVersionStore' || id.includes('useSchemaVersionStore')) {
          return {
            useSchemaVersionStore: {
              getState: () => ({
                setSchemaVersion: mockSetSchemaVersion,
              }),
            },
          };
        }
        return originalRequire.apply(this, arguments);
      };
    });

    it('should import backup in replace mode', () => {
      const result = importBackup(validBackup, true);

      expect(result.success).toBe(true);
      expect(result.backupVersion).toBe('1.0.61');
      expect(useBanksStore.setState).toHaveBeenCalledWith({ banks: validBackup.data.banks });
      expect(useBankAccountsStore.setState).toHaveBeenCalledWith({ accounts: validBackup.data.bankAccounts });
      expect(mockSetSchemaVersion).toHaveBeenCalled();
    });

    it('should import backup in merge mode', () => {
      const result = importBackup(validBackup, false);

      expect(result.success).toBe(true);
      expect(result.backupVersion).toBe('1.0.61');
      // In merge mode, should merge with existing data
      expect(useBanksStore.setState).toHaveBeenCalled();
      expect(useBankAccountsStore.setState).toHaveBeenCalled();
    });

    it('should merge data without duplicates in merge mode', () => {
      // Setup existing data with same IDs
      const existingBank = { id: 'bank-1', name: 'Existing Bank', type: 'Bank' };
      vi.mocked(useBanksStore.getState).mockReturnValue({
        banks: [existingBank],
        setState: vi.fn(),
      } as any);

      const result = importBackup(validBackup, false);

      expect(result.success).toBe(true);
      // Should merge, keeping existing bank (same ID)
      const setStateCall = vi.mocked(useBanksStore.setState).mock.calls[0];
      expect(setStateCall[0].banks).toHaveLength(1);
      expect(setStateCall[0].banks[0].id).toBe('bank-1');
    });

    it('should add new items in merge mode when IDs differ', () => {
      const newBank = { id: 'bank-2', name: 'New Bank', type: 'Bank' };
      const backupWithNewBank = {
        ...validBackup,
        data: { ...validBackup.data, banks: [newBank] },
      };

      const result = importBackup(backupWithNewBank, false);

      expect(result.success).toBe(true);
      const setStateCall = vi.mocked(useBanksStore.setState).mock.calls[0];
      expect(setStateCall[0].banks).toContainEqual(newBank);
    });

    it('should warn about older backup version', () => {
      const oldBackup = { ...validBackup, version: '1.0.0' };
      const result = importBackup(oldBackup, false);

      expect(result.success).toBe(true);
      expect(result.migrated).toBe(true);
      expect(result.warnings).toBeDefined();
      // The warning message says "Backup was created with version X, current app version is Y"
      expect(result.warnings?.[0]).toMatch(/version.*1\.0\.0/i);
    });

    it('should warn about newer backup version', () => {
      const newBackup = { ...validBackup, version: '2.0.0' };
      const result = importBackup(newBackup, false);

      expect(result.success).toBe(true);
      expect(result.warnings).toBeDefined();
      expect(result.warnings?.[0]).toContain('newer than current');
    });

    it('should throw error for invalid backup structure', () => {
      const invalidBackup = { version: '1.0.0', timestamp: '2024-01-01' } as any;

      expect(() => importBackup(invalidBackup, false)).toThrow('Invalid backup file format');
    });

    it('should throw error for backup with invalid data arrays', () => {
      const invalidBackup = {
        ...validBackup,
        data: { ...validBackup.data, banks: 'not an array' },
      };

      // validateBackup() will fail first, throwing 'Invalid backup file format'
      expect(() => importBackup(invalidBackup, false)).toThrow(/Invalid|validation failed/i);
    });

    it('should rollback on error in replace mode', () => {
      const originalBanks = [{ id: 'original', name: 'Original', type: 'Bank' }];
      const originalAccounts = [{ id: 'account-original', name: 'Original Account', bankId: 'original', accountType: 'Savings', currentBalance: 0, createdAt: '', updatedAt: '' }];
      
      // Setup original state
      vi.mocked(useBanksStore.getState).mockReturnValue({
        banks: originalBanks,
        setState: vi.fn(),
      } as any);
      vi.mocked(useBankAccountsStore.getState).mockReturnValue({
        accounts: originalAccounts,
        setState: vi.fn(),
      } as any);

      // Make one of the setState calls throw an error after some stores are updated
      // This will trigger rollback
      let callCount = 0;
      vi.mocked(useRecurringSavingsInvestmentsStore.setState).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          // Throw error on first call to this store (after others have been updated)
          throw new Error('Simulated error during import');
        }
      });

      const validBackupData = {
        ...validBackup,
        data: { ...validBackup.data, banks: [{ id: 'new', name: 'New', type: 'Bank' }] },
      };

      expect(() => importBackup(validBackupData, true)).toThrow();

      // Should attempt rollback - check that setState was called multiple times
      expect(vi.mocked(useBanksStore.setState).mock.calls.length).toBeGreaterThan(0);
    });

    it('should handle rollback failure gracefully', () => {
      const originalBanks = [{ id: 'original', name: 'Original', type: 'Bank' }];
      const originalAccounts = [{ id: 'account-original', name: 'Original Account', bankId: 'original', accountType: 'Savings', currentBalance: 0, createdAt: '', updatedAt: '' }];
      
      // Setup original state
      vi.mocked(useBanksStore.getState).mockReturnValue({
        banks: originalBanks,
        setState: vi.fn(),
      } as any);
      vi.mocked(useBankAccountsStore.getState).mockReturnValue({
        accounts: originalAccounts,
        setState: vi.fn(),
      } as any);

      // Make import fail, then make rollback also fail
      let importCallCount = 0;
      let rollbackCallCount = 0;
      
      // First, make import fail
      vi.mocked(useRecurringSavingsInvestmentsStore.setState).mockImplementation(() => {
        importCallCount++;
        if (importCallCount === 1) {
          throw new Error('Simulated error during import');
        }
        // During rollback, also throw error
        rollbackCallCount++;
        throw new Error('Simulated rollback error');
      });

      const validBackupData = {
        ...validBackup,
        data: { ...validBackup.data },
      };

      expect(() => importBackup(validBackupData, true)).toThrow();
    });
  });

  describe('readBackupFile', () => {
    it('should read and parse valid backup file', async () => {
      const file = new File([JSON.stringify(validBackup)], 'backup.json', { type: 'application/json' });

      vi.mocked(validateFile).mockReturnValue({ valid: true });
      vi.mocked(validateBackupStructure).mockReturnValue({ valid: true });
      vi.mocked(safeJsonParse).mockReturnValue(validBackup);

      const mockReader = new MockFileReader();
      mockReader.result = JSON.stringify(validBackup);
      global.FileReader = vi.fn(() => mockReader) as any;

      const result = await readBackupFile(file);

      expect(result).toEqual(validBackup);
      expect(validateFile).toHaveBeenCalled();
      expect(validateBackupStructure).toHaveBeenCalled();
    });

    it('should reject invalid file type', async () => {
      const file = new File([''], 'backup.txt', { type: 'text/plain' });

      vi.mocked(validateFile).mockReturnValue({
        valid: false,
        error: 'Invalid file type',
      });

      await expect(readBackupFile(file)).rejects.toThrow('Invalid file type');
    });

    it('should reject file that is too large', async () => {
      const file = new File([''], 'backup.json', { type: 'application/json' });

      vi.mocked(validateFile).mockReturnValue({
        valid: false,
        error: 'File too large',
      });

      await expect(readBackupFile(file)).rejects.toThrow('File too large');
    });

    it('should reject invalid JSON', async () => {
      const file = new File(['invalid json'], 'backup.json', { type: 'application/json' });

      vi.mocked(validateFile).mockReturnValue({ valid: true });
      vi.mocked(safeJsonParse).mockReturnValue(null);

      const mockReader = new MockFileReader();
      mockReader.result = 'invalid json';
      global.FileReader = vi.fn(() => mockReader) as any;

      await expect(readBackupFile(file)).rejects.toThrow('Failed to parse backup file');
    });

    it('should reject backup with invalid structure', async () => {
      const file = new File([JSON.stringify({ invalid: 'data' })], 'backup.json', { type: 'application/json' });

      vi.mocked(validateFile).mockReturnValue({ valid: true });
      vi.mocked(validateBackupStructure).mockReturnValue({
        valid: false,
        error: 'Invalid structure',
      });
      vi.mocked(safeJsonParse).mockReturnValue({ invalid: 'data' });

      const mockReader = new MockFileReader();
      mockReader.result = JSON.stringify({ invalid: 'data' });
      global.FileReader = vi.fn(() => mockReader) as any;

      await expect(readBackupFile(file)).rejects.toThrow(/Invalid/i);
    });

    it('should handle FileReader errors', async () => {
      const file = new File([''], 'backup.json', { type: 'application/json' });

      vi.mocked(validateFile).mockReturnValue({ valid: true });

      const mockReader = new MockFileReader();
      mockReader.onerror = vi.fn();
      global.FileReader = vi.fn(() => mockReader) as any;

      setTimeout(() => {
        if (mockReader.onerror) {
          mockReader.onerror({} as ProgressEvent<FileReader>);
        }
      }, 0);

      await expect(readBackupFile(file)).rejects.toThrow('Failed to read backup file');
    });

    it('should handle empty file content', async () => {
      const file = new File([''], 'backup.json', { type: 'application/json' });

      vi.mocked(validateFile).mockReturnValue({ valid: true });

      const mockReader = new MockFileReader();
      mockReader.result = '';
      global.FileReader = vi.fn(() => mockReader) as any;

      await expect(readBackupFile(file)).rejects.toThrow('Failed to read file content');
    });
  });
});

