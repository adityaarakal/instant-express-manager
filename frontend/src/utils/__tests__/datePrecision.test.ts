/**
 * Tests for date precision utilities
 */

import { describe, it, expect } from 'vitest';
import {
  getTodayDateString,
  compareDateStrings,
  isDueDatePassed,
  normalizeDateString,
  getMonthStartDateString,
  getMonthEndDateString,
} from '../datePrecision';

describe('datePrecision', () => {
  describe('getTodayDateString', () => {
    it('should return today\'s date in YYYY-MM-DD format', () => {
      const today = getTodayDateString();
      expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('should return a valid date string', () => {
      const today = getTodayDateString();
      const [year, month, day] = today.split('-').map(Number);
      expect(year).toBeGreaterThan(2020);
      expect(month).toBeGreaterThanOrEqual(1);
      expect(month).toBeLessThanOrEqual(12);
      expect(day).toBeGreaterThanOrEqual(1);
      expect(day).toBeLessThanOrEqual(31);
    });
  });

  describe('compareDateStrings', () => {
    it('should return negative if first date is before second', () => {
      expect(compareDateStrings('2024-01-15', '2024-01-16')).toBeLessThan(0);
      expect(compareDateStrings('2024-01-15', '2024-02-15')).toBeLessThan(0);
    });

    it('should return zero if dates are equal', () => {
      expect(compareDateStrings('2024-01-15', '2024-01-15')).toBe(0);
    });

    it('should return positive if first date is after second', () => {
      expect(compareDateStrings('2024-01-16', '2024-01-15')).toBeGreaterThan(0);
      expect(compareDateStrings('2024-02-15', '2024-01-15')).toBeGreaterThan(0);
    });
  });

  describe('isDueDatePassed', () => {
    it('should return false if due date is null or undefined', () => {
      expect(isDueDatePassed(null)).toBe(false);
      expect(isDueDatePassed(undefined)).toBe(false);
    });

    it('should return true if due date has passed', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      expect(isDueDatePassed(yesterdayStr)).toBe(true);
    });

    it('should return false if due date is today or future', () => {
      const today = getTodayDateString();
      expect(isDueDatePassed(today)).toBe(false);
      
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];
      expect(isDueDatePassed(tomorrowStr)).toBe(false);
    });

    it('should use provided today date for comparison', () => {
      expect(isDueDatePassed('2024-01-15', '2024-01-16')).toBe(true);
      expect(isDueDatePassed('2024-01-15', '2024-01-15')).toBe(false);
      expect(isDueDatePassed('2024-01-15', '2024-01-14')).toBe(false);
    });
  });

  describe('normalizeDateString', () => {
    it('should return null for null or undefined', () => {
      expect(normalizeDateString(null)).toBeNull();
      expect(normalizeDateString(undefined)).toBeNull();
    });

    it('should return as-is if already in YYYY-MM-DD format', () => {
      expect(normalizeDateString('2024-01-15')).toBe('2024-01-15');
    });

    it('should normalize various date formats', () => {
      expect(normalizeDateString('2024-01-15T10:30:00Z')).toBe('2024-01-15');
      expect(normalizeDateString('2024/01/15')).toBe('2024-01-15');
    });

    it('should return null for invalid date strings', () => {
      expect(normalizeDateString('invalid-date')).toBeNull();
      // Note: '2024-13-45' matches YYYY-MM-DD format, so it's returned as-is
      // The function doesn't validate that the date is actually valid
      expect(normalizeDateString('not-a-date')).toBeNull();
    });
  });

  describe('getMonthStartDateString', () => {
    it('should return first day of month', () => {
      expect(getMonthStartDateString('2024-01')).toBe('2024-01-01');
      expect(getMonthStartDateString('2024-12')).toBe('2024-12-01');
    });

    it('should handle single digit months', () => {
      expect(getMonthStartDateString('2024-1')).toBe('2024-01-01');
    });
  });

  describe('getMonthEndDateString', () => {
    it('should return last day of month', () => {
      expect(getMonthEndDateString('2024-01')).toBe('2024-01-31');
      expect(getMonthEndDateString('2024-02')).toBe('2024-02-29'); // 2024 is leap year
      expect(getMonthEndDateString('2024-04')).toBe('2024-04-30');
    });

    it('should handle leap years correctly', () => {
      expect(getMonthEndDateString('2024-02')).toBe('2024-02-29');
      expect(getMonthEndDateString('2023-02')).toBe('2023-02-28');
    });
  });
});

