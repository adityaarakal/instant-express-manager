/**
 * Projections Import Validation Utilities
 * Validates and reports issues with projections import data
 */

import type { ProjectionsImportRow } from './projectionsIntegration';

export interface ProjectionsImportValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  duplicateMonths: string[];
  invalidRows: number[];
  validRows: number;
}

/**
 * Validate projections import data
 */
export function validateProjectionsImport(
  projections: ProjectionsImportRow[],
): ProjectionsImportValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const duplicateMonths: string[] = [];
  const invalidRows: number[] = [];
  const monthSet = new Set<string>();

  projections.forEach((projection, index) => {
    const rowNumber = index + 2; // +2 because index is 0-based and we skip header

    // Check for duplicate months
    if (monthSet.has(projection.month)) {
      duplicateMonths.push(projection.month);
      warnings.push(`Row ${rowNumber}: Duplicate month ${projection.month} (last value will be used)`);
    } else {
      monthSet.add(projection.month);
    }

    // Validate month format
    if (!projection.month || !/^\d{4}-\d{2}$/.test(projection.month)) {
      invalidRows.push(rowNumber);
      errors.push(`Row ${rowNumber}: Invalid month format "${projection.month}" (expected YYYY-MM)`);
    }

    // Validate inflow total
    if (projection.inflowTotal !== null) {
      if (projection.inflowTotal < 0) {
        warnings.push(`Row ${rowNumber}: Negative inflow total (${projection.inflowTotal})`);
      }
      if (projection.inflowTotal > 100000000) {
        warnings.push(
          `Row ${rowNumber}: Very large inflow total (₹${projection.inflowTotal.toLocaleString('en-IN')})`,
        );
      }
      if (isNaN(projection.inflowTotal)) {
        invalidRows.push(rowNumber);
        errors.push(`Row ${rowNumber}: Invalid inflow total (NaN)`);
      }
    }

    // Validate savings target
    if (projection.savingsTarget !== null) {
      if (projection.savingsTarget < 0) {
        warnings.push(`Row ${rowNumber}: Negative savings target (${projection.savingsTarget})`);
      }
      if (projection.savingsTarget > 100000000) {
        warnings.push(
          `Row ${rowNumber}: Very large savings target (₹${projection.savingsTarget.toLocaleString('en-IN')})`,
        );
      }
      if (isNaN(projection.savingsTarget)) {
        invalidRows.push(rowNumber);
        errors.push(`Row ${rowNumber}: Invalid savings target (NaN)`);
      }
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    duplicateMonths: Array.from(new Set(duplicateMonths)),
    invalidRows: Array.from(new Set(invalidRows)),
    validRows: projections.length - invalidRows.length,
  };
}

/**
 * Clean and deduplicate projections import data
 * Removes duplicates (keeps last occurrence) and invalid rows
 */
export function cleanProjectionsImport(
  projections: ProjectionsImportRow[],
): {
  cleaned: ProjectionsImportRow[];
  removed: number;
} {
  const monthMap = new Map<string, ProjectionsImportRow>();
  let removed = 0;

  projections.forEach((projection) => {
    // Skip invalid months
    if (!projection.month || !/^\d{4}-\d{2}$/.test(projection.month)) {
      removed++;
      return;
    }

    // Skip rows with invalid values
    if (
      (projection.inflowTotal !== null && (isNaN(projection.inflowTotal) || projection.inflowTotal < 0)) ||
      (projection.savingsTarget !== null && (isNaN(projection.savingsTarget) || projection.savingsTarget < 0))
    ) {
      removed++;
      return;
    }

    // Keep last occurrence of duplicate months
    monthMap.set(projection.month, projection);
  });

  return {
    cleaned: Array.from(monthMap.values()),
    removed,
  };
}

