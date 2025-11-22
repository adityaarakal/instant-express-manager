/**
 * Date Precision Utilities
 * 
 * Handles timezone and date precision issues in financial calculations.
 * All date operations use these utilities to ensure consistent date handling.
 * 
 * @module datePrecision
 */

/**
 * Gets today's date in a consistent format (YYYY-MM-DD) without time component.
 * This ensures consistent date comparisons regardless of timezone.
 * 
 * @returns {string} Today's date in YYYY-MM-DD format
 * 
 * @example
 * const today = getTodayDateString(); // Returns "2025-01-20"
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
 * Compares two date strings (YYYY-MM-DD format).
 * 
 * @param {string} date1 - First date string
 * @param {string} date2 - Second date string
 * @returns {number} Negative if date1 < date2, 0 if equal, positive if date1 > date2
 * 
 * @example
 * compareDateStrings('2025-01-15', '2025-01-20'); // Returns negative
 * compareDateStrings('2025-01-20', '2025-01-20'); // Returns 0
 * compareDateStrings('2025-01-25', '2025-01-20'); // Returns positive
 */
export function compareDateStrings(date1: string, date2: string): number {
  return date1.localeCompare(date2);
}

/**
 * Checks if a due date has passed (using date-only comparison, ignoring time).
 * 
 * @param {string | null | undefined} dueDate - ISO date string (YYYY-MM-DD)
 * @param {string} [today] - Optional today's date (defaults to current date)
 * @returns {boolean} True if due date has passed, false otherwise
 * 
 * @example
 * isDueDatePassed('2025-01-15'); // Returns true if today is after 2025-01-15
 * isDueDatePassed('2025-12-31'); // Returns false if today is before 2025-12-31
 */
export function isDueDatePassed(dueDate: string | null | undefined, today?: string): boolean {
  if (!dueDate) {
    return false;
  }

  const todayDate = today || getTodayDateString();
  return compareDateStrings(dueDate, todayDate) < 0;
}

/**
 * Normalizes a date string to YYYY-MM-DD format.
 * Handles various date formats and timezone issues.
 * 
 * @param {string | null | undefined} dateString - Date string in various formats
 * @returns {string | null} Normalized date string in YYYY-MM-DD format, or null if invalid
 * 
 * @example
 * normalizeDateString('2025-01-20'); // Returns "2025-01-20"
 * normalizeDateString('01/20/2025'); // Returns "2025-01-20"
 * normalizeDateString('invalid'); // Returns null
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
 * Gets start of month date string (YYYY-MM-01).
 * 
 * @param {string} monthId - Month ID in format "YYYY-MM"
 * @returns {string} First day of month in YYYY-MM-DD format
 * 
 * @example
 * getMonthStartDateString('2025-01'); // Returns "2025-01-01"
 */
export function getMonthStartDateString(monthId: string): string {
  const [year, month] = monthId.split('-').map(Number);
  return `${year}-${String(month).padStart(2, '0')}-01`;
}

/**
 * Gets end of month date string (YYYY-MM-DD where DD is last day of month).
 * 
 * @param {string} monthId - Month ID in format "YYYY-MM"
 * @returns {string} Last day of month in YYYY-MM-DD format
 * 
 * @example
 * getMonthEndDateString('2025-01'); // Returns "2025-01-31"
 * getMonthEndDateString('2025-02'); // Returns "2025-02-28"
 */
export function getMonthEndDateString(monthId: string): string {
  const [year, month] = monthId.split('-').map(Number);
  const lastDay = new Date(year, month, 0).getDate();
  return `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
}

