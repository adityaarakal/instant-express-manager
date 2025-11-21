/**
 * Projections Integration Utility
 * 
 * Handles importing and syncing projection data from CSV/Excel files.
 * Supports auto-populating inflow totals and calculating savings progress.
 * 
 * @module projectionsIntegration
 */

import * as XLSX from 'xlsx';
import { useProjectionsStore } from '../store/useProjectionsStore';
import { useIncomeTransactionsStore } from '../store/useIncomeTransactionsStore';
import { useSavingsInvestmentTransactionsStore } from '../store/useSavingsInvestmentTransactionsStore';
import { useBankAccountsStore } from '../store/useBankAccountsStore';
import { useToastStore } from '../store/useToastStore';
import {
  validateProjectionsImport,
  cleanProjectionsImport,
  type ProjectionsImportValidationResult,
} from './projectionsImportValidation';

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
 * Parses month string to "YYYY-MM" format.
 * Supports various formats: "YYYY-MM", "MM/YYYY", "YYYY/MM", or date strings.
 * 
 * @private
 * @param {string} monthStr - Month string in various formats
 * @returns {string | null} Normalized month string in "YYYY-MM" format, or null if invalid
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
 * Parses number from cell value.
 * Handles strings, numbers, and null/undefined values.
 * 
 * @private
 * @param {unknown} value - Cell value to parse
 * @returns {number | null} Parsed number or null if invalid
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
 * Imports projections from a CSV file.
 * 
 * Expected CSV format:
 * - Column A: Month (format: "YYYY-MM", "MM/YYYY", or "Month Year")
 * - Column B: Inflow Total (number)
 * - Column C: Savings Target (number, optional)
 * 
 * @param {File} file - CSV file to import
 * @returns {Promise<Object>} Object containing parsed projections and validation results
 * @returns {ProjectionsImportRow[]} returns.projections - Array of parsed projection rows
 * @returns {ProjectionsImportValidationResult} returns.validation - Validation results with errors/warnings
 * 
 * @throws {Error} If file cannot be read or is invalid
 * 
 * @example
 * const fileInput = document.querySelector('input[type="file"]');
 * const file = fileInput.files[0];
 * const { projections, validation } = await importProjectionsFromCSV(file);
 * if (validation.errors.length === 0) {
 *   // Import successful
 * }
 */
export async function importProjectionsFromCSV(
  file: File,
): Promise<{ projections: ProjectionsImportRow[]; validation: ProjectionsImportValidationResult }> {
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

        // Validate and clean projections
        const validation = validateProjectionsImport(projections);
        const cleaned = cleanProjectionsImport(projections);

        resolve({
          projections: cleaned.cleaned,
          validation,
        });
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
 * Imports projections from an Excel file (.xlsx).
 * 
 * Expected Excel format (first sheet):
 * - Column A: Month (format: "YYYY-MM", "MM/YYYY", or "Month Year")
 * - Column B: Inflow Total (number)
 * - Column C: Savings Target (number, optional)
 * 
 * @param {File} file - Excel file to import
 * @returns {Promise<Object>} Object containing parsed projections and validation results
 * @returns {ProjectionsImportRow[]} returns.projections - Array of parsed projection rows
 * @returns {ProjectionsImportValidationResult} returns.validation - Validation results with errors/warnings
 * 
 * @throws {Error} If file cannot be read or is invalid
 * 
 * @example
 * const fileInput = document.querySelector('input[type="file"]');
 * const file = fileInput.files[0];
 * const { projections, validation } = await importProjectionsFromExcel(file);
 */
export async function importProjectionsFromExcel(
  file: File,
): Promise<{ projections: ProjectionsImportRow[]; validation: ProjectionsImportValidationResult }> {
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

        // Validate and clean projections
        const validation = validateProjectionsImport(projections);
        const cleaned = cleanProjectionsImport(projections);

        resolve({
          projections: cleaned.cleaned,
          validation,
        });
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
 * Auto-populates inflow totals from projections.
 * Creates or updates income transactions based on projected inflow totals.
 * Prevents duplicate auto-populated transactions.
 * 
 * @param {string} monthId - Month ID in format "YYYY-MM"
 * @returns {void}
 * 
 * @example
 * // Auto-populate inflow for January 2025
 * autoPopulateInflowFromProjections('2025-01');
 */
export function autoPopulateInflowFromProjections(monthId: string): void {
  const { getInflowTotal } = useProjectionsStore.getState();
  const { transactions, createTransaction, updateTransaction } = useIncomeTransactionsStore.getState();
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

  // Check for existing auto-populated transaction
  const autoPopulatedPattern = `Auto-populated from projection for ${monthId}`;
  const existingAutoPopulated = existingIncomes.find(
    (t) => t.description === autoPopulatedPattern
  );

  const currentTotal = existingIncomes.reduce((sum, t) => sum + t.amount, 0);
  const difference = projectedInflow - currentTotal;

  if (Math.abs(difference) < 0.01) {
    showWarning(`Inflow total already matches projection (${projectedInflow.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })})`);
    return;
  }

  // If difference is positive, create or update an income transaction
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

    if (existingAutoPopulated) {
      // Update existing auto-populated transaction
      updateTransaction(existingAutoPopulated.id, {
        amount: existingAutoPopulated.amount + difference,
      });
      showSuccess(`Updated auto-populated transaction for ${monthId}`);
    } else {
      // Create new auto-populated transaction
      createTransaction({
        accountId,
        amount: difference,
        date: startDate,
        category: 'Other',
        description: autoPopulatedPattern,
        status: 'Pending',
      });
      showSuccess(`Created income transaction of ${difference.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })} for ${monthId}`);
    }
  } else {
    showWarning(`Current inflow (${currentTotal.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}) exceeds projection (${projectedInflow.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}). No adjustment made.`);
  }
}

/**
 * Gets savings progress for a month based on projections.
 * Calculates actual savings vs target and returns progress percentage.
 * 
 * @param {string} monthId - Month ID in format "YYYY-MM"
 * @returns {Object} Savings progress object
 * @returns {number | null} returns.target - Savings target from projections (null if not set)
 * @returns {number} returns.actual - Actual savings amount (sum of completed savings transactions)
 * @returns {number} returns.progress - Progress percentage (0-100)
 * 
 * @example
 * const progress = getSavingsProgress('2025-01');
 * // Returns { target: 50000, actual: 30000, progress: 60 }
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

