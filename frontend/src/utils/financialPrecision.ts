/**
 * Financial Precision Utilities
 * Handles floating-point precision issues in financial calculations
 */

/**
 * Round a number to 2 decimal places (for currency)
 * Uses proper rounding to avoid floating-point precision issues
 */
export function roundToCurrency(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Add two currency values with proper precision
 */
export function addCurrency(a: number, b: number): number {
  return roundToCurrency(a + b);
}

/**
 * Subtract two currency values with proper precision
 */
export function subtractCurrency(a: number, b: number): number {
  return roundToCurrency(a - b);
}

/**
 * Multiply a currency value by a number with proper precision
 */
export function multiplyCurrency(value: number, multiplier: number): number {
  return roundToCurrency(value * multiplier);
}

/**
 * Sum an array of currency values with proper precision
 */
export function sumCurrency(values: number[]): number {
  // Use integer arithmetic to avoid floating-point errors
  const totalCents = values.reduce((sum, value) => sum + Math.round(value * 100), 0);
  return totalCents / 100;
}

/**
 * Check if two currency values are equal (within 0.01 tolerance)
 */
export function areCurrencyValuesEqual(a: number, b: number, tolerance: number = 0.01): boolean {
  return Math.abs(a - b) < tolerance;
}

/**
 * Format a number as currency string (for display)
 */
export function formatCurrency(value: number, currency: string = 'INR'): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(roundToCurrency(value));
}

