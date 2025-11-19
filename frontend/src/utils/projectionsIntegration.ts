/**
 * Projections Integration Utility
 * Handles importing and syncing projection data
 */

import * as XLSX from 'xlsx';
import { useProjectionsStore } from '../store/useProjectionsStore';
import { useIncomeTransactionsStore } from '../store/useIncomeTransactionsStore';
import { useSavingsInvestmentTransactionsStore } from '../store/useSavingsInvestmentTransactionsStore';
import { useBankAccountsStore } from '../store/useBankAccountsStore';
import { useToastStore } from '../store/useToastStore';

/**
 * Expected CSV/Excel structure:
 * - Column A: Month (format: "YYYY-MM" or "MM/YYYY" or "Month Year")
 * - Column B: Inflow Total (number)
 * - Column C: Savings Target (number, optional)
 */
export interface ProjectionsImportRow {
  month: string; // Can be "YYYY-MM", "MM/YYYY", or "Month Year"
  inflowTotal: number | null;
  savingsTarget: number | null;
}

/**
 * Parse month string to "YYYY-MM" format
 */
function parseMonthString(monthStr: string): string | null {
  if (!monthStr || typeof monthStr !== 'string') return null;

  const trimmed = monthStr.trim();

  // Already in "YYYY-MM" format
  if (/^\d{4}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }

  // Try "MM/YYYY" format
  const mmYYYYMatch = trimmed.match(/^(\d{1,2})\/(\d{4})$/);
  if (mmYYYYMatch) {
    const month = mmYYYYMatch[1].padStart(2, '0');
    const year = mmYYYYMatch[2];
    return `${year}-${month}`;
  }

  // Try "YYYY/MM" format
  const yyyyMMMatch = trimmed.match(/^(\d{4})\/(\d{1,2})$/);
  if (yyyyMMMatch) {
    const year = yyyyMMMatch[1];
    const month = yyyyMMMatch[2].padStart(2, '0');
    return `${year}-${month}`;
  }

  // Try parsing as date
  const date = new Date(trimmed);
  if (!isNaN(date.getTime())) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }

  return null;
}

/**
 * Parse number from cell value
 */
function parseNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const cleaned = value.replace(/[^\d.-]/g, '');
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? null : parsed;
  }
  return null;
}

/**
 * Import projections from CSV file
 */
export async function importProjectionsFromCSV(file: File): Promise<ProjectionsImportRow[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split('\n').filter((line) => line.trim());

        if (lines.length < 2) {
          reject(new Error('CSV file must have at least a header row and one data row'));
          return;
        }

        // Skip header row
        const dataRows = lines.slice(1);
        const projections: ProjectionsImportRow[] = [];

        for (const line of dataRows) {
          const columns = line.split(',').map((col) => col.trim().replace(/^"|"$/g, ''));
          
          if (columns.length < 2) continue;

          const monthStr = columns[0];
          const monthId = parseMonthString(monthStr);
          
          if (!monthId) {
            console.warn(`Skipping invalid month: ${monthStr}`);
            continue;
          }

          const inflowTotal = parseNumber(columns[1]);
          const savingsTarget = columns.length > 2 ? parseNumber(columns[2]) : null;

          projections.push({
            month: monthId,
            inflowTotal,
            savingsTarget,
          });
        }

        resolve(projections);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read CSV file'));
    };

    reader.readAsText(file);
  });
}

/**
 * Import projections from Excel file
 */
export async function importProjectionsFromExcel(file: File): Promise<ProjectionsImportRow[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: null }) as unknown[][];

        if (jsonData.length < 2) {
          reject(new Error('Excel file must have at least a header row and one data row'));
          return;
        }

        // Skip header row
        const dataRows = jsonData.slice(1);
        const projections: ProjectionsImportRow[] = [];

        for (const row of dataRows) {
          if (row.length < 2) continue;

          const monthValue = row[0];
          const monthStr = monthValue?.toString() || '';
          const monthId = parseMonthString(monthStr);

          if (!monthId) {
            console.warn(`Skipping invalid month: ${monthStr}`);
            continue;
          }

          const inflowTotal = parseNumber(row[1]);
          const savingsTarget = row.length > 2 ? parseNumber(row[2]) : null;

          projections.push({
            month: monthId,
            inflowTotal,
            savingsTarget,
          });
        }

        resolve(projections);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read Excel file'));
    };

    reader.readAsBinaryString(file);
  });
}

/**
 * Auto-populate inflow totals from projections
 * Creates income transactions based on projected inflow totals
 */
export function autoPopulateInflowFromProjections(monthId: string): void {
  const { getInflowTotal } = useProjectionsStore.getState();
  const { transactions, createTransaction } = useIncomeTransactionsStore.getState();
  const { accounts } = useBankAccountsStore.getState();
  const { showSuccess, showWarning } = useToastStore.getState();

  const projectedInflow = getInflowTotal(monthId);
  
  if (projectedInflow === null) {
    showWarning(`No projection found for month ${monthId}`);
    return;
  }

  // Check if income transactions already exist for this month
  const [year, month] = monthId.split('-').map(Number);
  const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0];
  const endDate = new Date(year, month, 0).toISOString().split('T')[0];

  const existingIncomes = transactions.filter(
    (t) => t.date >= startDate && t.date <= endDate
  );

  const currentTotal = existingIncomes.reduce((sum, t) => sum + t.amount, 0);
  const difference = projectedInflow - currentTotal;

  if (Math.abs(difference) < 0.01) {
    showWarning(`Inflow total already matches projection (${projectedInflow.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })})`);
    return;
  }

  // If difference is positive, create an income transaction
  // If negative, we could create a negative adjustment, but for now just warn
  if (difference > 0) {
    // Get available accounts
    const incomeAccounts = accounts.filter((acc: { accountType: string }) => acc.accountType !== 'CreditCard');

    if (incomeAccounts.length === 0) {
      showWarning('No suitable accounts found. Please create a non-credit card account first.');
      return;
    }

    // Use the first available account
    const accountId = incomeAccounts[0].id;

    createTransaction({
      accountId,
      amount: difference,
      date: startDate,
      category: 'Other',
      description: `Auto-populated from projection for ${monthId}`,
      status: 'Pending',
    });

    showSuccess(`Created income transaction of ${difference.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })} for ${monthId}`);
  } else {
    showWarning(`Current inflow (${currentTotal.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}) exceeds projection (${projectedInflow.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}). No adjustment made.`);
  }
}

/**
 * Get savings progress for a month based on projections
 */
export function getSavingsProgress(monthId: string): {
  target: number | null;
  actual: number;
  progress: number; // 0-100
} {
  const { getSavingsTarget } = useProjectionsStore.getState();
  const { transactions } = useSavingsInvestmentTransactionsStore.getState();

  const target = getSavingsTarget(monthId);
  
  if (target === null) {
    return { target: null, actual: 0, progress: 0 };
  }

  // Calculate actual savings for the month
  const [year, month] = monthId.split('-').map(Number);
  const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0];
  const endDate = new Date(year, month, 0).toISOString().split('T')[0];

  const monthSavings = transactions.filter(
    (t) => t.date >= startDate && t.date <= endDate && t.status === 'Completed'
  );

  const actual = monthSavings.reduce((sum, t) => sum + t.amount, 0);
  const progress = target > 0 ? Math.min(100, (actual / target) * 100) : 0;

  return { target, actual, progress };
}

