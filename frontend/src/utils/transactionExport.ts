/**
 * Export transactions to CSV and Excel
 */

import * as XLSX from 'xlsx';
import type {
  IncomeTransaction,
  ExpenseTransaction,
  SavingsInvestmentTransaction,
  TransferTransaction,
} from '../types/transactions';
import type { BankAccount } from '../types/bankAccounts';

export type ExportFormat = 'csv' | 'xlsx';

const escapeCSV = (value: string | number | null | undefined): string => {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

export const exportIncomeTransactionsToCSV = (
  transactions: IncomeTransaction[],
  accounts: BankAccount[],
): string => {
  const accountsMap = new Map<string, string>();
  accounts.forEach((acc) => accountsMap.set(acc.id, acc.name));

  const headers = [
    'Date',
    'Account',
    'Category',
    'Description',
    'Amount',
    'Status',
    'Client Name',
    'Project Name',
    'Notes',
  ];

  const rows = transactions.map((t) => [
    t.date,
    accountsMap.get(t.accountId) || t.accountId,
    t.category,
    t.description,
    t.amount,
    t.status,
    t.clientName || '',
    t.projectName || '',
    t.notes || '',
  ]);

  return [headers.map(escapeCSV).join(','), ...rows.map((row) => row.map(escapeCSV).join(','))].join('\n');
};

export const exportExpenseTransactionsToCSV = (
  transactions: ExpenseTransaction[],
  accounts: BankAccount[],
): string => {
  const accountsMap = new Map<string, string>();
  accounts.forEach((acc) => accountsMap.set(acc.id, acc.name));

  const headers = [
    'Date',
    'Account',
    'Category',
    'Bucket',
    'Description',
    'Amount',
    'Status',
    'Due Date',
    'Notes',
  ];

  const rows = transactions.map((t) => [
    t.date,
    accountsMap.get(t.accountId) || t.accountId,
    t.category,
    t.bucket,
    t.description,
    t.amount,
    t.status,
    t.dueDate || '',
    t.notes || '',
  ]);

  return [headers.map(escapeCSV).join(','), ...rows.map((row) => row.map(escapeCSV).join(','))].join('\n');
};

export const exportSavingsTransactionsToCSV = (
  transactions: SavingsInvestmentTransaction[],
  accounts: BankAccount[],
): string => {
  const accountsMap = new Map<string, string>();
  accounts.forEach((acc) => accountsMap.set(acc.id, acc.name));

  const headers = [
    'Date',
    'Account',
    'Type',
    'Destination',
    'Description',
    'Amount',
    'Status',
    'SIP Number',
    'Notes',
  ];

  const rows = transactions.map((t) => [
    t.date,
    accountsMap.get(t.accountId) || t.accountId,
    t.type,
    t.destination,
    t.description || '',
    t.amount,
    t.status,
    t.sipNumber || '',
    t.notes || '',
  ]);

  return [headers.map(escapeCSV).join(','), ...rows.map((row) => row.map(escapeCSV).join(','))].join('\n');
};

export const exportTransferTransactionsToCSV = (
  transfers: TransferTransaction[],
  accounts: BankAccount[],
): string => {
  const accountsMap = new Map<string, string>();
  accounts.forEach((acc) => accountsMap.set(acc.id, acc.name));

  const headers = [
    'Date',
    'From Account',
    'To Account',
    'Amount',
    'Category',
    'Description',
    'Status',
    'Notes',
  ];

  const rows = transfers.map((t) => [
    t.date,
    accountsMap.get(t.fromAccountId) || t.fromAccountId,
    accountsMap.get(t.toAccountId) || t.toAccountId,
    t.amount,
    t.category,
    t.description,
    t.status,
    t.notes || '',
  ]);

  return [headers.map(escapeCSV).join(','), ...rows.map((row) => row.map(escapeCSV).join(','))].join('\n');
};

export const downloadCSV = (csvContent: string, filename: string) => {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Convert transaction data to Excel worksheet format
 */
const convertToWorksheet = (headers: string[], rows: (string | number)[][]): XLSX.WorkSheet => {
  const data = [headers, ...rows];
  return XLSX.utils.aoa_to_sheet(data);
};

/**
 * Download data as Excel file
 */
export const downloadExcel = (data: { headers: string[]; rows: (string | number)[][] }, filename: string) => {
  const worksheet = convertToWorksheet(data.headers, data.rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Transactions');
  
  // Set column widths for better readability
  const maxWidths = data.headers.map((_, colIndex) => {
    const maxLength = Math.max(
      data.headers[colIndex].length,
      ...data.rows.map(row => String(row[colIndex] || '').length)
    );
    return { wch: Math.min(maxLength + 2, 50) }; // Max width of 50 characters
  });
  worksheet['!cols'] = maxWidths;
  
  XLSX.writeFile(workbook, filename);
};

/**
 * Export income transactions to Excel format
 */
export const exportIncomeTransactionsToExcel = (
  transactions: IncomeTransaction[],
  accounts: BankAccount[],
): { headers: string[]; rows: (string | number)[][] } => {
  const accountsMap = new Map<string, string>();
  accounts.forEach((acc) => accountsMap.set(acc.id, acc.name));

  const headers = [
    'Date',
    'Account',
    'Category',
    'Description',
    'Amount',
    'Status',
    'Client Name',
    'Project Name',
    'Notes',
  ];

  const rows = transactions.map((t) => [
    t.date,
    accountsMap.get(t.accountId) || t.accountId,
    t.category,
    t.description,
    t.amount,
    t.status,
    t.clientName || '',
    t.projectName || '',
    t.notes || '',
  ]);

  return { headers, rows };
};

/**
 * Export expense transactions to Excel format
 */
export const exportExpenseTransactionsToExcel = (
  transactions: ExpenseTransaction[],
  accounts: BankAccount[],
): { headers: string[]; rows: (string | number)[][] } => {
  const accountsMap = new Map<string, string>();
  accounts.forEach((acc) => accountsMap.set(acc.id, acc.name));

  const headers = [
    'Date',
    'Account',
    'Category',
    'Bucket',
    'Description',
    'Amount',
    'Status',
    'Due Date',
    'Notes',
  ];

  const rows = transactions.map((t) => [
    t.date,
    accountsMap.get(t.accountId) || t.accountId,
    t.category,
    t.bucket,
    t.description,
    t.amount,
    t.status,
    t.dueDate || '',
    t.notes || '',
  ]);

  return { headers, rows };
};

/**
 * Export savings/investment transactions to Excel format
 */
export const exportSavingsTransactionsToExcel = (
  transactions: SavingsInvestmentTransaction[],
  accounts: BankAccount[],
): { headers: string[]; rows: (string | number)[][] } => {
  const accountsMap = new Map<string, string>();
  accounts.forEach((acc) => accountsMap.set(acc.id, acc.name));

  const headers = [
    'Date',
    'Account',
    'Type',
    'Destination',
    'Description',
    'Amount',
    'Status',
    'SIP Number',
    'Notes',
  ];

  const rows = transactions.map((t) => [
    t.date,
    accountsMap.get(t.accountId) || t.accountId,
    t.type,
    t.destination,
    t.description || '',
    t.amount,
    t.status,
    t.sipNumber || '',
    t.notes || '',
  ]);

  return { headers, rows };
};

/**
 * Export transfer transactions to Excel format
 */
export const exportTransferTransactionsToExcel = (
  transfers: TransferTransaction[],
  accounts: BankAccount[],
): { headers: string[]; rows: (string | number)[][] } => {
  const accountsMap = new Map<string, string>();
  accounts.forEach((acc) => accountsMap.set(acc.id, acc.name));

  const headers = [
    'Date',
    'From Account',
    'To Account',
    'Amount',
    'Category',
    'Description',
    'Status',
    'Notes',
  ];

  const rows = transfers.map((t) => [
    t.date,
    accountsMap.get(t.fromAccountId) || t.fromAccountId,
    accountsMap.get(t.toAccountId) || t.toAccountId,
    t.amount,
    t.category,
    t.description,
    t.status,
    t.notes || '',
  ]);

  return { headers, rows };
};

