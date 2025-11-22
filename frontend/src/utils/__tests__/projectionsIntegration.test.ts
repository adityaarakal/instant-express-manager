/**
 * Tests for projections integration utilities
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  importProjectionsFromCSV,
  importProjectionsFromExcel,
  autoPopulateInflowFromProjections,
  getSavingsProgress,
  type ProjectionsImportRow,
} from '../projectionsIntegration';
import { useProjectionsStore } from '../../store/useProjectionsStore';
import { useIncomeTransactionsStore } from '../../store/useIncomeTransactionsStore';
import { useSavingsInvestmentTransactionsStore } from '../../store/useSavingsInvestmentTransactionsStore';
import { useBankAccountsStore } from '../../store/useBankAccountsStore';
import { useToastStore } from '../../store/useToastStore';
import { validateProjectionsImport, cleanProjectionsImport } from '../projectionsImportValidation';

// Mock dependencies
vi.mock('../../store/useProjectionsStore');
vi.mock('../../store/useIncomeTransactionsStore');
vi.mock('../../store/useSavingsInvestmentTransactionsStore');
vi.mock('../../store/useBankAccountsStore');
vi.mock('../../store/useToastStore');
vi.mock('../projectionsImportValidation');
vi.mock('xlsx', () => ({
  read: vi.fn(),
  utils: {
    sheet_to_json: vi.fn(),
  },
}));

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

  readAsBinaryString(file: File) {
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

// Mock global FileReader
global.FileReader = MockFileReader as any;

describe('projectionsIntegration', () => {
  const mockShowSuccess = vi.fn();
  const mockShowWarning = vi.fn();
  const mockShowError = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default toast store mock
    vi.mocked(useToastStore.getState).mockReturnValue({
      showSuccess: mockShowSuccess,
      showWarning: mockShowWarning,
      showError: mockShowError,
    } as any);

    // Setup default validation mocks
    vi.mocked(validateProjectionsImport).mockReturnValue({
      isValid: true,
      errors: [],
      warnings: [],
      duplicateMonths: [],
      invalidRows: [],
      validRows: 0,
    });

    vi.mocked(cleanProjectionsImport).mockImplementation((projections) => ({
      cleaned: projections,
      removed: 0,
    }));
  });

  describe('importProjectionsFromCSV', () => {
    it('should import valid CSV data', async () => {
      const csvContent = 'Month,Inflow Total,Savings Target\n2024-01,100000,20000\n2024-02,110000,25000';
      const file = new File([csvContent], 'test.csv', { type: 'text/csv' });

      const mockReader = new MockFileReader();
      mockReader.result = csvContent;
      global.FileReader = vi.fn(() => mockReader) as any;

      const result = await importProjectionsFromCSV(file);

      expect(result.projections).toHaveLength(2);
      expect(result.projections[0].month).toBe('2024-01');
      expect(result.projections[0].inflowTotal).toBe(100000);
      expect(result.projections[0].savingsTarget).toBe(20000);
      expect(result.projections[1].month).toBe('2024-02');
      expect(result.projections[1].inflowTotal).toBe(110000);
      expect(result.projections[1].savingsTarget).toBe(25000);
      expect(validateProjectionsImport).toHaveBeenCalled();
      expect(cleanProjectionsImport).toHaveBeenCalled();
    });

    it('should handle CSV with quoted values', async () => {
      const csvContent = 'Month,"Inflow Total","Savings Target"\n"2024-01","100000","20000"';
      const file = new File([csvContent], 'test.csv', { type: 'text/csv' });

      const mockReader = new MockFileReader();
      mockReader.result = csvContent;
      global.FileReader = vi.fn(() => mockReader) as any;

      const result = await importProjectionsFromCSV(file);

      expect(result.projections).toHaveLength(1);
      expect(result.projections[0].month).toBe('2024-01');
      expect(result.projections[0].inflowTotal).toBe(100000);
    });

    it('should handle different month formats', async () => {
      const csvContent = 'Month,Inflow Total\n01/2024,100000\n2024/02,110000\nMarch 2024,120000';
      const file = new File([csvContent], 'test.csv', { type: 'text/csv' });

      const mockReader = new MockFileReader();
      mockReader.result = csvContent;
      global.FileReader = vi.fn(() => mockReader) as any;

      const result = await importProjectionsFromCSV(file);

      expect(result.projections.length).toBeGreaterThan(0);
      // All should be normalized to YYYY-MM format
      result.projections.forEach((p) => {
        expect(p.month).toMatch(/^\d{4}-\d{2}$/);
      });
    });

    it('should skip invalid month formats', async () => {
      const csvContent = 'Month,Inflow Total\ninvalid,100000\n2024-01,110000';
      const file = new File([csvContent], 'test.csv', { type: 'text/csv' });

      const mockReader = new MockFileReader();
      mockReader.result = csvContent;
      global.FileReader = vi.fn(() => mockReader) as any;

      const result = await importProjectionsFromCSV(file);

      // Should only have one valid projection
      expect(result.projections).toHaveLength(1);
      expect(result.projections[0].month).toBe('2024-01');
    });

    it('should handle missing optional columns', async () => {
      const csvContent = 'Month,Inflow Total\n2024-01,100000';
      const file = new File([csvContent], 'test.csv', { type: 'text/csv' });

      const mockReader = new MockFileReader();
      mockReader.result = csvContent;
      global.FileReader = vi.fn(() => mockReader) as any;

      const result = await importProjectionsFromCSV(file);

      expect(result.projections).toHaveLength(1);
      expect(result.projections[0].savingsTarget).toBeNull();
    });

    it('should reject CSV with insufficient rows', async () => {
      const csvContent = 'Month,Inflow Total';
      const file = new File([csvContent], 'test.csv', { type: 'text/csv' });

      const mockReader = new MockFileReader();
      mockReader.result = csvContent;
      global.FileReader = vi.fn(() => mockReader) as any;

      await expect(importProjectionsFromCSV(file)).rejects.toThrow('at least a header row and one data row');
    });

    it('should handle FileReader errors', async () => {
      const file = new File([''], 'test.csv', { type: 'text/csv' });

      const mockReader = new MockFileReader();
      mockReader.onerror = vi.fn();
      global.FileReader = vi.fn(() => mockReader) as any;

      // Simulate error
      setTimeout(() => {
        if (mockReader.onerror) {
          mockReader.onerror({} as ProgressEvent<FileReader>);
        }
      }, 0);

      await expect(importProjectionsFromCSV(file)).rejects.toThrow('Failed to read CSV file');
    });
  });

  describe('importProjectionsFromExcel', () => {
    it('should import valid Excel data', async () => {
      const mockWorkbook = {
        SheetNames: ['Sheet1'],
        Sheets: { Sheet1: {} },
      };

      const mockJsonData = [
        ['Month', 'Inflow Total', 'Savings Target'],
        ['2024-01', 100000, 20000],
        ['2024-02', 110000, 25000],
      ];

      const XLSX = await import('xlsx');
      vi.mocked(XLSX.read).mockReturnValue(mockWorkbook as any);
      vi.mocked(XLSX.utils.sheet_to_json).mockReturnValue(mockJsonData as any);

      const file = new File([''], 'test.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

      const mockReader = new MockFileReader();
      mockReader.result = 'binary data';
      global.FileReader = vi.fn(() => mockReader) as any;

      const result = await importProjectionsFromExcel(file);

      expect(result.projections).toHaveLength(2);
      expect(result.projections[0].month).toBe('2024-01');
      expect(result.projections[0].inflowTotal).toBe(100000);
      expect(XLSX.read).toHaveBeenCalled();
      expect(XLSX.utils.sheet_to_json).toHaveBeenCalled();
    });

    it('should handle Excel with different month formats', async () => {
      const mockWorkbook = {
        SheetNames: ['Sheet1'],
        Sheets: { Sheet1: {} },
      };

      const mockJsonData = [
        ['Month', 'Inflow Total'],
        ['01/2024', 100000],
        ['2024/02', 110000],
      ];

      const XLSX = await import('xlsx');
      vi.mocked(XLSX.read).mockReturnValue(mockWorkbook as any);
      vi.mocked(XLSX.utils.sheet_to_json).mockReturnValue(mockJsonData as any);

      const file = new File([''], 'test.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

      const mockReader = new MockFileReader();
      mockReader.result = 'binary data';
      global.FileReader = vi.fn(() => mockReader) as any;

      const result = await importProjectionsFromExcel(file);

      expect(result.projections.length).toBeGreaterThan(0);
      result.projections.forEach((p) => {
        expect(p.month).toMatch(/^\d{4}-\d{2}$/);
      });
    });

    it('should reject Excel with insufficient rows', async () => {
      const mockWorkbook = {
        SheetNames: ['Sheet1'],
        Sheets: { Sheet1: {} },
      };

      const mockJsonData = [['Month', 'Inflow Total']];

      const XLSX = await import('xlsx');
      vi.mocked(XLSX.read).mockReturnValue(mockWorkbook as any);
      vi.mocked(XLSX.utils.sheet_to_json).mockReturnValue(mockJsonData as any);

      const file = new File([''], 'test.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

      const mockReader = new MockFileReader();
      mockReader.result = 'binary data';
      global.FileReader = vi.fn(() => mockReader) as any;

      await expect(importProjectionsFromExcel(file)).rejects.toThrow('at least a header row and one data row');
    });

    it('should handle FileReader errors', async () => {
      const file = new File([''], 'test.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

      const mockReader = new MockFileReader();
      mockReader.onerror = vi.fn();
      global.FileReader = vi.fn(() => mockReader) as any;

      setTimeout(() => {
        if (mockReader.onerror) {
          mockReader.onerror({} as ProgressEvent<FileReader>);
        }
      }, 0);

      await expect(importProjectionsFromExcel(file)).rejects.toThrow('Failed to read Excel file');
    });
  });

  describe('autoPopulateInflowFromProjections', () => {
    it('should create income transaction when projection exists and no transactions', () => {
      const mockCreateTransaction = vi.fn();
      const mockAccounts = [
        {
          id: 'account-1',
          name: 'Account 1',
          bankId: 'bank-1',
          accountType: 'Savings',
          currentBalance: 0,
          createdAt: '',
          updatedAt: '',
        },
      ];

      vi.mocked(useProjectionsStore.getState).mockReturnValue({
        getInflowTotal: vi.fn(() => 100000),
      } as any);

      vi.mocked(useIncomeTransactionsStore.getState).mockReturnValue({
        transactions: [],
        createTransaction: mockCreateTransaction,
        updateTransaction: vi.fn(),
      } as any);

      vi.mocked(useBankAccountsStore.getState).mockReturnValue({
        accounts: mockAccounts,
      } as any);

      autoPopulateInflowFromProjections('2024-01');

      expect(mockCreateTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          accountId: 'account-1',
          amount: 100000,
          description: 'Auto-populated from projection for 2024-01',
          status: 'Pending',
        }),
      );
      expect(mockShowSuccess).toHaveBeenCalled();
    });

    it('should update existing auto-populated transaction', () => {
      const mockUpdateTransaction = vi.fn();
      const mockAccounts = [
        {
          id: 'account-1',
          name: 'Account 1',
          bankId: 'bank-1',
          accountType: 'Savings',
          currentBalance: 0,
          createdAt: '',
          updatedAt: '',
        },
      ];

      const existingTransaction = {
        id: 't1',
        accountId: 'account-1',
        amount: 50000,
        date: '2024-01-01',
        category: 'Other',
        description: 'Auto-populated from projection for 2024-01',
        status: 'Pending' as const,
      };

      vi.mocked(useProjectionsStore.getState).mockReturnValue({
        getInflowTotal: vi.fn(() => 100000),
      } as any);

      vi.mocked(useIncomeTransactionsStore.getState).mockReturnValue({
        transactions: [existingTransaction],
        createTransaction: vi.fn(),
        updateTransaction: mockUpdateTransaction,
      } as any);

      vi.mocked(useBankAccountsStore.getState).mockReturnValue({
        accounts: mockAccounts,
      } as any);

      autoPopulateInflowFromProjections('2024-01');

      expect(mockUpdateTransaction).toHaveBeenCalledWith('t1', {
        amount: 100000, // 50000 + 50000 difference
      });
      expect(mockShowSuccess).toHaveBeenCalledWith(expect.stringContaining('Updated'));
    });

    it('should warn if no projection found', () => {
      vi.mocked(useProjectionsStore.getState).mockReturnValue({
        getInflowTotal: vi.fn(() => null),
      } as any);

      autoPopulateInflowFromProjections('2024-01');

      expect(mockShowWarning).toHaveBeenCalledWith(expect.stringContaining('No projection found'));
    });

    it('should warn if inflow already matches projection', () => {
      const mockAccounts = [
        {
          id: 'account-1',
          name: 'Account 1',
          bankId: 'bank-1',
          accountType: 'Savings',
          currentBalance: 0,
          createdAt: '',
          updatedAt: '',
        },
      ];

      const existingTransaction = {
        id: 't1',
        accountId: 'account-1',
        amount: 100000,
        date: '2024-01-01',
        category: 'Other',
        description: 'Income',
        status: 'Received' as const,
      };

      vi.mocked(useProjectionsStore.getState).mockReturnValue({
        getInflowTotal: vi.fn(() => 100000),
      } as any);

      vi.mocked(useIncomeTransactionsStore.getState).mockReturnValue({
        transactions: [existingTransaction],
        createTransaction: vi.fn(),
        updateTransaction: vi.fn(),
      } as any);

      vi.mocked(useBankAccountsStore.getState).mockReturnValue({
        accounts: mockAccounts,
      } as any);

      autoPopulateInflowFromProjections('2024-01');

      expect(mockShowWarning).toHaveBeenCalledWith(expect.stringContaining('already matches'));
    });

    it('should warn if no suitable accounts found', () => {
      vi.mocked(useProjectionsStore.getState).mockReturnValue({
        getInflowTotal: vi.fn(() => 100000),
      } as any);

      vi.mocked(useIncomeTransactionsStore.getState).mockReturnValue({
        transactions: [],
        createTransaction: vi.fn(),
        updateTransaction: vi.fn(),
      } as any);

      vi.mocked(useBankAccountsStore.getState).mockReturnValue({
        accounts: [
          {
            id: 'cc-1',
            name: 'Credit Card',
            bankId: 'bank-1',
            accountType: 'CreditCard',
            currentBalance: 0,
            createdAt: '',
            updatedAt: '',
          },
        ],
      } as any);

      autoPopulateInflowFromProjections('2024-01');

      expect(mockShowWarning).toHaveBeenCalledWith(expect.stringContaining('No suitable accounts'));
    });

    it('should warn if current inflow exceeds projection', () => {
      const mockAccounts = [
        {
          id: 'account-1',
          name: 'Account 1',
          bankId: 'bank-1',
          accountType: 'Savings',
          currentBalance: 0,
          createdAt: '',
          updatedAt: '',
        },
      ];

      const existingTransaction = {
        id: 't1',
        accountId: 'account-1',
        amount: 150000,
        date: '2024-01-01',
        category: 'Other',
        description: 'Income',
        status: 'Received' as const,
      };

      vi.mocked(useProjectionsStore.getState).mockReturnValue({
        getInflowTotal: vi.fn(() => 100000),
      } as any);

      vi.mocked(useIncomeTransactionsStore.getState).mockReturnValue({
        transactions: [existingTransaction],
        createTransaction: vi.fn(),
        updateTransaction: vi.fn(),
      } as any);

      vi.mocked(useBankAccountsStore.getState).mockReturnValue({
        accounts: mockAccounts,
      } as any);

      autoPopulateInflowFromProjections('2024-01');

      expect(mockShowWarning).toHaveBeenCalledWith(expect.stringContaining('exceeds projection'));
    });
  });

  describe('getSavingsProgress', () => {
    it('should return progress when target exists', () => {
      vi.mocked(useProjectionsStore.getState).mockReturnValue({
        getSavingsTarget: vi.fn(() => 20000),
      } as any);

      vi.mocked(useSavingsInvestmentTransactionsStore.getState).mockReturnValue({
        transactions: [
          {
            id: 't1',
            accountId: 'account-1',
            amount: 10000,
            date: '2024-01-15',
            category: 'Investment',
            description: 'Savings',
            status: 'Completed' as const,
          },
        ],
      } as any);

      const result = getSavingsProgress('2024-01');

      expect(result.target).toBe(20000);
      expect(result.actual).toBe(10000);
      expect(result.progress).toBe(50); // 10000 / 20000 * 100
    });

    it('should return null target when no projection exists', () => {
      vi.mocked(useProjectionsStore.getState).mockReturnValue({
        getSavingsTarget: vi.fn(() => null),
      } as any);

      vi.mocked(useSavingsInvestmentTransactionsStore.getState).mockReturnValue({
        transactions: [],
      } as any);

      const result = getSavingsProgress('2024-01');

      expect(result.target).toBeNull();
      expect(result.actual).toBe(0);
      expect(result.progress).toBe(0);
    });

    it('should only count completed transactions', () => {
      vi.mocked(useProjectionsStore.getState).mockReturnValue({
        getSavingsTarget: vi.fn(() => 20000),
      } as any);

      vi.mocked(useSavingsInvestmentTransactionsStore.getState).mockReturnValue({
        transactions: [
          {
            id: 't1',
            accountId: 'account-1',
            amount: 10000,
            date: '2024-01-15',
            category: 'Investment',
            description: 'Savings',
            status: 'Completed' as const,
          },
          {
            id: 't2',
            accountId: 'account-1',
            amount: 5000,
            date: '2024-01-20',
            category: 'Investment',
            description: 'Savings',
            status: 'Pending' as const, // Should not count
          },
        ],
      } as any);

      const result = getSavingsProgress('2024-01');

      expect(result.actual).toBe(10000); // Only completed transaction
      expect(result.progress).toBe(50);
    });

    it('should cap progress at 100%', () => {
      vi.mocked(useProjectionsStore.getState).mockReturnValue({
        getSavingsTarget: vi.fn(() => 10000),
      } as any);

      vi.mocked(useSavingsInvestmentTransactionsStore.getState).mockReturnValue({
        transactions: [
          {
            id: 't1',
            accountId: 'account-1',
            amount: 15000,
            date: '2024-01-15',
            category: 'Investment',
            description: 'Savings',
            status: 'Completed' as const,
          },
        ],
      } as any);

      const result = getSavingsProgress('2024-01');

      expect(result.progress).toBe(100); // Capped at 100%
    });

    it('should only count transactions in the specified month', () => {
      vi.mocked(useProjectionsStore.getState).mockReturnValue({
        getSavingsTarget: vi.fn(() => 20000),
      } as any);

      vi.mocked(useSavingsInvestmentTransactionsStore.getState).mockReturnValue({
        transactions: [
          {
            id: 't1',
            accountId: 'account-1',
            amount: 10000,
            date: '2024-01-15',
            category: 'Investment',
            description: 'Savings',
            status: 'Completed' as const,
          },
          {
            id: 't2',
            accountId: 'account-1',
            amount: 5000,
            date: '2024-02-15', // Different month
            category: 'Investment',
            description: 'Savings',
            status: 'Completed' as const,
          },
        ],
      } as any);

      const result = getSavingsProgress('2024-01');

      expect(result.actual).toBe(10000); // Only January transaction
    });

    it('should handle zero target', () => {
      vi.mocked(useProjectionsStore.getState).mockReturnValue({
        getSavingsTarget: vi.fn(() => 0),
      } as any);

      vi.mocked(useSavingsInvestmentTransactionsStore.getState).mockReturnValue({
        transactions: [
          {
            id: 't1',
            accountId: 'account-1',
            amount: 10000,
            date: '2024-01-15',
            category: 'Investment',
            description: 'Savings',
            status: 'Completed' as const,
          },
        ],
      } as any);

      const result = getSavingsProgress('2024-01');

      expect(result.target).toBe(0);
      expect(result.progress).toBe(0);
    });
  });
});

