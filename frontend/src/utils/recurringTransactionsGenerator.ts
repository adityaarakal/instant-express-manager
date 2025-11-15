/**
 * Utility functions for generating recurring transactions upfront
 */

import type { RecurringIncome, RecurringExpense, RecurringSavingsInvestment } from '../types/recurring';

/**
 * Get the day of month from a date string or template
 */
export function getDayOfMonth(dateOrTemplate: string | RecurringIncome | RecurringExpense | RecurringSavingsInvestment): number {
  if (typeof dateOrTemplate === 'string') {
    return new Date(dateOrTemplate).getDate();
  }
  
  // Use dayOfMonth if set, otherwise try deductionDate, otherwise use startDate
  if (dateOrTemplate.dayOfMonth) {
    return dateOrTemplate.dayOfMonth;
  }
  
  if (dateOrTemplate.deductionDate) {
    return new Date(dateOrTemplate.deductionDate).getDate();
  }
  
  return new Date(dateOrTemplate.startDate).getDate();
}

/**
 * Generate all transaction dates for a recurring template
 * Returns an array of ISO date strings for all transactions in the recurring period
 */
export function generateRecurringTransactionDates(
  template: RecurringIncome | RecurringExpense | RecurringSavingsInvestment
): string[] {
  const dates: string[] = [];
  const dayOfMonth = getDayOfMonth(template);
  
  // Start from startDate
  const startDate = new Date(template.startDate);
  const endDate = template.endDate ? new Date(template.endDate) : null;
  
  // Set the day of month for the first date
  let currentDate = new Date(startDate);
  currentDate.setDate(dayOfMonth);
  
  // If the first date is before startDate, move to next month
  if (currentDate < startDate) {
    currentDate.setMonth(currentDate.getMonth() + 1);
  }
  
  // Generate dates based on frequency until endDate (or 12 months if no endDate)
  const maxIterations = endDate ? 1000 : 12; // Safety limit
  let iterations = 0;
  
  while (iterations < maxIterations) {
    // Check if we've passed the end date
    if (endDate && currentDate > endDate) {
      break;
    }
    
    dates.push(currentDate.toISOString().split('T')[0]);
    
    // Calculate next date based on frequency
    switch (template.frequency) {
      case 'Monthly': {
        currentDate = new Date(currentDate);
        currentDate.setMonth(currentDate.getMonth() + 1);
        // Ensure day of month is maintained (handle month-end cases)
        const nextDayOfMonth = Math.min(dayOfMonth, new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate());
        currentDate.setDate(nextDayOfMonth);
        break;
      }
      case 'Quarterly': {
        currentDate = new Date(currentDate);
        currentDate.setMonth(currentDate.getMonth() + 3);
        const nextQuarterDayOfMonth = Math.min(dayOfMonth, new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate());
        currentDate.setDate(nextQuarterDayOfMonth);
        break;
      }
      case 'Weekly': {
        currentDate = new Date(currentDate);
        currentDate.setDate(currentDate.getDate() + 7);
        break;
      }
      case 'Yearly': {
        currentDate = new Date(currentDate);
        currentDate.setFullYear(currentDate.getFullYear() + 1);
        const nextYearDayOfMonth = Math.min(dayOfMonth, new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate());
        currentDate.setDate(nextYearDayOfMonth);
        break;
      }
      default: {
        // Default to monthly
        currentDate = new Date(currentDate);
        currentDate.setMonth(currentDate.getMonth() + 1);
        const defaultDayOfMonth = Math.min(dayOfMonth, new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate());
        currentDate.setDate(defaultDayOfMonth);
        break;
      }
    }
    
    iterations++;
  }
  
  return dates;
}

