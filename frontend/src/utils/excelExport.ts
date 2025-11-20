/**
 * Excel Export Utilities
 * 
 * Provides utilities for exporting various data types to Excel format.
 * Uses the xlsx library for Excel file generation.
 * 
 * @module excelExport
 */

import * as XLSX from 'xlsx';
import type {
  IncomeTransaction,
  ExpenseTransaction,
  SavingsInvestmentTransaction,
} from '../types/transactions';
import type { AggregatedMonth } from '../types/plannedExpensesAggregated';

/**
 * Downloads data as Excel file with multiple sheets support.
 * 
 * @param {Array<{name: string; headers: string[]; rows: (string | number)[][]}>} sheets - Array of sheet data
 * @param {string} filename - Filename for the Excel file (without extension)
 * @returns {void}
 * 
 * @example
 * downloadExcelFile([
 *   {
 *     name: 'Summary',
 *     headers: ['Month', 'Total Income', 'Total Expenses'],
 *     rows: [['2025-01', 50000, 30000]]
 *   },
 *   {
 *     name: 'Details',
 *     headers: ['Date', 'Amount'],
 *     rows: [['2025-01-15', 5000]]
 *   }
 * ], 'monthly-report');
 */
export function downloadExcelFile(
  sheets: Array<{ name: string; headers: string[]; rows: (string | number)[][] }>,
  filename: string,
): void {
  const workbook = XLSX.utils.book_new();

  sheets.forEach((sheet) => {
    const data = [sheet.headers, ...sheet.rows];
    const worksheet = XLSX.utils.aoa_to_sheet(data);

    // Set column widths for better readability
    const maxWidths = sheet.headers.map((_, colIndex) => {
      const maxLength = Math.max(
        sheet.headers[colIndex].length,
        ...sheet.rows.map((row) => String(row[colIndex] || '').length),
      );
      return { wch: Math.min(maxLength + 2, 50) }; // Max width of 50 characters
    });
    worksheet['!cols'] = maxWidths;

    XLSX.utils.book_append_sheet(workbook, worksheet, sheet.name);
  });

  const excelFilename = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`;
  XLSX.writeFile(workbook, excelFilename);
}

/**
 * Exports analytics data to Excel format.
 * Creates multiple sheets: Summary, Income, Expenses, Savings.
 * 
 * @param {Object} data - Analytics data to export
 * @param {Object} data.summary - Summary statistics
 * @param {IncomeTransaction[]} data.income - Income transactions
 * @param {ExpenseTransaction[]} data.expenses - Expense transactions
 * @param {SavingsInvestmentTransaction[]} data.savings - Savings transactions
 * @param {string} data.dateRange - Date range string (e.g., "2025-01-01 to 2025-01-31")
 * @param {string} [filename] - Optional filename (defaults to "analytics-{dateRange}")
 * @returns {void}
 * 
 * @example
 * exportAnalyticsToExcel({
 *   summary: { income: { count: 10, total: 50000 }, ... },
 *   income: [...],
 *   expenses: [...],
 *   savings: [...],
 *   dateRange: '2025-01-01 to 2025-01-31'
 * });
 */
export function exportAnalyticsToExcel(data: {
  summary: {
    income: { count: number; total: number };
    expenses: { count: number; total: number };
    savings: { count: number; total: number };
  };
  income: IncomeTransaction[];
  expenses: ExpenseTransaction[];
  savings: SavingsInvestmentTransaction[];
  dateRange: string;
  filename?: string;
}): void {
  const sheets: Array<{ name: string; headers: string[]; rows: (string | number)[][] }> = [];

  // Summary sheet
  sheets.push({
    name: 'Summary',
    headers: ['Category', 'Count', 'Total Amount'],
    rows: [
      ['Income', data.summary.income.count, data.summary.income.total],
      ['Expenses', data.summary.expenses.count, data.summary.expenses.total],
      ['Savings', data.summary.savings.count, data.summary.savings.total],
      ['Net', data.summary.income.count + data.summary.expenses.count + data.summary.savings.count, data.summary.income.total - data.summary.expenses.total - data.summary.savings.total],
    ],
  });

  // Income transactions sheet
  if (data.income.length > 0) {
    sheets.push({
      name: 'Income',
      headers: ['Date', 'Account', 'Category', 'Description', 'Amount', 'Status'],
      rows: data.income.map((t) => [t.date, t.accountId, t.category, t.description, t.amount, t.status]),
    });
  }

  // Expense transactions sheet
  if (data.expenses.length > 0) {
    sheets.push({
      name: 'Expenses',
      headers: ['Date', 'Account', 'Category', 'Bucket', 'Description', 'Amount', 'Status', 'Due Date'],
      rows: data.expenses.map((t) => [
        t.date,
        t.accountId,
        t.category,
        t.bucket || '',
        t.description,
        t.amount,
        t.status,
        t.dueDate || '',
      ]),
    });
  }

  // Savings transactions sheet
  if (data.savings.length > 0) {
    sheets.push({
      name: 'Savings',
      headers: ['Date', 'Account', 'Type', 'Destination', 'Description', 'Amount', 'Status'],
      rows: data.savings.map((t) => [
        t.date,
        t.accountId,
        t.type,
        t.destination || '',
        t.description || '',
        t.amount,
        t.status,
      ]),
    });
  }

  const filename = data.filename || `analytics-${data.dateRange.replace(/\s+/g, '-')}`;
  downloadExcelFile(sheets, filename);
}

/**
 * Exports planner month summary to Excel format.
 * Creates sheets for each account with bucket allocations.
 * 
 * @param {AggregatedMonth} month - Month data to export
 * @param {string} [filename] - Optional filename (defaults to "planner-{monthId}")
 * @returns {void}
 * 
 * @example
 * exportPlannerMonthToExcel(monthData, 'planner-2025-01');
 */
export function exportPlannerMonthToExcel(month: AggregatedMonth, filename?: string): void {
  const sheets: Array<{ name: string; headers: string[]; rows: (string | number)[][] }> = [];

  // Summary sheet
  const totalAllocated = month.accounts.reduce((sum: number, acc) => {
    return sum + Object.values(acc.bucketAmounts).reduce((bucketSum: number, amount) => bucketSum + (amount || 0), 0);
  }, 0);
  const totalPaid = month.accounts.reduce((sum: number, acc) => {
    return sum + Object.entries(acc.bucketAmounts).reduce((bucketSum: number, [bucketId, amount]) => {
      const status = month.statusByBucket[bucketId];
      return bucketSum + (status === 'Paid' ? (amount || 0) : 0);
    }, 0);
  }, 0);
  const totalPending = totalAllocated - totalPaid;

  sheets.push({
    name: 'Summary',
    headers: ['Metric', 'Value'],
    rows: [
      ['Month', month.id],
      ['Total Allocated', totalAllocated],
      ['Total Paid', totalPaid],
      ['Total Pending', totalPending],
      ['Accounts Count', month.accounts.length],
    ],
  });

  // Account sheets
  month.accounts.forEach((account) => {
    const accountTotal = Object.values(account.bucketAmounts).reduce((sum: number, amount) => sum + (amount || 0), 0);
    const accountPaid = Object.entries(account.bucketAmounts).reduce((sum: number, [bucketId, amount]) => {
      const status = month.statusByBucket[bucketId];
      return sum + (status === 'Paid' ? (amount || 0) : 0);
    }, 0);

    // Build bucket rows from bucketAmounts
    const bucketRows: (string | number)[][] = Object.entries(account.bucketAmounts)
      .filter(([, amount]) => amount !== null && amount !== undefined && amount > 0)
      .map(([bucketId, amount]) => [
        bucketId, // Bucket ID
        '', // Category (not available in AggregatedAccount)
        amount ?? 0,
        month.statusByBucket[bucketId] || 'Pending',
        month.dueDates[bucketId] || account.bucketDueDates[bucketId] || '',
      ]);

    const rows: (string | number)[][] = [
      ['Account', account.accountName],
      ['Account Type', account.accountType],
      ['Total Allocated', accountTotal],
      ['Total Paid', accountPaid],
      ['Total Pending', accountTotal - accountPaid],
      [], // Empty row
      ['Bucket', 'Category', 'Allocated', 'Status', 'Due Date'],
      ...bucketRows,
    ];

    // Sanitize sheet name (Excel has restrictions)
    const sheetName = account.accountName.replace(/[\\/?:*[\]]/g, '_').substring(0, 31);
    sheets.push({
      name: sheetName,
      headers: [],
      rows,
    });
  });

  const excelFilename = filename || `planner-${month.id}`;
  downloadExcelFile(sheets, excelFilename);
}

