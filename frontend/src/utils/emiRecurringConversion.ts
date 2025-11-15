/**
 * Utility functions for converting between EMIs and Recurring Templates
 */

import type { ExpenseEMI, SavingsInvestmentEMI } from '../types/emis';
import type { RecurringExpense, RecurringSavingsInvestment } from '../types/recurring';

/**
 * Calculate next due date for recurring template based on EMI
 * Uses deductionDate if set, otherwise calculates from installments
 */
function calculateNextDueDateFromEMI(emi: ExpenseEMI | SavingsInvestmentEMI): string {
  // If deductionDate is set, use it
  if (emi.deductionDate) {
    return emi.deductionDate;
  }
  
  const startDate = new Date(emi.startDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // If start date is in the future, use it
  if (startDate > today) {
    return emi.startDate;
  }
  
  // Calculate next due date based on frequency and completed installments
  const monthsToAdd = emi.frequency === 'Monthly' ? 1 : 3;
  const nextDate = new Date(startDate);
  nextDate.setMonth(nextDate.getMonth() + (emi.completedInstallments * (emi.frequency === 'Monthly' ? 1 : 3)) + monthsToAdd);
  
  return nextDate.toISOString().split('T')[0];
}

/**
 * Calculate total installments from start and end dates
 */
function calculateTotalInstallments(
  startDate: string,
  endDate: string,
  frequency: 'Monthly' | 'Quarterly' | 'Weekly' | 'Yearly' | 'Custom'
): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  let months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
  
  // Adjust for day of month
  if (end.getDate() < start.getDate()) {
    months--;
  }
  
  switch (frequency) {
    case 'Monthly':
      return months;
    case 'Quarterly':
      return Math.ceil(months / 3);
    case 'Weekly': {
      const weeks = Math.ceil((end.getTime() - start.getTime()) / (7 * 24 * 60 * 60 * 1000));
      return weeks;
    }
    case 'Yearly':
      return Math.ceil(months / 12);
    default:
      return months; // Default to monthly
  }
}

/**
 * Convert ExpenseEMI to RecurringExpense
 */
export function convertExpenseEMIToRecurring(emi: ExpenseEMI): Omit<RecurringExpense, 'id' | 'createdAt' | 'updatedAt' | 'nextDueDate'> {
  return {
    name: emi.name,
    amount: emi.amount,
    accountId: emi.accountId,
    category: emi.category === 'CCEMI' ? 'CCBill' : emi.category === 'Loan' ? 'Other' : 'Other',
    bucket: 'CCBill', // Default, user can change
    frequency: 'Monthly' as 'Monthly' | 'Weekly' | 'Yearly' | 'Custom',
    startDate: emi.startDate,
    endDate: emi.endDate, // Keep end date, but it's now optional
    status: emi.status === 'Active' ? 'Active' : emi.status === 'Paused' ? 'Paused' : 'Completed',
    notes: emi.notes,
  };
}

/**
 * Convert SavingsInvestmentEMI to RecurringSavingsInvestment
 */
export function convertSavingsEMIToRecurring(emi: SavingsInvestmentEMI): Omit<RecurringSavingsInvestment, 'id' | 'createdAt' | 'updatedAt' | 'nextDueDate'> {
  return {
    name: emi.name,
    amount: emi.amount,
    accountId: emi.accountId,
    destination: emi.destination,
    type: 'SIP', // Default to SIP
    frequency: (emi.frequency === 'Monthly' ? 'Monthly' : emi.frequency === 'Quarterly' ? 'Quarterly' : 'Monthly') as 'Monthly' | 'Quarterly' | 'Yearly',
    startDate: emi.startDate,
    endDate: emi.endDate, // Keep end date, but it's now optional
    status: emi.status === 'Active' ? 'Active' : emi.status === 'Paused' ? 'Paused' : 'Completed',
    notes: emi.notes,
  };
}

/**
 * Convert RecurringExpense to ExpenseEMI
 */
export function convertRecurringExpenseToEMI(template: RecurringExpense): Omit<ExpenseEMI, 'id' | 'createdAt' | 'updatedAt' | 'completedInstallments'> {
  // Calculate total installments from dates
  const endDate = template.endDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // Default to 1 year if no end date
  const totalInstallments = calculateTotalInstallments(template.startDate, endDate, template.frequency);
  
  // Map frequency - Recurring has more options, EMI only has Monthly/Quarterly
  let emiFrequency: 'Monthly' | 'Quarterly' = 'Monthly';
  if (template.frequency === 'Monthly') {
    emiFrequency = 'Monthly';
  } else {
    // For Weekly, Yearly, Custom - default to Monthly for EMI
    emiFrequency = 'Monthly';
  }
  
  // Map category
  let emiCategory: 'CCEMI' | 'Loan' | 'Other' = 'Other';
  if (template.category === 'CCBill') {
    emiCategory = 'CCEMI';
  } else if (template.category === 'Other') {
    emiCategory = 'Other';
  } else {
    emiCategory = 'Other';
  }
  
  return {
    name: template.name,
    startDate: template.startDate,
    endDate: endDate, // Required for EMI
    amount: template.amount,
    accountId: template.accountId,
    category: emiCategory,
    frequency: emiFrequency,
    totalInstallments: Math.max(1, totalInstallments), // Ensure at least 1
    status: template.status === 'Active' ? 'Active' : template.status === 'Paused' ? 'Paused' : 'Completed',
    notes: template.notes,
  };
}

/**
 * Convert RecurringSavingsInvestment to SavingsInvestmentEMI
 */
export function convertRecurringSavingsToEMI(template: RecurringSavingsInvestment): Omit<SavingsInvestmentEMI, 'id' | 'createdAt' | 'updatedAt' | 'completedInstallments'> {
  // Calculate total installments from dates
  const endDate = template.endDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // Default to 1 year if no end date
  const totalInstallments = calculateTotalInstallments(template.startDate, endDate, template.frequency);
  
  // Map frequency - Recurring has Monthly/Quarterly/Yearly, EMI only has Monthly/Quarterly
  let emiFrequency: 'Monthly' | 'Quarterly' = 'Monthly';
  if (template.frequency === 'Quarterly') {
    emiFrequency = 'Quarterly';
  } else if (template.frequency === 'Yearly') {
    emiFrequency = 'Quarterly'; // Yearly becomes Quarterly for EMI
  } else {
    emiFrequency = 'Monthly';
  }
  
  return {
    name: template.name,
    startDate: template.startDate,
    endDate: endDate, // Required for EMI
    amount: template.amount,
    accountId: template.accountId,
    destination: template.destination,
    frequency: emiFrequency,
    totalInstallments: Math.max(1, totalInstallments), // Ensure at least 1
    status: template.status === 'Active' ? 'Active' : template.status === 'Paused' ? 'Paused' : 'Completed',
    notes: template.notes,
  };
}

/**
 * Get next due date for recurring template from EMI
 */
export function getNextDueDateFromEMI(emi: ExpenseEMI | SavingsInvestmentEMI): string {
  return calculateNextDueDateFromEMI(emi);
}

