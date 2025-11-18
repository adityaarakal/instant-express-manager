/**
 * Export transactions to CSV, Excel, and PDF
 */

import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type {
  IncomeTransaction,
  ExpenseTransaction,
  SavingsInvestmentTransaction,
  TransferTransaction,
} from '../types/transactions';
import type { BankAccount } from '../types/bankAccounts';

export type ExportFormat = 'csv' | 'xlsx' | 'pdf';

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

/**
 * Helper function to format currency for PDF
 */
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
};

/**
 * Export income transactions to PDF
 */
export const exportIncomeTransactionsToPDF = (
  transactions: IncomeTransaction[],
  accounts: BankAccount[],
  filename?: string,
): void => {
  const accountsMap = new Map<string, string>();
  accounts.forEach((acc) => accountsMap.set(acc.id, acc.name));

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;
  const tableStartY = 30;

  // Title
  doc.setFontSize(18);
  doc.text('Income Transactions Report', margin, 20);

  // Report metadata
  doc.setFontSize(10);
  doc.text(`Generated: ${new Date().toLocaleString()}`, margin, 25);
  doc.text(`Total Transactions: ${transactions.length}`, pageWidth - margin - 50, 25);

  // Prepare table data
  const tableData = transactions.map((t) => [
    t.date,
    accountsMap.get(t.accountId) || t.accountId,
    t.category,
    t.description.substring(0, 30), // Truncate long descriptions
    formatCurrency(t.amount),
    t.status,
    t.clientName || '-',
    t.projectName || '-',
    (t.notes || '').substring(0, 20), // Truncate long notes
  ]);

  // Create table
  autoTable(doc, {
    startY: tableStartY,
    head: [['Date', 'Account', 'Category', 'Description', 'Amount', 'Status', 'Client', 'Project', 'Notes']],
    body: tableData,
    margin: { top: tableStartY, left: margin, right: margin },
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [249, 250, 251] },
    columnStyles: {
      0: { cellWidth: 25 }, // Date
      1: { cellWidth: 30 }, // Account
      2: { cellWidth: 25 }, // Category
      3: { cellWidth: 40 }, // Description
      4: { cellWidth: 30, halign: 'right' }, // Amount
      5: { cellWidth: 20 }, // Status
      6: { cellWidth: 25 }, // Client
      7: { cellWidth: 25 }, // Project
      8: { cellWidth: 25 }, // Notes
    },
  });

  // Add totals
  const totalAmount = transactions.reduce((sum, t) => sum + t.amount, 0);
  const finalY = (doc as { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY || tableStartY;
  doc.setFontSize(10);
  doc.text(`Total Amount: ${formatCurrency(totalAmount)}`, pageWidth - margin - 50, finalY + 10, { align: 'right' });

  // Save PDF
  doc.save(filename || `income-transactions-${new Date().toISOString().split('T')[0]}.pdf`);
};

/**
 * Export expense transactions to PDF
 */
export const exportExpenseTransactionsToPDF = (
  transactions: ExpenseTransaction[],
  accounts: BankAccount[],
  filename?: string,
): void => {
  const accountsMap = new Map<string, string>();
  accounts.forEach((acc) => accountsMap.set(acc.id, acc.name));

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;
  const tableStartY = 30;

  // Title
  doc.setFontSize(18);
  doc.text('Expense Transactions Report', margin, 20);

  // Report metadata
  doc.setFontSize(10);
  doc.text(`Generated: ${new Date().toLocaleString()}`, margin, 25);
  doc.text(`Total Transactions: ${transactions.length}`, pageWidth - margin - 50, 25);

  // Prepare table data
  const tableData = transactions.map((t) => [
    t.date,
    accountsMap.get(t.accountId) || t.accountId,
    t.category,
    t.bucket,
    t.description.substring(0, 30), // Truncate long descriptions
    formatCurrency(t.amount),
    t.status,
    t.dueDate || '-',
    (t.notes || '').substring(0, 20), // Truncate long notes
  ]);

  // Create table
  autoTable(doc, {
    startY: tableStartY,
    head: [['Date', 'Account', 'Category', 'Bucket', 'Description', 'Amount', 'Status', 'Due Date', 'Notes']],
    body: tableData,
    margin: { top: tableStartY, left: margin, right: margin },
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [249, 250, 251] },
    columnStyles: {
      0: { cellWidth: 25 }, // Date
      1: { cellWidth: 30 }, // Account
      2: { cellWidth: 25 }, // Category
      3: { cellWidth: 25 }, // Bucket
      4: { cellWidth: 35 }, // Description
      5: { cellWidth: 30, halign: 'right' }, // Amount
      6: { cellWidth: 20 }, // Status
      7: { cellWidth: 25 }, // Due Date
      8: { cellWidth: 25 }, // Notes
    },
  });

  // Add totals
  const totalAmount = transactions.reduce((sum, t) => sum + t.amount, 0);
  const finalY = (doc as { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY || tableStartY;
  doc.setFontSize(10);
  doc.text(`Total Amount: ${formatCurrency(totalAmount)}`, pageWidth - margin - 50, finalY + 10, { align: 'right' });

  // Save PDF
  doc.save(filename || `expense-transactions-${new Date().toISOString().split('T')[0]}.pdf`);
};

/**
 * Export savings/investment transactions to PDF
 */
export const exportSavingsTransactionsToPDF = (
  transactions: SavingsInvestmentTransaction[],
  accounts: BankAccount[],
  filename?: string,
): void => {
  const accountsMap = new Map<string, string>();
  accounts.forEach((acc) => accountsMap.set(acc.id, acc.name));

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;
  const tableStartY = 30;

  // Title
  doc.setFontSize(18);
  doc.text('Savings & Investment Transactions Report', margin, 20);

  // Report metadata
  doc.setFontSize(10);
  doc.text(`Generated: ${new Date().toLocaleString()}`, margin, 25);
  doc.text(`Total Transactions: ${transactions.length}`, pageWidth - margin - 50, 25);

  // Prepare table data
  const tableData = transactions.map((t) => [
    t.date,
    accountsMap.get(t.accountId) || t.accountId,
    t.type,
    t.destination,
    (t.description || '').substring(0, 30), // Truncate long descriptions
    formatCurrency(t.amount),
    t.status,
    t.sipNumber || '-',
    (t.notes || '').substring(0, 20), // Truncate long notes
  ]);

  // Create table
  autoTable(doc, {
    startY: tableStartY,
    head: [['Date', 'Account', 'Type', 'Destination', 'Description', 'Amount', 'Status', 'SIP Number', 'Notes']],
    body: tableData,
    margin: { top: tableStartY, left: margin, right: margin },
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [249, 250, 251] },
    columnStyles: {
      0: { cellWidth: 25 }, // Date
      1: { cellWidth: 30 }, // Account
      2: { cellWidth: 25 }, // Type
      3: { cellWidth: 30 }, // Destination
      4: { cellWidth: 35 }, // Description
      5: { cellWidth: 30, halign: 'right' }, // Amount
      6: { cellWidth: 20 }, // Status
      7: { cellWidth: 25 }, // SIP Number
      8: { cellWidth: 25 }, // Notes
    },
  });

  // Add totals
  const totalAmount = transactions.reduce((sum, t) => sum + t.amount, 0);
  const finalY = (doc as { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY || tableStartY;
  doc.setFontSize(10);
  doc.text(`Total Amount: ${formatCurrency(totalAmount)}`, pageWidth - margin - 50, finalY + 10, { align: 'right' });

  // Save PDF
  doc.save(filename || `savings-transactions-${new Date().toISOString().split('T')[0]}.pdf`);
};

/**
 * Export transfer transactions to PDF
 */
export const exportTransferTransactionsToPDF = (
  transfers: TransferTransaction[],
  accounts: BankAccount[],
  filename?: string,
): void => {
  const accountsMap = new Map<string, string>();
  accounts.forEach((acc) => accountsMap.set(acc.id, acc.name));

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;
  const tableStartY = 30;

  // Title
  doc.setFontSize(18);
  doc.text('Transfer Transactions Report', margin, 20);

  // Report metadata
  doc.setFontSize(10);
  doc.text(`Generated: ${new Date().toLocaleString()}`, margin, 25);
  doc.text(`Total Transfers: ${transfers.length}`, pageWidth - margin - 50, 25);

  // Prepare table data
  const tableData = transfers.map((t) => [
    t.date,
    accountsMap.get(t.fromAccountId) || t.fromAccountId,
    accountsMap.get(t.toAccountId) || t.toAccountId,
    formatCurrency(t.amount),
    t.category,
    t.description.substring(0, 30), // Truncate long descriptions
    t.status,
    (t.notes || '').substring(0, 20), // Truncate long notes
  ]);

  // Create table
  autoTable(doc, {
    startY: tableStartY,
    head: [['Date', 'From Account', 'To Account', 'Amount', 'Category', 'Description', 'Status', 'Notes']],
    body: tableData,
    margin: { top: tableStartY, left: margin, right: margin },
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [249, 250, 251] },
    columnStyles: {
      0: { cellWidth: 25 }, // Date
      1: { cellWidth: 35 }, // From Account
      2: { cellWidth: 35 }, // To Account
      3: { cellWidth: 30, halign: 'right' }, // Amount
      4: { cellWidth: 25 }, // Category
      5: { cellWidth: 40 }, // Description
      6: { cellWidth: 20 }, // Status
      7: { cellWidth: 25 }, // Notes
    },
  });

  // Add totals
  const totalAmount = transfers.reduce((sum, t) => sum + t.amount, 0);
  const finalY = (doc as { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY || tableStartY;
  doc.setFontSize(10);
  doc.text(`Total Amount: ${formatCurrency(totalAmount)}`, pageWidth - margin - 50, finalY + 10, { align: 'right' });

  // Save PDF
  doc.save(filename || `transfers-${new Date().toISOString().split('T')[0]}.pdf`);
};
