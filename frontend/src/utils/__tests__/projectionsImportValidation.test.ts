/**
 * Tests for projections import validation utilities
 */

import { describe, it, expect } from 'vitest';
import {
  validateProjectionsImport,
  cleanProjectionsImport,
  type ProjectionsImportValidationResult,
} from '../projectionsImportValidation';
import type { ProjectionsImportRow } from '../projectionsIntegration';

describe('projectionsImportValidation', () => {
  describe('validateProjectionsImport', () => {
    it('should validate valid projections data', () => {
      const projections: ProjectionsImportRow[] = [
        { month: '2024-01', inflowTotal: 100000, savingsTarget: 20000 },
        { month: '2024-02', inflowTotal: 110000, savingsTarget: 25000 },
      ];

      const result = validateProjectionsImport(projections);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
      expect(result.validRows).toBe(2);
    });

    it('should detect duplicate months', () => {
      const projections: ProjectionsImportRow[] = [
        { month: '2024-01', inflowTotal: 100000, savingsTarget: 20000 },
        { month: '2024-01', inflowTotal: 110000, savingsTarget: 25000 },
      ];

      const result = validateProjectionsImport(projections);
      expect(result.isValid).toBe(true); // Still valid, just warnings
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.duplicateMonths).toContain('2024-01');
    });

    it('should detect invalid month format', () => {
      const projections: ProjectionsImportRow[] = [
        { month: '2024-1', inflowTotal: 100000, savingsTarget: 20000 },
        { month: 'invalid', inflowTotal: 110000, savingsTarget: 25000 },
      ];

      const result = validateProjectionsImport(projections);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.invalidRows.length).toBeGreaterThan(0);
    });

    it('should warn about negative values', () => {
      const projections: ProjectionsImportRow[] = [
        { month: '2024-01', inflowTotal: -1000, savingsTarget: 20000 },
        { month: '2024-02', inflowTotal: 100000, savingsTarget: -5000 },
      ];

      const result = validateProjectionsImport(projections);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings.some((w) => w.includes('Negative'))).toBe(true);
    });

    it('should warn about very large values', () => {
      const projections: ProjectionsImportRow[] = [
        { month: '2024-01', inflowTotal: 200000000, savingsTarget: 20000 },
      ];

      const result = validateProjectionsImport(projections);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings.some((w) => w.includes('Very large'))).toBe(true);
    });

    it('should detect NaN values', () => {
      const projections: ProjectionsImportRow[] = [
        { month: '2024-01', inflowTotal: NaN, savingsTarget: 20000 },
        { month: '2024-02', inflowTotal: 100000, savingsTarget: NaN },
      ];

      const result = validateProjectionsImport(projections);
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.includes('NaN'))).toBe(true);
      expect(result.invalidRows.length).toBeGreaterThan(0);
    });

    it('should handle null values', () => {
      const projections: ProjectionsImportRow[] = [
        { month: '2024-01', inflowTotal: null, savingsTarget: null },
        { month: '2024-02', inflowTotal: 100000, savingsTarget: 20000 },
      ];

      const result = validateProjectionsImport(projections);
      expect(result.isValid).toBe(true);
      expect(result.validRows).toBe(2);
    });

    it('should count valid rows correctly', () => {
      const projections: ProjectionsImportRow[] = [
        { month: '2024-01', inflowTotal: 100000, savingsTarget: 20000 },
        { month: 'invalid', inflowTotal: 110000, savingsTarget: 25000 },
        { month: '2024-03', inflowTotal: 120000, savingsTarget: 30000 },
      ];

      const result = validateProjectionsImport(projections);
      expect(result.validRows).toBe(2); // Only valid months count
    });
  });

  describe('cleanProjectionsImport', () => {
    it('should remove invalid rows', () => {
      const projections: ProjectionsImportRow[] = [
        { month: '2024-01', inflowTotal: 100000, savingsTarget: 20000 },
        { month: 'invalid', inflowTotal: 110000, savingsTarget: 25000 },
        { month: '2024-03', inflowTotal: 120000, savingsTarget: 30000 },
      ];

      const result = cleanProjectionsImport(projections);
      expect(result.cleaned.length).toBe(2);
      expect(result.removed).toBe(1);
      expect(result.cleaned.every((p) => /^\d{4}-\d{2}$/.test(p.month))).toBe(true);
    });

    it('should remove rows with negative values', () => {
      const projections: ProjectionsImportRow[] = [
        { month: '2024-01', inflowTotal: -1000, savingsTarget: 20000 },
        { month: '2024-02', inflowTotal: 100000, savingsTarget: -5000 },
        { month: '2024-03', inflowTotal: 120000, savingsTarget: 30000 },
      ];

      const result = cleanProjectionsImport(projections);
      expect(result.removed).toBe(2);
      expect(result.cleaned.length).toBe(1);
    });

    it('should remove rows with NaN values', () => {
      const projections: ProjectionsImportRow[] = [
        { month: '2024-01', inflowTotal: NaN, savingsTarget: 20000 },
        { month: '2024-02', inflowTotal: 100000, savingsTarget: NaN },
        { month: '2024-03', inflowTotal: 120000, savingsTarget: 30000 },
      ];

      const result = cleanProjectionsImport(projections);
      expect(result.removed).toBe(2);
      expect(result.cleaned.length).toBe(1);
    });

    it('should keep last occurrence of duplicate months', () => {
      const projections: ProjectionsImportRow[] = [
        { month: '2024-01', inflowTotal: 100000, savingsTarget: 20000 },
        { month: '2024-01', inflowTotal: 110000, savingsTarget: 25000 },
        { month: '2024-01', inflowTotal: 120000, savingsTarget: 30000 },
      ];

      const result = cleanProjectionsImport(projections);
      expect(result.cleaned.length).toBe(1);
      expect(result.cleaned[0].inflowTotal).toBe(120000); // Last one wins
      expect(result.removed).toBe(0); // Duplicates aren't counted as removed
    });

    it('should handle empty array', () => {
      const result = cleanProjectionsImport([]);
      expect(result.cleaned.length).toBe(0);
      expect(result.removed).toBe(0);
    });

    it('should handle all valid data', () => {
      const projections: ProjectionsImportRow[] = [
        { month: '2024-01', inflowTotal: 100000, savingsTarget: 20000 },
        { month: '2024-02', inflowTotal: 110000, savingsTarget: 25000 },
      ];

      const result = cleanProjectionsImport(projections);
      expect(result.cleaned.length).toBe(2);
      expect(result.removed).toBe(0);
    });
  });
});

