/**
 * Export transactions to CSV
 */

import type {
  IncomeTransaction,
  ExpenseTransaction,
  SavingsInvestmentTransaction,
} from '../types/transactions';
import type { BankAccount } from '../types/bankAccounts';

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
};

