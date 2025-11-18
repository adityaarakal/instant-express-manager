/**
 * Tests for transactionExport utility functions
 * Tests CSV, Excel, and PDF export functionality for all transaction types
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import type {
  IncomeTransaction,
  ExpenseTransaction,
  SavingsInvestmentTransaction,
  TransferTransaction,
} from '../../types/transactions';
import type { BankAccount } from '../../types/bankAccounts';
import * as XLSX from 'xlsx';
import {
  exportIncomeTransactionsToCSV,
  exportExpenseTransactionsToCSV,
  exportSavingsTransactionsToCSV,
  exportTransferTransactionsToCSV,
  exportIncomeTransactionsToExcel,
  exportExpenseTransactionsToExcel,
  exportSavingsTransactionsToExcel,
  exportTransferTransactionsToExcel,
  exportIncomeTransactionsToPDF,
  exportExpenseTransactionsToPDF,
  exportSavingsTransactionsToPDF,
  exportTransferTransactionsToPDF,
  downloadCSV,
  downloadExcel,
} from '../transactionExport';

describe('transactionExport', () => {
  const mockAccounts: BankAccount[] = [
    {
      id: 'account-1',
      name: 'Test Account 1',
      bankId: 'bank-1',
      accountType: 'Savings',
      currentBalance: 1000,
      accountNumber: '123456',
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
    },
    {
      id: 'account-2',
      name: 'Test Account 2',
      bankId: 'bank-1',
      accountType: 'Current',
      currentBalance: 2000,
      accountNumber: '789012',
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
    },
  ];

  const mockIncomeTransactions: IncomeTransaction[] = [
    {
      id: 'income-1',
      date: '2025-01-15',
      amount: 5000,
      accountId: 'account-1',
      category: 'Salary',
      description: 'Monthly Salary',
      status: 'Received',
      createdAt: '2025-01-15T00:00:00Z',
      updatedAt: '2025-01-15T00:00:00Z',
    },
    {
      id: 'income-2',
      date: '2025-01-20',
      amount: 2000,
      accountId: 'account-2',
      category: 'Freelancing',
      description: 'Project Payment',
      status: 'Pending',
      clientName: 'Client A',
      projectName: 'Project X',
      notes: 'Payment received',
      createdAt: '2025-01-20T00:00:00Z',
      updatedAt: '2025-01-20T00:00:00Z',
    },
  ];

  const mockExpenseTransactions: ExpenseTransaction[] = [
    {
      id: 'expense-1',
      date: '2025-01-16',
      amount: 500,
      accountId: 'account-1',
      category: 'Utilities',
      bucket: 'Expense',
      description: 'Electricity Bill',
      status: 'Paid',
      createdAt: '2025-01-16T00:00:00Z',
      updatedAt: '2025-01-16T00:00:00Z',
    },
    {
      id: 'expense-2',
      date: '2025-01-18',
      amount: 1000,
      accountId: 'account-2',
      category: 'Utilities',
      bucket: 'Expense',
      description: 'Internet Bill',
      status: 'Pending',
      dueDate: '2025-01-25',
      notes: 'Auto-debit',
      createdAt: '2025-01-18T00:00:00Z',
      updatedAt: '2025-01-18T00:00:00Z',
    },
  ];

  const mockSavingsTransactions: SavingsInvestmentTransaction[] = [
    {
      id: 'savings-1',
      date: '2025-01-17',
      amount: 1000,
      accountId: 'account-1',
      type: 'SIP',
      destination: 'Mutual Fund',
      description: 'Monthly SIP',
      status: 'Completed',
      createdAt: '2025-01-17T00:00:00Z',
      updatedAt: '2025-01-17T00:00:00Z',
    },
    {
      id: 'savings-2',
      date: '2025-01-19',
      amount: 5000,
      accountId: 'account-2',
      type: 'LumpSum',
      destination: 'FD',
      description: 'Fixed Deposit',
      status: 'Pending',
      sipNumber: 'SIP123',
      notes: 'Auto-renewal',
      createdAt: '2025-01-19T00:00:00Z',
      updatedAt: '2025-01-19T00:00:00Z',
    },
  ];

  const mockTransferTransactions: TransferTransaction[] = [
    {
      id: 'transfer-1',
      date: '2025-01-21',
      amount: 500,
      fromAccountId: 'account-1',
      toAccountId: 'account-2',
      category: 'FundRebalancing',
      description: 'Transfer to Current',
      status: 'Completed',
      createdAt: '2025-01-21T00:00:00Z',
      updatedAt: '2025-01-21T00:00:00Z',
    },
  ];

  beforeEach(() => {
    // Mock URL.createObjectURL and URL.revokeObjectURL
    global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
    global.URL.revokeObjectURL = vi.fn();
    
    // Mock document.createElement and appendChild
    const mockLink = {
      href: '',
      download: '',
      click: vi.fn(),
      setAttribute: vi.fn(),
      style: { visibility: '' } as CSSStyleDeclaration,
    };
    vi.spyOn(document, 'createElement').mockReturnValue(mockLink as unknown as HTMLElement);
    vi.spyOn(document.body, 'appendChild').mockReturnValue(mockLink as unknown as Node);
    vi.spyOn(document.body, 'removeChild').mockReturnValue(mockLink as unknown as Node);
  });

  describe('CSV Export', () => {
    it('should export income transactions to CSV', () => {
      const csv = exportIncomeTransactionsToCSV(mockIncomeTransactions, mockAccounts);
      
      expect(csv).toContain('Date,Account,Category,Description,Amount,Status,Client Name,Project Name,Notes');
      expect(csv).toContain('2025-01-15,Test Account 1,Salary,Monthly Salary,5000,Received,,,');
      expect(csv).toContain('2025-01-20,Test Account 2,Freelancing,Project Payment,2000,Pending,Client A,Project X,Payment received');
    });

    it('should export expense transactions to CSV', () => {
      const csv = exportExpenseTransactionsToCSV(mockExpenseTransactions, mockAccounts);
      
      expect(csv).toContain('Date,Account,Category,Bucket,Description,Amount,Status,Due Date,Notes');
      expect(csv).toContain('2025-01-16,Test Account 1,Utilities,Expense,Electricity Bill,500,Paid,,');
      expect(csv).toContain('2025-01-18,Test Account 2,Utilities,Expense,Internet Bill,1000,Pending,2025-01-25,Auto-debit');
    });

    it('should export savings transactions to CSV', () => {
      const csv = exportSavingsTransactionsToCSV(mockSavingsTransactions, mockAccounts);
      
      expect(csv).toContain('Date,Account,Type,Destination,Description,Amount,Status,SIP Number,Notes');
      expect(csv).toContain('2025-01-17,Test Account 1,SIP,Mutual Fund,Monthly SIP,1000,Completed,,');
      expect(csv).toContain('2025-01-19,Test Account 2,LumpSum,FD,Fixed Deposit,5000,Pending,SIP123,Auto-renewal');
    });

    it('should export transfer transactions to CSV', () => {
      const csv = exportTransferTransactionsToCSV(mockTransferTransactions, mockAccounts);
      
      expect(csv).toContain('Date,From Account,To Account');
      expect(csv).toContain('Category');
      expect(csv).toContain('Amount');
      expect(csv).toContain('Status');
      expect(csv).toContain('2025-01-21');
      expect(csv).toContain('Test Account 1');
      expect(csv).toContain('Test Account 2');
      expect(csv).toContain('FundRebalancing');
      expect(csv).toContain('500');
      expect(csv).toContain('Completed');
    });

    it('should escape CSV values with commas and quotes', () => {
      const transactions: IncomeTransaction[] = [
        {
          id: 'income-1',
          date: '2025-01-15',
          amount: 5000,
          accountId: 'account-1',
          category: 'Salary',
          description: 'Salary, Bonus',
          status: 'Received',
          notes: 'Note with "quotes"',
          createdAt: '2025-01-15T00:00:00Z',
          updatedAt: '2025-01-15T00:00:00Z',
        },
      ];
      
      const csv = exportIncomeTransactionsToCSV(transactions, mockAccounts);
      expect(csv).toContain('"Salary, Bonus"');
      expect(csv).toContain('"Note with ""quotes"""');
    });

    it('should handle empty transactions array', () => {
      const csv = exportIncomeTransactionsToCSV([], mockAccounts);
      expect(csv).toContain('Date,Account,Category,Description,Amount,Status,Client Name,Project Name,Notes');
      expect(csv.split('\n').length).toBe(1); // Header only (no rows for empty array)
    });
  });

  describe('Excel Export', () => {
    it('should export income transactions to Excel', () => {
      const excelData = exportIncomeTransactionsToExcel(mockIncomeTransactions, mockAccounts);
      
      expect(excelData).toBeDefined();
      expect(excelData.headers).toBeDefined();
      expect(excelData.rows).toBeDefined();
      expect(excelData.headers).toContain('Date');
      expect(excelData.headers).toContain('Account');
      expect(excelData.headers).toContain('Category');
      expect(excelData.rows).toHaveLength(2);
      expect(excelData.rows[0]).toContain('2025-01-15');
      expect(excelData.rows[0]).toContain('Test Account 1');
      expect(excelData.rows[0]).toContain(5000);
    });

    it('should export expense transactions to Excel', () => {
      const excelData = exportExpenseTransactionsToExcel(mockExpenseTransactions, mockAccounts);
      
      expect(excelData).toBeDefined();
      expect(excelData.headers).toBeDefined();
      expect(excelData.rows).toBeDefined();
      expect(excelData.headers).toContain('Date');
      expect(excelData.headers).toContain('Bucket');
      expect(excelData.rows).toHaveLength(2);
    });

    it('should export savings transactions to Excel', () => {
      const excelData = exportSavingsTransactionsToExcel(mockSavingsTransactions, mockAccounts);
      
      expect(excelData).toBeDefined();
      expect(excelData.headers).toBeDefined();
      expect(excelData.rows).toBeDefined();
      expect(excelData.headers).toContain('Type');
      expect(excelData.headers).toContain('Destination');
      expect(excelData.rows).toHaveLength(2);
    });

    it('should export transfer transactions to Excel', () => {
      const excelData = exportTransferTransactionsToExcel(mockTransferTransactions, mockAccounts);
      
      expect(excelData).toBeDefined();
      expect(excelData.headers).toBeDefined();
      expect(excelData.rows).toBeDefined();
      expect(excelData.headers).toContain('From Account');
      expect(excelData.headers).toContain('To Account');
      expect(excelData.rows).toHaveLength(1);
    });

    it('should handle empty transactions array for Excel', () => {
      const excelData = exportIncomeTransactionsToExcel([], mockAccounts);
      expect(excelData).toBeDefined();
      expect(excelData.headers).toBeDefined();
      expect(excelData.rows).toHaveLength(0);
    });
  });

  describe('PDF Export', () => {
    it('should export income transactions to PDF', () => {
      // PDF export creates a file, so we just verify it doesn't throw
      expect(() => {
        exportIncomeTransactionsToPDF(mockIncomeTransactions, mockAccounts);
      }).not.toThrow();
    });

    it('should export expense transactions to PDF', () => {
      expect(() => {
        exportExpenseTransactionsToPDF(mockExpenseTransactions, mockAccounts);
      }).not.toThrow();
    });

    it('should export savings transactions to PDF', () => {
      expect(() => {
        exportSavingsTransactionsToPDF(mockSavingsTransactions, mockAccounts);
      }).not.toThrow();
    });

    it('should export transfer transactions to PDF', () => {
      expect(() => {
        exportTransferTransactionsToPDF(mockTransferTransactions, mockAccounts);
      }).not.toThrow();
    });

    it('should handle empty transactions array for PDF', () => {
      expect(() => {
        exportIncomeTransactionsToPDF([], mockAccounts);
      }).not.toThrow();
    });
  });

  describe('Download Helpers', () => {
    it('should download CSV', () => {
      const csvContent = 'Date,Amount\n2025-01-15,5000';
      const createElementSpy = vi.spyOn(document, 'createElement');
      const createObjectURLSpy = vi.spyOn(global.URL, 'createObjectURL');
      
      downloadCSV(csvContent, 'test.csv');
      
      expect(createElementSpy).toHaveBeenCalledWith('a');
      expect(createObjectURLSpy).toHaveBeenCalled();
    });

    it('should download Excel', () => {
      // downloadExcel expects { headers, rows } format
      const excelData = exportIncomeTransactionsToExcel(mockIncomeTransactions, mockAccounts);
      
      // Mock XLSX.writeFile to avoid file system operations
      const writeFileSpy = vi.spyOn(XLSX, 'writeFile').mockImplementation(() => {});
      
      downloadExcel(excelData, 'test.xlsx');
      
      // Verify download was attempted (XLSX.writeFile was called)
      expect(writeFileSpy).toHaveBeenCalled();
      expect(excelData).toBeDefined();
      expect(excelData.headers).toBeDefined();
      expect(excelData.rows).toBeDefined();
      
      writeFileSpy.mockRestore();
    });
  });
});

