/**
 * Financial Precision Utilities
 * 
 * Handles floating-point precision issues in financial calculations.
 * All currency operations use these utilities to ensure accurate calculations
 * and avoid common floating-point arithmetic errors.
 * 
 * @module financialPrecision
 */

/**
 * Rounds a number to 2 decimal places (for currency).
 * Uses proper rounding to avoid floating-point precision issues.
 * 
 * @param {number} value - The number to round
 * @returns {number} The rounded value to 2 decimal places
 * 
 * @example
 * roundToCurrency(10.999); // Returns 11.00
 * roundToCurrency(10.994); // Returns 10.99
 * roundToCurrency(10.995); // Returns 11.00 (rounds up)
 */
export function roundToCurrency(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Adds two currency values with proper precision.
 * Prevents floating-point errors like 0.1 + 0.2 = 0.30000000000000004
 * 
 * @param {number} a - First currency value
 * @param {number} b - Second currency value
 * @returns {number} The sum with proper precision (rounded to 2 decimal places)
 * 
 * @example
 * addCurrency(10.1, 0.2); // Returns 10.3 (not 10.300000000000001)
 * addCurrency(100.50, 50.25); // Returns 150.75
 */
export function addCurrency(a: number, b: number): number {
  return roundToCurrency(a + b);
}

/**
 * Subtracts two currency values with proper precision.
 * 
 * @param {number} a - Minuend (value to subtract from)
 * @param {number} b - Subtrahend (value to subtract)
 * @returns {number} The difference with proper precision (rounded to 2 decimal places)
 * 
 * @example
 * subtractCurrency(10.5, 0.3); // Returns 10.2
 * subtractCurrency(100.00, 50.50); // Returns 49.50
 */
export function subtractCurrency(a: number, b: number): number {
  return roundToCurrency(a - b);
}

/**
 * Multiplies a currency value by a number with proper precision.
 * 
 * @param {number} value - Currency value to multiply
 * @param {number} multiplier - Multiplier
 * @returns {number} The product with proper precision (rounded to 2 decimal places)
 * 
 * @example
 * multiplyCurrency(10.50, 2); // Returns 21.00
 * multiplyCurrency(100.33, 1.5); // Returns 150.50
 */
export function multiplyCurrency(value: number, multiplier: number): number {
  return roundToCurrency(value * multiplier);
}

/**
 * Sums an array of currency values with proper precision.
 * Uses integer arithmetic internally to avoid floating-point errors.
 * 
 * @param {number[]} values - Array of currency values to sum
 * @returns {number} The sum with proper precision (rounded to 2 decimal places)
 * 
 * @example
 * sumCurrency([10.1, 0.2, 5.3]); // Returns 15.6
 * sumCurrency([100.50, 50.25, 25.75]); // Returns 176.50
 */
export function sumCurrency(values: number[]): number {
  // Use integer arithmetic to avoid floating-point errors
  const totalCents = values.reduce((sum, value) => sum + Math.round(value * 100), 0);
  return totalCents / 100;
}

/**
 * Checks if two currency values are equal within a tolerance.
 * Useful for comparing calculated values that may have minor floating-point differences.
 * 
 * @param {number} a - First value to compare
 * @param {number} b - Second value to compare
 * @param {number} [tolerance=0.01] - Tolerance for comparison (default: 0.01)
 * @returns {boolean} True if values are equal within tolerance, false otherwise
 * 
 * @example
 * areCurrencyValuesEqual(10.0, 10.001); // Returns true (within 0.01 tolerance)
 * areCurrencyValuesEqual(10.0, 10.02); // Returns false (exceeds tolerance)
 */
export function areCurrencyValuesEqual(a: number, b: number, tolerance: number = 0.01): boolean {
  return Math.abs(a - b) < tolerance;
}

/**
 * Formats a number as a currency string for display.
 * Uses Intl.NumberFormat for locale-aware formatting.
 * 
 * @param {number} value - Currency value to format
 * @param {string} [currency='INR'] - Currency code (default: 'INR')
 * @returns {string} Formatted currency string
 * 
 * @example
 * formatCurrency(1000.50); // Returns "₹1,000.50"
 * formatCurrency(1000.50, 'USD'); // Returns "$1,000.50"
 */
export function formatCurrency(value: number, currency: string = 'INR'): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(roundToCurrency(value));
}

