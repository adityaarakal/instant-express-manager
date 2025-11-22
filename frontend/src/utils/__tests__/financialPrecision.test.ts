/**
 * Tests for financial precision utilities
 */

import { describe, it, expect } from 'vitest';
import {
  roundToCurrency,
  addCurrency,
  subtractCurrency,
  multiplyCurrency,
  sumCurrency,
  areCurrencyValuesEqual,
  formatCurrency,
} from '../financialPrecision';

describe('financialPrecision', () => {
  describe('roundToCurrency', () => {
    it('should round to two decimal places', () => {
      expect(roundToCurrency(10.123)).toBe(10.12);
      expect(roundToCurrency(10.126)).toBe(10.13);
      expect(roundToCurrency(10.125)).toBe(10.13);
      expect(roundToCurrency(10.1)).toBe(10.1);
      expect(roundToCurrency(10)).toBe(10);
    });

    it('should handle negative numbers', () => {
      expect(roundToCurrency(-10.123)).toBe(-10.12);
      expect(roundToCurrency(-10.126)).toBe(-10.13);
    });

    it('should handle zero', () => {
      expect(roundToCurrency(0)).toBe(0);
      expect(roundToCurrency(0.0)).toBe(0);
    });

    it('should handle very small numbers', () => {
      expect(roundToCurrency(0.001)).toBe(0);
      expect(roundToCurrency(0.005)).toBe(0.01);
    });

    it('should handle very large numbers', () => {
      expect(roundToCurrency(999999.999)).toBe(1000000);
      expect(roundToCurrency(1234567.89)).toBe(1234567.89);
    });
  });

  describe('addCurrency', () => {
    it('should add two numbers with precision', () => {
      expect(addCurrency(10.5, 20.3)).toBe(30.8);
      expect(addCurrency(10.55, 20.45)).toBe(31);
      expect(addCurrency(0.1, 0.2)).toBe(0.3);
    });

    it('should handle floating point precision issues', () => {
      expect(addCurrency(0.1, 0.2)).toBe(0.3);
      expect(addCurrency(0.01, 0.02)).toBe(0.03);
    });

    it('should handle negative numbers', () => {
      expect(addCurrency(-10, 20)).toBe(10);
      expect(addCurrency(10, -20)).toBe(-10);
      expect(addCurrency(-10, -20)).toBe(-30);
    });
  });

  describe('subtractCurrency', () => {
    it('should subtract two numbers with precision', () => {
      expect(subtractCurrency(20.5, 10.3)).toBe(10.2);
      expect(subtractCurrency(20.55, 10.45)).toBe(10.1);
      expect(subtractCurrency(0.3, 0.1)).toBe(0.2);
    });

    it('should handle floating point precision issues', () => {
      expect(subtractCurrency(0.3, 0.1)).toBe(0.2);
      expect(subtractCurrency(0.03, 0.01)).toBe(0.02);
    });

    it('should handle negative results', () => {
      expect(subtractCurrency(10, 20)).toBe(-10);
      expect(subtractCurrency(-10, 20)).toBe(-30);
    });
  });

  describe('multiplyCurrency', () => {
    it('should multiply two numbers with precision', () => {
      expect(multiplyCurrency(10.5, 2)).toBe(21);
      expect(multiplyCurrency(10.25, 2.5)).toBe(25.63);
      expect(multiplyCurrency(0.1, 0.2)).toBe(0.02);
    });

    it('should handle zero', () => {
      expect(multiplyCurrency(10, 0)).toBe(0);
      expect(multiplyCurrency(0, 10)).toBe(0);
    });

    it('should handle negative numbers', () => {
      expect(multiplyCurrency(-10, 2)).toBe(-20);
      expect(multiplyCurrency(10, -2)).toBe(-20);
      expect(multiplyCurrency(-10, -2)).toBe(20);
    });
  });

  describe('areCurrencyValuesEqual', () => {
    it('should return true for equal values within tolerance', () => {
      expect(areCurrencyValuesEqual(10.0, 10.0)).toBe(true);
      expect(areCurrencyValuesEqual(10.0, 10.005)).toBe(true);
      expect(areCurrencyValuesEqual(10.0, 9.995)).toBe(true);
    });

    it('should return false for values outside tolerance', () => {
      expect(areCurrencyValuesEqual(10.0, 10.02)).toBe(false);
      expect(areCurrencyValuesEqual(10.0, 9.98)).toBe(false);
    });

    it('should use custom tolerance', () => {
      expect(areCurrencyValuesEqual(10.0, 10.05, 0.1)).toBe(true);
      expect(areCurrencyValuesEqual(10.0, 10.05, 0.01)).toBe(false);
    });
  });

  describe('formatCurrency', () => {
    it('should format currency in INR by default', () => {
      const formatted = formatCurrency(1234.56);
      expect(formatted).toContain('1,234.56');
      expect(formatted).toContain('₹');
    });

    it('should handle negative values', () => {
      const formatted = formatCurrency(-1234.56);
      expect(formatted).toContain('-');
    });

    it('should round to two decimal places', () => {
      const formatted = formatCurrency(1234.567);
      expect(formatted).toContain('1,234.57');
    });
  });

  describe('sumCurrency', () => {
    it('should sum an array of numbers with precision', () => {
      expect(sumCurrency([10, 20, 30])).toBe(60);
      expect(sumCurrency([10.5, 20.3, 30.2])).toBe(61);
      expect(sumCurrency([0.1, 0.2, 0.3])).toBe(0.6);
    });

    it('should handle empty array', () => {
      expect(sumCurrency([])).toBe(0);
    });

    it('should handle single number', () => {
      expect(sumCurrency([10.5])).toBe(10.5);
    });

    it('should handle floating point precision issues', () => {
      expect(sumCurrency([0.1, 0.2, 0.3])).toBe(0.6);
      expect(sumCurrency([0.01, 0.02, 0.03])).toBe(0.06);
    });

    it('should handle negative numbers', () => {
      expect(sumCurrency([10, -20, 30])).toBe(20);
      expect(sumCurrency([-10, -20, -30])).toBe(-60);
    });

    it('should handle large arrays', () => {
      const largeArray = Array.from({ length: 100 }, (_, i) => 0.01);
      expect(sumCurrency(largeArray)).toBe(1);
    });
  });
});

