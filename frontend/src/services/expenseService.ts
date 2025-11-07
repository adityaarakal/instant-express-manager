// LocalStorage-based expense service (no backend required)

import { calculateNextOccurrence, generateRecurringOccurrences, RecurrenceType } from '../utils/recurringTransactions'

const STORAGE_KEY = 'expense-manager-expenses'
const RECURRING_TEMPLATE_KEY = 'expense-manager-recurring-templates'

export interface Expense {
  id: string
  userId: string
  title: string
  description?: string
  amount: number
  category: 'food' | 'transport' | 'shopping' | 'bills' | 'entertainment' | 'health' | 'education' | 'travel' | 'other'
  paymentMethod: 'cash' | 'card' | 'digital_wallet' | 'bank_transfer' | 'other'
  date: string
  tags?: string[]
  receiptUrl?: string
  location?: string
  createdAt: string
  updatedAt: string
  // Payment status
  paymentStatus: 'paid' | 'pending'
  // Recurring transaction fields
  isRecurring?: boolean
  recurrenceType?: 'weekly' | 'monthly' | 'yearly'
  recurrenceInterval?: number // e.g., every 2 weeks, every 3 months
  parentTransactionId?: string // ID of the original recurring transaction
  nextOccurrence?: string // Next date when this should occur
  endDate?: string // Optional end date for recurring transactions
}

export interface CreateExpenseRequest {
  userId: string
  title: string
  description?: string
  amount: number
  category: 'food' | 'transport' | 'shopping' | 'bills' | 'entertainment' | 'health' | 'education' | 'travel' | 'other'
  paymentMethod: 'cash' | 'card' | 'digital_wallet' | 'bank_transfer' | 'other'
  date: string
  tags?: string[]
  receiptUrl?: string
  location?: string
  // Payment status
  paymentStatus?: 'paid' | 'pending'
  // Recurring transaction fields
  isRecurring?: boolean
  recurrenceType?: 'weekly' | 'monthly' | 'yearly'
  recurrenceInterval?: number
  endDate?: string
}

export interface ExpenseStats {
  totalExpenses: number
  totalCount: number
  byCategory: Record<string, number>
  byMonth: Array<{ month: string; total: number }>
  thisMonth: number
  lastMonth: number
  averagePerDay: number
}

// Helper functions for localStorage
const getExpensesFromStorage = (): Expense[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    const expenses = stored ? JSON.parse(stored) : []
    // Migrate old expenses without paymentStatus to have 'paid' by default (backward compatibility)
    return expenses.map((exp: Expense) => {
      if (!exp.paymentStatus) {
        exp.paymentStatus = 'paid' // Old expenses default to paid
      }
      return exp
    })
  } catch (error) {
    console.error('Error reading from localStorage:', error)
    return []
  }
}

const saveExpensesToStorage = (expenses: Expense[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses))
  } catch (error) {
    console.error('Error saving to localStorage:', error)
    throw new Error('Failed to save expense. LocalStorage may be full.')
  }
}

const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

// Helper function to generate and save recurring expenses
const generateAndSaveRecurringExpenses = (
  parentExpense: Expense,
  existingExpenses: Expense[],
  recurrenceType: RecurrenceType,
  interval: number,
  endDate?: string
): void => {
  const occurrences = generateRecurringOccurrences(
    parentExpense.date,
    recurrenceType,
    interval,
    endDate,
    100 // Max 100 occurrences
  )
  
  // Skip the first occurrence (already created)
  const futureOccurrences = occurrences.slice(1)
  
  futureOccurrences.forEach(occurrenceDate => {
    // Check if this occurrence already exists (by date and parent ID)
    const exists = existingExpenses.some(
      exp => exp.parentTransactionId === parentExpense.id && 
      new Date(exp.date).toISOString().split('T')[0] === new Date(occurrenceDate).toISOString().split('T')[0]
    )
    
    // Only create if it doesn't exist
    if (!exists) {
      const recurringExpense: Expense = {
        ...parentExpense,
        id: generateId(),
        date: occurrenceDate,
        parentTransactionId: parentExpense.id,
        paymentStatus: 'pending', // Recurring expenses default to pending
        nextOccurrence: calculateNextOccurrence(occurrenceDate, recurrenceType, interval),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      existingExpenses.push(recurringExpense)
    }
  })
  
  saveExpensesToStorage(existingExpenses)
}

// Function to check and generate missing recurring transactions
export const checkAndGenerateRecurringExpenses = (): void => {
  try {
    const expenses = getExpensesFromStorage()
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    
    // Find all parent recurring transactions (those without parentTransactionId)
    const recurringParents = expenses.filter(
      exp => exp.isRecurring && !exp.parentTransactionId && (!exp.endDate || new Date(exp.endDate) >= now)
    )
    
    recurringParents.forEach(parent => {
      if (!parent.recurrenceType) return
      
      // Find the last occurrence for this parent
      const relatedExpenses = expenses.filter(
        exp => exp.parentTransactionId === parent.id || exp.id === parent.id
      )
      const lastOccurrence = relatedExpenses
        .map(exp => new Date(exp.date))
        .sort((a, b) => b.getTime() - a.getTime())[0]
      
      if (!lastOccurrence) return
      
      // Check if we need to generate more occurrences
      const nextExpected = calculateNextOccurrence(
        lastOccurrence.toISOString(),
        parent.recurrenceType,
        parent.recurrenceInterval || 1
      )
      const nextExpectedDate = new Date(nextExpected)
      nextExpectedDate.setHours(0, 0, 0, 0)
      
      // Generate occurrences up to 3 months ahead
      const threeMonthsAhead = new Date()
      threeMonthsAhead.setMonth(threeMonthsAhead.getMonth() + 3)
      
      if (nextExpectedDate <= threeMonthsAhead) {
        const missingOccurrences: Expense[] = []
        let currentDate = new Date(nextExpected)
        
        while (currentDate <= threeMonthsAhead && missingOccurrences.length < 12) {
          // Check if this occurrence already exists
          const exists = expenses.some(
            exp => exp.parentTransactionId === parent.id && 
            new Date(exp.date).toISOString().split('T')[0] === currentDate.toISOString().split('T')[0]
          )
          
          if (!exists && (!parent.endDate || currentDate <= new Date(parent.endDate))) {
            const newOccurrence: Expense = {
              ...parent,
              id: generateId(),
              date: currentDate.toISOString(),
              parentTransactionId: parent.id,
              paymentStatus: 'pending', // Generated recurring expenses default to pending
              nextOccurrence: calculateNextOccurrence(
                currentDate.toISOString(),
                parent.recurrenceType,
                parent.recurrenceInterval || 1
              ),
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
            missingOccurrences.push(newOccurrence)
          }
          
          // Calculate next occurrence
          switch (parent.recurrenceType) {
            case 'weekly':
              currentDate = new Date(currentDate.setDate(currentDate.getDate() + (7 * (parent.recurrenceInterval || 1))))
              break
            case 'monthly':
              currentDate = new Date(currentDate.setMonth(currentDate.getMonth() + (parent.recurrenceInterval || 1)))
              break
            case 'yearly':
              currentDate = new Date(currentDate.setFullYear(currentDate.getFullYear() + (parent.recurrenceInterval || 1)))
              break
          }
        }
        
        if (missingOccurrences.length > 0) {
          expenses.push(...missingOccurrences)
          saveExpensesToStorage(expenses)
        }
      }
    })
  } catch (error) {
    console.error('Error checking recurring expenses:', error)
  }
}

const filterExpenses = (
  expenses: Expense[],
  userId?: string,
  category?: string,
  startDate?: string,
  endDate?: string
): Expense[] => {
  let filtered = [...expenses]

  if (userId) {
    filtered = filtered.filter(exp => exp.userId === userId)
  }

  if (category) {
    filtered = filtered.filter(exp => exp.category === category)
  }

  if (startDate) {
    const start = new Date(startDate)
    filtered = filtered.filter(exp => new Date(exp.date) >= start)
  }

  if (endDate) {
    const end = new Date(endDate)
    filtered = filtered.filter(exp => new Date(exp.date) <= end)
  }

  return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

const calculateStats = (
  expenses: Expense[],
  userId?: string,
  startDate?: string,
  endDate?: string
): ExpenseStats => {
  let filtered = filterExpenses(expenses, userId, undefined, startDate, endDate)

  const totalExpenses = filtered.reduce((sum, exp) => sum + exp.amount, 0)
  const totalCount = filtered.length

  // Group by category
  const byCategory: Record<string, number> = {}
  filtered.forEach(exp => {
    byCategory[exp.category] = (byCategory[exp.category] || 0) + exp.amount
  })

  // Group by month
  const byMonthMap: Record<string, number> = {}
  filtered.forEach(exp => {
    const month = new Date(exp.date).toISOString().slice(0, 7) // YYYY-MM
    byMonthMap[month] = (byMonthMap[month] || 0) + exp.amount
  })

  const byMonth = Object.entries(byMonthMap)
    .map(([month, total]) => ({ month, total }))
    .sort((a, b) => a.month.localeCompare(b.month))

  // Current month and last month
  const now = new Date()
  const currentMonth = now.toISOString().slice(0, 7)
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().slice(0, 7)

  const thisMonth = filtered
    .filter(exp => new Date(exp.date).toISOString().slice(0, 7) === currentMonth)
    .reduce((sum, exp) => sum + exp.amount, 0)

  const lastMonthTotal = filtered
    .filter(exp => new Date(exp.date).toISOString().slice(0, 7) === lastMonth)
    .reduce((sum, exp) => sum + exp.amount, 0)

  // Average per day
  const daysDiff = endDate && startDate
    ? Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)) || 30
    : 30
  const averagePerDay = totalExpenses / (daysDiff || 1)

  return {
    totalExpenses,
    totalCount,
    byCategory,
    byMonth,
    thisMonth,
    lastMonth: lastMonthTotal,
    averagePerDay: Math.round(averagePerDay * 100) / 100
  }
}

export const expenseService = {
  // Get all expenses
  getExpenses: async (
    userId?: string,
    category?: string,
    startDate?: string,
    endDate?: string
  ): Promise<Expense[]> => {
    // Simulate async operation
    return new Promise((resolve) => {
      setTimeout(() => {
        const expenses = getExpensesFromStorage()
        const filtered = filterExpenses(expenses, userId, category, startDate, endDate)
        resolve(filtered)
      }, 0)
    })
  },

  // Get expense by ID
  getExpenseById: async (id: string, userId?: string): Promise<Expense> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const expenses = getExpensesFromStorage()
        let expense = expenses.find(exp => exp.id === id)

        if (!expense) {
          reject(new Error('Expense not found'))
          return
        }

        if (userId && expense.userId !== userId) {
          reject(new Error('Expense not found'))
          return
        }

        resolve(expense)
      }, 0)
    })
  },

  // Create new expense
  createExpense: async (data: CreateExpenseRequest): Promise<Expense> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        try {
          const expenses = getExpensesFromStorage()
          const now = new Date().toISOString()

          const newExpense: Expense = {
            id: generateId(),
            userId: data.userId,
            title: data.title.trim(),
            description: data.description?.trim(),
            amount: Number(data.amount),
            category: data.category,
            paymentMethod: data.paymentMethod || 'cash',
            date: data.date,
            tags: data.tags && data.tags.length > 0 ? data.tags : undefined,
            location: data.location?.trim(),
            receiptUrl: data.receiptUrl,
            createdAt: now,
            updatedAt: now,
            // Payment status - default to pending for new expenses
            paymentStatus: data.paymentStatus || 'pending',
            // Recurring transaction fields
            isRecurring: data.isRecurring || false,
            recurrenceType: data.recurrenceType,
            recurrenceInterval: data.recurrenceInterval || 1,
            endDate: data.endDate,
            nextOccurrence: data.isRecurring && data.recurrenceType 
              ? calculateNextOccurrence(data.date, data.recurrenceType, data.recurrenceInterval || 1)
              : undefined,
            parentTransactionId: undefined // First occurrence is the parent (no parent)
          }

          expenses.push(newExpense)
          saveExpensesToStorage(expenses)
          
          // If recurring, generate future occurrences
          if (data.isRecurring && data.recurrenceType) {
            generateAndSaveRecurringExpenses(newExpense, expenses, data.recurrenceType, data.recurrenceInterval || 1, data.endDate)
          }
          
          resolve(newExpense)
        } catch (error: any) {
          reject(new Error(error.message || 'Failed to create expense'))
        }
      }, 0)
    })
  },

  // Update expense
  updateExpense: async (id: string, data: Partial<Expense>, userId?: string): Promise<Expense> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        try {
          const expenses = getExpensesFromStorage()
          const index = expenses.findIndex(exp => exp.id === id)

          if (index === -1) {
            reject(new Error('Expense not found'))
            return
          }

          const expense = expenses[index]

          if (userId && expense.userId !== userId) {
            reject(new Error('Expense not found'))
            return
          }

          const updatedExpense: Expense = {
            ...expense,
            ...data,
            id: expense.id, // Don't allow ID change
            userId: expense.userId, // Don't allow userId change
            updatedAt: new Date().toISOString()
          }

          expenses[index] = updatedExpense

          // If this is a parent recurring transaction, update all child occurrences
          if (expense.isRecurring && !expense.parentTransactionId) {
            // Find all child occurrences
            const childOccurrences = expenses.filter(exp => exp.parentTransactionId === expense.id)
            
            // Update each child occurrence with the new data (except dates and IDs)
            childOccurrences.forEach(child => {
              const childIndex = expenses.findIndex(exp => exp.id === child.id)
              if (childIndex !== -1) {
                expenses[childIndex] = {
                  ...child,
                  // Update fields that should be synced from parent
                  title: updatedExpense.title,
                  description: updatedExpense.description,
                  amount: updatedExpense.amount,
                  category: updatedExpense.category,
                  paymentMethod: updatedExpense.paymentMethod,
                  tags: updatedExpense.tags,
                  location: updatedExpense.location,
                  isRecurring: updatedExpense.isRecurring,
                  recurrenceType: updatedExpense.recurrenceType,
                  recurrenceInterval: updatedExpense.recurrenceInterval,
                  endDate: updatedExpense.endDate,
                  // Keep child-specific fields
                  id: child.id,
                  date: child.date,
                  parentTransactionId: child.parentTransactionId,
                  nextOccurrence: child.nextOccurrence,
                  createdAt: child.createdAt,
                  updatedAt: new Date().toISOString(),
                  // Keep payment status of child (don't override)
                  paymentStatus: child.paymentStatus
                }
              }
            })

            // Regenerate missing occurrences if still recurring
            if (updatedExpense.isRecurring && updatedExpense.recurrenceType) {
              // First, generate occurrences from parent date (if any are missing)
              generateAndSaveRecurringExpenses(
                updatedExpense,
                expenses,
                updatedExpense.recurrenceType,
                updatedExpense.recurrenceInterval || 1,
                updatedExpense.endDate
              )
              
              // Then, check and generate any missing occurrences from current date forward
              checkAndGenerateRecurringExpenses()
            }
          }

          saveExpensesToStorage(expenses)
          resolve(updatedExpense)
        } catch (error: any) {
          reject(new Error(error.message || 'Failed to update expense'))
        }
      }, 0)
    })
  },

  // Delete expense
  deleteExpense: async (id: string, userId?: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        try {
          const expenses = getExpensesFromStorage()
          const index = expenses.findIndex(exp => exp.id === id)

          if (index === -1) {
            reject(new Error('Expense not found'))
            return
          }

          const expense = expenses[index]

          if (userId && expense.userId !== userId) {
            reject(new Error('Expense not found'))
            return
          }

          expenses.splice(index, 1)
          saveExpensesToStorage(expenses)
          resolve()
        } catch (error: any) {
          reject(new Error(error.message || 'Failed to delete expense'))
        }
      }, 0)
    })
  },

  // Get expense statistics
  getStats: async (userId?: string, startDate?: string, endDate?: string): Promise<ExpenseStats> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        // Check and generate recurring expenses before calculating stats
        checkAndGenerateRecurringExpenses()
        const expenses = getExpensesFromStorage()
        const stats = calculateStats(expenses, userId, startDate, endDate)
        resolve(stats)
      }, 0)
    })
  },

  // Get recurring expense templates (parent transactions)
  getRecurringExpenses: async (userId?: string): Promise<Expense[]> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        checkAndGenerateRecurringExpenses()
        const expenses = getExpensesFromStorage()
        const recurring = expenses.filter(
          exp => exp.isRecurring && !exp.parentTransactionId && (!userId || exp.userId === userId)
        )
        resolve(recurring)
      }, 0)
    })
  },

  // Delete recurring transaction and all its occurrences
  deleteRecurringExpense: async (parentId: string, userId?: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        try {
          const expenses = getExpensesFromStorage()
          
          // Find parent transaction
          const parent = expenses.find(exp => exp.id === parentId)
          if (!parent || (userId && parent.userId !== userId)) {
            reject(new Error('Recurring expense not found'))
            return
          }
          
          // Remove parent and all related occurrences
          const filtered = expenses.filter(
            exp => exp.id !== parentId && exp.parentTransactionId !== parentId
          )
          
          saveExpensesToStorage(filtered)
          resolve()
        } catch (error: any) {
          reject(new Error(error.message || 'Failed to delete recurring expense'))
        }
      }, 0)
    })
  }
}
