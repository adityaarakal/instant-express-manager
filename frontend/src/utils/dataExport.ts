/**
 * Data Export Utilities
 * 
 * Provides a consistent API for exporting data in various formats (CSV, Excel, JSON, PDF).
 * Supports customizable formatting, progress callbacks, and error handling.
 * 
 * @module dataExport
 */

import * as XLSX from 'xlsx';

// ============================================================================
// Types and Interfaces
// ============================================================================

export type ExportFormat = 'csv' | 'xlsx' | 'json' | 'pdf';

export interface ExportOptions {
  /** Filename for the exported file (without extension) */
  filename?: string;
  /** Whether to include headers in CSV/Excel exports */
  includeHeaders?: boolean;
  /** Custom date format for date fields */
  dateFormat?: string;
  /** Custom number format for numeric fields */
  numberFormat?: string;
  /** Progress callback for large exports (0-100) */
  onProgress?: (progress: number) => void;
  /** Custom headers mapping (field name -> display name) */
  headers?: Record<string, string>;
  /** Fields to exclude from export */
  excludeFields?: string[];
  /** Fields to include (if specified, only these fields are exported) */
  includeFields?: string[];
}

export interface ExportResult {
  success: boolean;
  filename?: string;
  error?: string;
  format: ExportFormat;
}

// ============================================================================
// CSV Export
// ============================================================================

/**
 * Escapes a value for CSV format
 */
function escapeCSV(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Converts an array of objects to CSV format
 */
function convertToCSV<T extends Record<string, unknown>>(
  data: T[],
  options: ExportOptions = {},
): string {
  if (data.length === 0) return '';

  const { includeHeaders = true, headers, excludeFields = [], includeFields } = options;

  // Get all field names from first object
  const allFields = Object.keys(data[0]);
  const fields = includeFields || allFields.filter((field) => !excludeFields.includes(field));

  // Apply custom header mapping
  const headerRow: string[] = includeHeaders
    ? fields.map((field) => headers?.[field] || field)
    : [];

  // Convert data to rows
  const rows: (string | number | null | undefined)[][] = data.map((item) => 
    fields.map((field): string | number | null | undefined => {
      const value = item[field];
      if (value === null || value === undefined) return '';
      if (typeof value === 'string' || typeof value === 'number') return value;
      return String(value);
    })
  );

  // Combine header and rows
  const csvRows: (string | number | null | undefined)[][] = includeHeaders 
    ? [headerRow as (string | number | null | undefined)[], ...rows] 
    : rows;

  // Convert to CSV string
  return csvRows.map((row) => row.map((cell) => escapeCSV(cell)).join(',')).join('\n');
}

/**
 * Exports data to CSV format
 */
export async function exportToCSV<T extends Record<string, unknown>>(
  data: T[],
  options: ExportOptions = {},
): Promise<ExportResult> {
  try {
    const csvContent = convertToCSV(data, options);
    const filename = options.filename || `export-${new Date().toISOString().split('T')[0]}`;
    const fullFilename = `${filename}.csv`;

    // Trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', fullFilename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    if (options.onProgress) {
      options.onProgress(100);
    }

    return {
      success: true,
      filename: fullFilename,
      format: 'csv',
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      format: 'csv',
    };
  }
}

// ============================================================================
// Excel Export
// ============================================================================

/**
 * Converts an array of objects to Excel worksheet format
 */
function convertToExcel<T extends Record<string, unknown>>(
  data: T[],
  options: ExportOptions = {},
): XLSX.WorkSheet {
  const { includeHeaders = true, headers, excludeFields = [], includeFields } = options;

  if (data.length === 0) {
    return XLSX.utils.aoa_to_sheet([[]]);
  }

  // Get all field names from first object
  const allFields = Object.keys(data[0]);
  const fields = includeFields || allFields.filter((field) => !excludeFields.includes(field));

  // Create header row
  const headerRow = includeHeaders ? fields.map((field) => headers?.[field] || field) : [];

  // Convert data to rows
  const rows = data.map((item) => fields.map((field) => item[field] ?? ''));

  // Combine header and rows
  const excelData = includeHeaders ? [headerRow, ...rows] : rows;

  return XLSX.utils.aoa_to_sheet(excelData);
}

/**
 * Exports data to Excel format
 */
export async function exportToExcel<T extends Record<string, unknown>>(
  data: T[],
  options: ExportOptions = {},
): Promise<ExportResult> {
  try {
    const worksheet = convertToExcel(data, options);
    const workbook = XLSX.utils.book_new();
    const sheetName = options.filename || 'Sheet1';
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    // Set column widths for better readability
    if (data.length > 0) {
      const allFields = Object.keys(data[0]);
      const { excludeFields = [], includeFields } = options;
      const fields = includeFields || allFields.filter((field) => !excludeFields.includes(field));

      const maxWidths = fields.map((_, colIndex) => {
        const maxLength = Math.max(
          String(fields[colIndex]).length,
          ...data.map((row) => String(row[fields[colIndex]] ?? '').length),
        );
        return { wch: Math.min(maxLength + 2, 50) }; // Max width of 50 characters
      });
      worksheet['!cols'] = maxWidths;
    }

    const filename = options.filename || `export-${new Date().toISOString().split('T')[0]}`;
    const fullFilename = `${filename}.xlsx`;

    XLSX.writeFile(workbook, fullFilename);

    if (options.onProgress) {
      options.onProgress(100);
    }

    return {
      success: true,
      filename: fullFilename,
      format: 'xlsx',
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      format: 'xlsx',
    };
  }
}

/**
 * Exports multiple datasets to Excel with multiple sheets
 */
export async function exportToExcelMultiSheet(
  sheets: Array<{ name: string; data: Record<string, unknown>[]; options?: ExportOptions }>,
  filename?: string,
): Promise<ExportResult> {
  try {
    const workbook = XLSX.utils.book_new();
    const totalSheets = sheets.length;

    sheets.forEach((sheet, index) => {
      const worksheet = convertToExcel(sheet.data, sheet.options);
      XLSX.utils.book_append_sheet(workbook, worksheet, sheet.name);

      if (sheets[0].options?.onProgress) {
        const progress = Math.round(((index + 1) / totalSheets) * 100);
        sheets[0].options.onProgress(progress);
      }
    });

    const fullFilename = filename || `export-${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fullFilename);

    if (sheets[0].options?.onProgress) {
      sheets[0].options.onProgress(100);
    }

    return {
      success: true,
      filename: fullFilename,
      format: 'xlsx',
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      format: 'xlsx',
    };
  }
}

// ============================================================================
// JSON Export
// ============================================================================

/**
 * Exports data to JSON format
 */
export async function exportToJSON<T extends Record<string, unknown>>(
  data: T[],
  options: ExportOptions = {},
): Promise<ExportResult> {
  try {
    const { excludeFields = [], includeFields } = options;

    // Filter fields if needed
    let filteredData = data;
    if (excludeFields.length > 0 || includeFields) {
      filteredData = data.map((item) => {
        const allFields = Object.keys(item);
        const fields = includeFields || allFields.filter((field) => !excludeFields.includes(field));
        const filtered: Record<string, unknown> = {};
        fields.forEach((field) => {
          filtered[field] = item[field];
        });
        return filtered as T;
      });
    }

    const jsonContent = JSON.stringify(filteredData, null, 2);
    const filename = options.filename || `export-${new Date().toISOString().split('T')[0]}`;
    const fullFilename = `${filename}.json`;

    // Trigger download
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', fullFilename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    if (options.onProgress) {
      options.onProgress(100);
    }

    return {
      success: true,
      filename: fullFilename,
      format: 'json',
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      format: 'json',
    };
  }
}

// ============================================================================
// PDF Export (Lazy Loaded)
// ============================================================================

/**
 * Exports data to PDF format (lazy-loaded)
 * 
 * Note: PDF export requires jsPDF and jspdf-autotable libraries.
 * These are loaded dynamically to reduce initial bundle size.
 */
export async function exportToPDF<T extends Record<string, unknown>>(
  data: T[],
  options: ExportOptions = {},
): Promise<ExportResult> {
  try {
    // Dynamically import PDF module
    const { exportTableToPDF } = await import('./pdfExport');

    const filename = options.filename || `export-${new Date().toISOString().split('T')[0]}`;
    const fullFilename = `${filename}.pdf`;

    await exportTableToPDF(data, {
      ...options,
      filename: fullFilename,
    });

    if (options.onProgress) {
      options.onProgress(100);
    }

    return {
      success: true,
      filename: fullFilename,
      format: 'pdf',
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'PDF export not available',
      format: 'pdf',
    };
  }
}

// ============================================================================
// Universal Export Function
// ============================================================================

/**
 * Universal export function that supports all formats
 */
export async function exportData<T extends Record<string, unknown>>(
  data: T[],
  format: ExportFormat,
  options: ExportOptions = {},
): Promise<ExportResult> {
  switch (format) {
    case 'csv':
      return exportToCSV(data, options);
    case 'xlsx':
      return exportToExcel(data, options);
    case 'json':
      return exportToJSON(data, options);
    case 'pdf':
      return exportToPDF(data, options);
    default:
      return {
        success: false,
        error: `Unsupported export format: ${format}`,
        format,
      };
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Generates a default filename based on current date
 */
export function generateDefaultFilename(prefix: string = 'export'): string {
  const date = new Date().toISOString().split('T')[0];
  return `${prefix}-${date}`;
}

/**
 * Validates export data
 */
export function validateExportData<T>(data: T[]): { valid: boolean; error?: string } {
  if (!Array.isArray(data)) {
    return { valid: false, error: 'Data must be an array' };
  }

  if (data.length === 0) {
    return { valid: false, error: 'Data array is empty' };
  }

  if (!data.every((item) => typeof item === 'object' && item !== null)) {
    return { valid: false, error: 'All items must be objects' };
  }

  return { valid: true };
}

