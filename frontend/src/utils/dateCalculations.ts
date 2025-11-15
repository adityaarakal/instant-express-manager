/**
 * Utility functions for calculating dates for EMIs and Recurring Templates
 */

import type { ExpenseEMI, SavingsInvestmentEMI } from '../types/emis';
import type { RecurringExpense, RecurringIncome, RecurringSavingsInvestment } from '../types/recurring';

/**
 * Calculate next due date for EMI based on start date and completed installments
 */
export function calculateEMINextDueDate(
  startDate: string,
  frequency: ExpenseEMI['frequency'] | SavingsInvestmentEMI['frequency'],
  completedInstallments: number
): string {
  const start = new Date(startDate);
  const monthsToAdd = frequency === 'Monthly' ? 1 : 3;
  const nextDate = new Date(start);
  nextDate.setMonth(nextDate.getMonth() + (completedInstallments * (frequency === 'Monthly' ? 1 : 3)) + monthsToAdd);
  return nextDate.toISOString().split('T')[0];
}

/**
 * Calculate next date from a given date based on frequency
 */
export function calculateNextDateFromDate(
  date: string,
  frequency: ExpenseEMI['frequency'] | SavingsInvestmentEMI['frequency'] | RecurringExpense['frequency'] | RecurringIncome['frequency'] | RecurringSavingsInvestment['frequency']
): string {
  const d = new Date(date);
  
  switch (frequency) {
    case 'Monthly':
      d.setMonth(d.getMonth() + 1);
      break;
    case 'Quarterly':
      d.setMonth(d.getMonth() + 3);
      break;
    case 'Weekly':
      d.setDate(d.getDate() + 7);
      break;
    case 'Yearly':
      d.setFullYear(d.getFullYear() + 1);
      break;
    default:
      d.setMonth(d.getMonth() + 1); // Default to monthly
  }
  
  return d.toISOString().split('T')[0];
}

/**
 * Calculate date offset (difference in days)
 */
export function calculateDateOffset(oldDate: string, newDate: string): number {
  const old = new Date(oldDate);
  const new_ = new Date(newDate);
  const diffTime = new_.getTime() - old.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Add days to a date
 */
export function addDaysToDate(date: string, days: number): string {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

/**
 * Get effective deduction date for EMI
 * Uses deductionDate if set, otherwise calculates from installments
 */
export function getEffectiveEMIDeductionDate(emi: ExpenseEMI | SavingsInvestmentEMI): string {
  if (emi.deductionDate) {
    return emi.deductionDate;
  }
  return calculateEMINextDueDate(emi.startDate, emi.frequency, emi.completedInstallments);
}

/**
 * Get effective deduction date for Recurring Template
 * Uses deductionDate if set, otherwise uses nextDueDate
 */
export function getEffectiveRecurringDeductionDate(
  template: RecurringExpense | RecurringIncome | RecurringSavingsInvestment
): string {
  if (template.deductionDate) {
    return template.deductionDate;
  }
  return template.nextDueDate;
}

