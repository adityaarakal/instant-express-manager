/**
 * Date Precision Utilities
 * Handles timezone and date precision issues in financial calculations
 */

/**
 * Get today's date in a consistent format (YYYY-MM-DD) without time component
 * This ensures consistent date comparisons regardless of timezone
 */
export function getTodayDateString(): string {
  const now = new Date();
  // Use local date components to avoid timezone issues
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Compare two date strings (YYYY-MM-DD format)
 * Returns:
 * - negative if date1 < date2
 * - 0 if date1 === date2
 * - positive if date1 > date2
 */
export function compareDateStrings(date1: string, date2: string): number {
  return date1.localeCompare(date2);
}

/**
 * Check if a due date has passed (using date-only comparison, ignoring time)
 * @param dueDate - ISO date string (YYYY-MM-DD)
 * @param today - Optional today's date (defaults to current date)
 * @returns true if due date has passed
 */
export function isDueDatePassed(dueDate: string | null | undefined, today?: string): boolean {
  if (!dueDate) {
    return false;
  }

  const todayDate = today || getTodayDateString();
  return compareDateStrings(dueDate, todayDate) < 0;
}

/**
 * Normalize a date string to YYYY-MM-DD format
 * Handles various date formats and timezone issues
 */
export function normalizeDateString(dateString: string | null | undefined): string | null {
  if (!dateString) {
    return null;
  }

  try {
    // If already in YYYY-MM-DD format, return as-is
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      return dateString;
    }

    // Parse and normalize
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) {
      return null;
    }

    // Use local date components to avoid timezone issues
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch {
    return null;
  }
}

/**
 * Get start of month date string (YYYY-MM-01)
 */
export function getMonthStartDateString(monthId: string): string {
  const [year, month] = monthId.split('-').map(Number);
  return `${year}-${String(month).padStart(2, '0')}-01`;
}

/**
 * Get end of month date string (YYYY-MM-DD where DD is last day of month)
 */
export function getMonthEndDateString(monthId: string): string {
  const [year, month] = monthId.split('-').map(Number);
  const lastDay = new Date(year, month, 0).getDate();
  return `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
}

