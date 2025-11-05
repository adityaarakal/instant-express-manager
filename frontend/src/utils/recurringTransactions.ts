// Utility functions for handling recurring transactions

export type RecurrenceType = 'weekly' | 'monthly' | 'yearly'

/**
 * Calculate the next occurrence date based on recurrence type and interval
 */
export const calculateNextOccurrence = (
  currentDate: string,
  recurrenceType: RecurrenceType,
  interval: number = 1
): string => {
  const date = new Date(currentDate)
  
  switch (recurrenceType) {
    case 'weekly':
      date.setDate(date.getDate() + (7 * interval))
      break
    case 'monthly':
      date.setMonth(date.getMonth() + interval)
      break
    case 'yearly':
      date.setFullYear(date.getFullYear() + interval)
      break
  }
  
  return date.toISOString()
}

/**
 * Generate all occurrences up to a target date (e.g., 1 year ahead)
 */
export const generateRecurringOccurrences = (
  startDate: string,
  recurrenceType: RecurrenceType,
  interval: number = 1,
  endDate?: string,
  maxOccurrences: number = 100
): string[] => {
  const occurrences: string[] = []
  let currentDate = new Date(startDate)
  const targetDate = endDate ? new Date(endDate) : new Date()
  targetDate.setFullYear(targetDate.getFullYear() + 1) // Default to 1 year ahead
  
  let count = 0
  
  while (currentDate <= targetDate && count < maxOccurrences) {
    occurrences.push(currentDate.toISOString())
    
    // Calculate next occurrence
    switch (recurrenceType) {
      case 'weekly':
        currentDate = new Date(currentDate.setDate(currentDate.getDate() + (7 * interval)))
        break
      case 'monthly':
        currentDate = new Date(currentDate.setMonth(currentDate.getMonth() + interval))
        break
      case 'yearly':
        currentDate = new Date(currentDate.setFullYear(currentDate.getFullYear() + interval))
        break
    }
    
    count++
  }
  
  return occurrences
}

/**
 * Check if a date is past due for a recurring transaction
 */
export const isRecurrenceDue = (nextOccurrence: string): boolean => {
  const nextDate = new Date(nextOccurrence)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  nextDate.setHours(0, 0, 0, 0)
  return nextDate <= today
}

