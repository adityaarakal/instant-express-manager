/**
 * Data Import Utilities
 * 
 * Provides a consistent API for importing data from various formats (CSV, Excel, JSON).
 * Supports schema validation, data transformation, error reporting, and progress tracking.
 * 
 * @module dataImport
 */

import * as XLSX from 'xlsx';
import { validateFile, safeJsonParse } from './security';

// ============================================================================
// Types and Interfaces
// ============================================================================

export type ImportFormat = 'csv' | 'xlsx' | 'json';

export interface FieldSchema {
  /** Field name in the imported data */
  name: string;
  /** Display name for the field */
  label?: string;
  /** Data type: 'string', 'number', 'date', 'boolean' */
  type: 'string' | 'number' | 'date' | 'boolean';
  /** Whether this field is required */
  required?: boolean;
  /** Default value if field is missing */
  defaultValue?: unknown;
  /** Custom validation function */
  validate?: (value: unknown) => boolean | string;
  /** Custom transformation function */
  transform?: (value: unknown) => unknown;
}

export interface ImportSchema {
  /** Array of field definitions */
  fields: FieldSchema[];
  /** Whether to skip the first row (header row) */
  skipHeader?: boolean;
  /** Custom header mapping (column index or name -> field name) */
  headerMapping?: Record<string | number, string>;
}

export interface ImportOptions {
  /** Schema definition for validation and transformation */
  schema?: ImportSchema;
  /** Maximum number of rows to import (0 = unlimited) */
  maxRows?: number;
  /** Progress callback (0-100) */
  onProgress?: (progress: number) => void;
  /** Whether to stop on first error */
  stopOnError?: boolean;
  /** Custom row filter function */
  filterRow?: (row: Record<string, unknown>, index: number) => boolean;
  /** Custom row transformation function */
  transformRow?: (row: Record<string, unknown>, index: number) => Record<string, unknown>;
  /** Whether to skip the first row (header row) - defaults to true for CSV/Excel */
  skipHeader?: boolean;
}

export interface ImportResult<T = Record<string, unknown>> {
  success: boolean;
  data: T[];
  errors: ImportError[];
  warnings: string[];
  totalRows: number;
  importedRows: number;
  skippedRows: number;
}

export interface ImportError {
  row: number;
  field?: string;
  message: string;
  value?: unknown;
}

// ============================================================================
// CSV Import
// ============================================================================

/**
 * Parses CSV content into array of objects
 */
function parseCSV(csvContent: string, options: ImportOptions = {}): Record<string, unknown>[] {
  const lines = csvContent.split('\n').filter((line) => line.trim());
  if (lines.length === 0) return [];

  const { schema, skipHeader = true } = options;
  const startIndex = skipHeader ? 1 : 0;

  // Parse header row
  const headerLine = lines[0];
  const headers = parseCSVLine(headerLine);

  // Map headers using schema or headerMapping
  const fieldMapping: Record<number, string> = {};
  if (schema?.headerMapping) {
    headers.forEach((header, index) => {
      const mappedField = schema.headerMapping?.[header] || schema.headerMapping?.[index];
      if (mappedField) {
        fieldMapping[index] = mappedField;
      }
    });
  } else {
    headers.forEach((header, index) => {
      fieldMapping[index] = header;
    });
  }

  // Parse data rows
  const rows: Record<string, unknown>[] = [];
  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;

    const values = parseCSVLine(line);
    const row: Record<string, unknown> = {};

    values.forEach((value, index) => {
      const fieldName = fieldMapping[index] || `column_${index}`;
      row[fieldName] = value;
    });

    rows.push(row);
  }

  return rows;
}

/**
 * Parses a single CSV line, handling quoted values
 */
function parseCSVLine(line: string): string[] {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        current += '"';
        i++; // Skip next quote
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // End of field
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  // Add last field
  values.push(current.trim());

  return values;
}

/**
 * Imports data from CSV file
 */
export async function importFromCSV<T = Record<string, unknown>>(
  file: File,
  options: ImportOptions = {},
): Promise<ImportResult<T>> {
  try {
    // Validate file
    const fileValidation = validateFile(file, ['text/csv', 'text/plain'], 10 * 1024 * 1024); // 10MB max
    if (!fileValidation.valid) {
      return {
        success: false,
        data: [],
        errors: [{ row: 0, message: fileValidation.error || 'Invalid file' }],
        warnings: [],
        totalRows: 0,
        importedRows: 0,
        skippedRows: 0,
      };
    }

    // Read file
    const csvContent = await readFileAsText(file);
    const rawRows = parseCSV(csvContent, options);

    // Process rows
    return processImportData<T>(rawRows, options);
  } catch (error) {
    return {
      success: false,
      data: [],
      errors: [{ row: 0, message: error instanceof Error ? error.message : 'Unknown error' }],
      warnings: [],
      totalRows: 0,
      importedRows: 0,
      skippedRows: 0,
    };
  }
}

// ============================================================================
// Excel Import
// ============================================================================

/**
 * Imports data from Excel file
 */
export async function importFromExcel<T = Record<string, unknown>>(
  file: File,
  options: ImportOptions = {},
): Promise<ImportResult<T>> {
  try {
    // Validate file
    const fileValidation = validateFile(
      file,
      [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
      ],
      10 * 1024 * 1024,
    ); // 10MB max
    if (!fileValidation.valid) {
      return {
        success: false,
        data: [],
        errors: [{ row: 0, message: fileValidation.error || 'Invalid file' }],
        warnings: [],
        totalRows: 0,
        importedRows: 0,
        skippedRows: 0,
      };
    }

    // Read file
    const arrayBuffer = await readFileAsArrayBuffer(file);
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });

    // Get first sheet
    const firstSheetName = workbook.SheetNames[0];
    if (!firstSheetName) {
      return {
        success: false,
        data: [],
        errors: [{ row: 0, message: 'Excel file has no sheets' }],
        warnings: [],
        totalRows: 0,
        importedRows: 0,
        skippedRows: 0,
      };
    }

    const worksheet = workbook.Sheets[firstSheetName];
    const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, {
      raw: false, // Convert all values to strings/numbers
      defval: '', // Default value for empty cells
    });

    // Process rows
    return processImportData<T>(rawRows, options);
  } catch (error) {
    return {
      success: false,
      data: [],
      errors: [{ row: 0, message: error instanceof Error ? error.message : 'Unknown error' }],
      warnings: [],
      totalRows: 0,
      importedRows: 0,
      skippedRows: 0,
    };
  }
}

// ============================================================================
// JSON Import
// ============================================================================

/**
 * Imports data from JSON file
 */
export async function importFromJSON<T = Record<string, unknown>>(
  file: File,
  options: ImportOptions = {},
): Promise<ImportResult<T>> {
  try {
    // Validate file
    const fileValidation = validateFile(file, ['application/json', 'text/json'], 10 * 1024 * 1024); // 10MB max
    if (!fileValidation.valid) {
      return {
        success: false,
        data: [],
        errors: [{ row: 0, message: fileValidation.error || 'Invalid file' }],
        warnings: [],
        totalRows: 0,
        importedRows: 0,
        skippedRows: 0,
      };
    }

    // Read and parse file
    const jsonContent = await readFileAsText(file);
    const parsed = safeJsonParse<unknown>(jsonContent, 10 * 1024 * 1024);

    if (!parsed) {
      return {
        success: false,
        data: [],
        errors: [{ row: 0, message: 'Invalid JSON or file too large' }],
        warnings: [],
        totalRows: 0,
        importedRows: 0,
        skippedRows: 0,
      };
    }

    // Handle array or single object
    const rawRows = Array.isArray(parsed) ? parsed : [parsed];

    // Process rows
    return processImportData<T>(rawRows, options);
  } catch (error) {
    return {
      success: false,
      data: [],
      errors: [{ row: 0, message: error instanceof Error ? error.message : 'Unknown error' }],
      warnings: [],
      totalRows: 0,
      importedRows: 0,
      skippedRows: 0,
    };
  }
}

// ============================================================================
// Data Processing
// ============================================================================

/**
 * Processes imported data with validation and transformation
 */
function processImportData<T = Record<string, unknown>>(
  rawRows: unknown[],
  options: ImportOptions = {},
): ImportResult<T> {
  const { schema, maxRows = 0, onProgress, stopOnError = false, filterRow, transformRow } = options;

  const result: ImportResult<T> = {
    success: true,
    data: [],
    errors: [],
    warnings: [],
    totalRows: rawRows.length,
    importedRows: 0,
    skippedRows: 0,
  };

  const maxRowsToProcess = maxRows > 0 ? Math.min(maxRows, rawRows.length) : rawRows.length;

  for (let i = 0; i < maxRowsToProcess; i++) {
    const rawRow = rawRows[i];
    const rowIndex = i + 1; // 1-based for user display

    // Update progress
    if (onProgress) {
      const progress = Math.round(((i + 1) / maxRowsToProcess) * 100);
      onProgress(progress);
    }

    // Convert to object if needed
    let row: Record<string, unknown>;
    if (typeof rawRow === 'object' && rawRow !== null && !Array.isArray(rawRow)) {
      row = rawRow as Record<string, unknown>;
    } else {
      result.errors.push({
        row: rowIndex,
        message: `Row ${rowIndex} is not a valid object`,
        value: rawRow,
      });
      if (stopOnError) break;
      result.skippedRows++;
      continue;
    }

    // Apply filter
    if (filterRow && !filterRow(row, i)) {
      result.skippedRows++;
      continue;
    }

    // Validate and transform using schema
    if (schema) {
      const validationResult = validateAndTransformRow(row, schema, rowIndex);
      if (!validationResult.valid) {
        result.errors.push(...validationResult.errors);
        if (stopOnError) break;
        result.skippedRows++;
        continue;
      }
      if (validationResult.warnings.length > 0) {
        result.warnings.push(...validationResult.warnings);
      }
      row = validationResult.row;
    }

    // Apply custom transformation
    if (transformRow) {
      try {
        row = transformRow(row, i) as Record<string, unknown>;
      } catch (error) {
        result.errors.push({
          row: rowIndex,
          message: `Transformation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        });
        if (stopOnError) break;
        result.skippedRows++;
        continue;
      }
    }

    // Add to result
    result.data.push(row as T);
    result.importedRows++;
  }

  result.success = result.errors.length === 0 || !stopOnError;

  return result;
}

/**
 * Validates and transforms a row according to schema
 */
function validateAndTransformRow(
  row: Record<string, unknown>,
  schema: ImportSchema,
  rowIndex: number,
): { valid: boolean; row: Record<string, unknown>; errors: ImportError[]; warnings: string[] } {
  const errors: ImportError[] = [];
  const warnings: string[] = [];
  const transformedRow: Record<string, unknown> = {};

  for (const field of schema.fields) {
    const value = row[field.name];

    // Check required fields
    if (field.required && (value === null || value === undefined || value === '')) {
      errors.push({
        row: rowIndex,
        field: field.name,
        message: `Required field '${field.label || field.name}' is missing`,
      });
      continue;
    }

    // Use default value if missing
    let processedValue = value === null || value === undefined || value === '' ? field.defaultValue : value;

    // Type conversion
    if (processedValue !== null && processedValue !== undefined) {
      try {
        processedValue = convertType(processedValue, field.type);
      } catch (error) {
        errors.push({
          row: rowIndex,
          field: field.name,
          message: `Failed to convert '${field.label || field.name}' to ${field.type}: ${error instanceof Error ? error.message : 'Unknown error'}`,
          value,
        });
        continue;
      }
    }

    // Custom validation
    if (field.validate && processedValue !== null && processedValue !== undefined) {
      const validationResult = field.validate(processedValue);
      if (validationResult !== true) {
        const errorMessage = typeof validationResult === 'string' ? validationResult : `Invalid value for '${field.label || field.name}'`;
        errors.push({
          row: rowIndex,
          field: field.name,
          message: errorMessage,
          value: processedValue,
        });
        continue;
      }
    }

    // Custom transformation
    if (field.transform && processedValue !== null && processedValue !== undefined) {
      try {
        processedValue = field.transform(processedValue);
      } catch (error) {
        warnings.push(`Transformation failed for '${field.label || field.name}' in row ${rowIndex}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    transformedRow[field.name] = processedValue;
  }

  return {
    valid: errors.length === 0,
    row: transformedRow,
    errors,
    warnings,
  };
}

/**
 * Converts a value to the specified type
 */
function convertType(value: unknown, type: FieldSchema['type']): unknown {
  switch (type) {
    case 'string':
      return String(value);
    case 'number':
      if (typeof value === 'number') return value;
      if (typeof value === 'string') {
        const cleaned = value.replace(/[^\d.-]/g, '');
        const parsed = parseFloat(cleaned);
        if (isNaN(parsed)) throw new Error(`Cannot convert "${value}" to number`);
        return parsed;
      }
      throw new Error(`Cannot convert ${typeof value} to number`);
    case 'date':
      if (value instanceof Date) return value;
      if (typeof value === 'string' || typeof value === 'number') {
        const date = new Date(value);
        if (isNaN(date.getTime())) throw new Error(`Cannot convert "${value}" to date`);
        return date;
      }
      throw new Error(`Cannot convert ${typeof value} to date`);
    case 'boolean':
      if (typeof value === 'boolean') return value;
      if (typeof value === 'string') {
        const lower = value.toLowerCase().trim();
        if (lower === 'true' || lower === '1' || lower === 'yes') return true;
        if (lower === 'false' || lower === '0' || lower === 'no') return false;
        throw new Error(`Cannot convert "${value}" to boolean`);
      }
      if (typeof value === 'number') return value !== 0;
      throw new Error(`Cannot convert ${typeof value} to boolean`);
    default:
      return value;
  }
}

// ============================================================================
// Universal Import Function
// ============================================================================

/**
 * Universal import function that supports all formats
 */
export async function importData<T = Record<string, unknown>>(
  file: File,
  format: ImportFormat,
  options: ImportOptions = {},
): Promise<ImportResult<T>> {
  switch (format) {
    case 'csv':
      return importFromCSV<T>(file, options);
    case 'xlsx':
      return importFromExcel<T>(file, options);
    case 'json':
      return importFromJSON<T>(file, options);
    default:
      return {
        success: false,
        data: [],
        errors: [{ row: 0, message: `Unsupported import format: ${format}` }],
        warnings: [],
        totalRows: 0,
        importedRows: 0,
        skippedRows: 0,
      };
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Reads a file as text
 */
function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (text) {
        resolve(text);
      } else {
        reject(new Error('Failed to read file as text'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

/**
 * Reads a file as ArrayBuffer
 */
function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const arrayBuffer = e.target?.result as ArrayBuffer;
      if (arrayBuffer) {
        resolve(arrayBuffer);
      } else {
        reject(new Error('Failed to read file as ArrayBuffer'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Validates import data structure
 */
export function validateImportData<T>(data: T[]): { valid: boolean; error?: string } {
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

/**
 * Detects file format from file extension or MIME type
 */
export function detectImportFormat(file: File): ImportFormat | null {
  const fileName = file.name.toLowerCase();
  const mimeType = file.type.toLowerCase();

  if (fileName.endsWith('.csv') || mimeType.includes('csv')) {
    return 'csv';
  }
  if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls') || mimeType.includes('spreadsheet') || mimeType.includes('excel')) {
    return 'xlsx';
  }
  if (fileName.endsWith('.json') || mimeType.includes('json')) {
    return 'json';
  }

  return null;
}

