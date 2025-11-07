// LocalStorage-based income service (no backend required)

import { calculateNextOccurrence, generateRecurringOccurrences, RecurrenceType } from '../utils/recurringTransactions'

const STORAGE_KEY = 'expense-manager-incomes'

export interface Income {
  id: string
  userId: string
  title: string
  description?: string
  amount: number
  category: 'salary' | 'freelance' | 'business' | 'investment' | 'rental' | 'gift' | 'refund' | 'other'
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
  recurrenceInterval?: number
  parentTransactionId?: string
  nextOccurrence?: string
  endDate?: string
}

export interface CreateIncomeRequest {
  userId: string
  title: string
  description?: string
  amount: number
  category: 'salary' | 'freelance' | 'business' | 'investment' | 'rental' | 'gift' | 'refund' | 'other'
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

export interface IncomeStats {
  totalIncome: number
  totalCount: number
  byCategory: Record<string, number>
  byMonth: Array<{ month: string; total: number }>
  thisMonth: number
  lastMonth: number
  averagePerDay: number
}

// Helper functions for localStorage
const getIncomesFromStorage = (): Income[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    const incomes = stored ? JSON.parse(stored) : []
    // Migrate old incomes without paymentStatus to have 'paid' by default (backward compatibility)
    return incomes.map((inc: Income) => {
      if (!inc.paymentStatus) {
        inc.paymentStatus = 'paid' // Old incomes default to paid
      }
      return inc
    })
  } catch (error) {
    console.error('Error reading from localStorage:', error)
    return []
  }
}

const saveIncomesToStorage = (incomes: Income[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(incomes))
  } catch (error) {
    console.error('Error saving to localStorage:', error)
    throw new Error('Failed to save income. LocalStorage may be full.')
  }
}

const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

// Helper function to generate and save recurring incomes
const generateAndSaveRecurringIncomes = (
  parentIncome: Income,
  existingIncomes: Income[],
  recurrenceType: RecurrenceType,
  interval: number,
  endDate?: string
): void => {
  const occurrences = generateRecurringOccurrences(
    parentIncome.date,
    recurrenceType,
    interval,
    endDate,
    100 // Max 100 occurrences
  )
  
  // Skip the first occurrence (already created)
  const futureOccurrences = occurrences.slice(1)
  
  futureOccurrences.forEach(occurrenceDate => {
    // Check if this occurrence already exists (by date and parent ID)
    const exists = existingIncomes.some(
      inc => inc.parentTransactionId === parentIncome.id && 
      new Date(inc.date).toISOString().split('T')[0] === new Date(occurrenceDate).toISOString().split('T')[0]
    )
    
    // Only create if it doesn't exist
    if (!exists) {
      const recurringIncome: Income = {
        ...parentIncome,
        id: generateId(),
        date: occurrenceDate,
        parentTransactionId: parentIncome.id,
        paymentStatus: 'pending', // Recurring income defaults to pending
        nextOccurrence: calculateNextOccurrence(occurrenceDate, recurrenceType, interval),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      existingIncomes.push(recurringIncome)
    }
  })
  
  saveIncomesToStorage(existingIncomes)
}

// Function to check and generate missing recurring transactions
export const checkAndGenerateRecurringIncomes = (): void => {
  try {
    const incomes = getIncomesFromStorage()
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    
    // Find all parent recurring transactions (those without parentTransactionId)
    const recurringParents = incomes.filter(
      inc => inc.isRecurring && !inc.parentTransactionId && (!inc.endDate || new Date(inc.endDate) >= now)
    )
    
    recurringParents.forEach(parent => {
      if (!parent.recurrenceType) return
      
      // Find the last occurrence for this parent
      const relatedIncomes = incomes.filter(
        inc => inc.parentTransactionId === parent.id || inc.id === parent.id
      )
      const lastOccurrence = relatedIncomes
        .map(inc => new Date(inc.date))
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
        const missingOccurrences: Income[] = []
        let currentDate = new Date(nextExpected)
        
        while (currentDate <= threeMonthsAhead && missingOccurrences.length < 12) {
          // Check if this occurrence already exists
          const exists = incomes.some(
            inc => inc.parentTransactionId === parent.id && 
            new Date(inc.date).toISOString().split('T')[0] === currentDate.toISOString().split('T')[0]
          )
          
          if (!exists && (!parent.endDate || currentDate <= new Date(parent.endDate))) {
            const newOccurrence: Income = {
              ...parent,
              id: generateId(),
              date: currentDate.toISOString(),
              parentTransactionId: parent.id,
              paymentStatus: 'pending', // Generated recurring income defaults to pending
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
          incomes.push(...missingOccurrences)
          saveIncomesToStorage(incomes)
        }
      }
    })
  } catch (error) {
    console.error('Error checking recurring incomes:', error)
  }
}

const filterIncomes = (
  incomes: Income[],
  userId?: string,
  category?: string,
  startDate?: string,
  endDate?: string
): Income[] => {
  let filtered = [...incomes]

  if (userId) {
    filtered = filtered.filter(inc => inc.userId === userId)
  }

  if (category) {
    filtered = filtered.filter(inc => inc.category === category)
  }

  if (startDate) {
    const start = new Date(startDate)
    filtered = filtered.filter(inc => new Date(inc.date) >= start)
  }

  if (endDate) {
    const end = new Date(endDate)
    filtered = filtered.filter(inc => new Date(inc.date) <= end)
  }

  return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

const calculateStats = (
  incomes: Income[],
  userId?: string,
  startDate?: string,
  endDate?: string
): IncomeStats => {
  let filtered = filterIncomes(incomes, userId, undefined, startDate, endDate)

  const totalIncome = filtered.reduce((sum, inc) => sum + inc.amount, 0)
  const totalCount = filtered.length

  // Group by category
  const byCategory: Record<string, number> = {}
  filtered.forEach(inc => {
    byCategory[inc.category] = (byCategory[inc.category] || 0) + inc.amount
  })

  // Group by month
  const byMonthMap: Record<string, number> = {}
  filtered.forEach(inc => {
    const month = new Date(inc.date).toISOString().slice(0, 7) // YYYY-MM
    byMonthMap[month] = (byMonthMap[month] || 0) + inc.amount
  })

  const byMonth = Object.entries(byMonthMap)
    .map(([month, total]) => ({ month, total }))
    .sort((a, b) => a.month.localeCompare(b.month))

  // Current month and last month
  const now = new Date()
  const currentMonth = now.toISOString().slice(0, 7)
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().slice(0, 7)

  const thisMonth = filtered
    .filter(inc => new Date(inc.date).toISOString().slice(0, 7) === currentMonth)
    .reduce((sum, inc) => sum + inc.amount, 0)

  const lastMonthTotal = filtered
    .filter(inc => new Date(inc.date).toISOString().slice(0, 7) === lastMonth)
    .reduce((sum, inc) => sum + inc.amount, 0)

  // Average per day
  const daysDiff = endDate && startDate
    ? Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)) || 30
    : 30
  const averagePerDay = totalIncome / (daysDiff || 1)

  return {
    totalIncome,
    totalCount,
    byCategory,
    byMonth,
    thisMonth,
    lastMonth: lastMonthTotal,
    averagePerDay: Math.round(averagePerDay * 100) / 100
  }
}

export const incomeService = {
  // Get all incomes
  getIncomes: async (
    userId?: string,
    category?: string,
    startDate?: string,
    endDate?: string
  ): Promise<Income[]> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const incomes = getIncomesFromStorage()
        const filtered = filterIncomes(incomes, userId, category, startDate, endDate)
        resolve(filtered)
      }, 0)
    })
  },

  // Get income by ID
  getIncomeById: async (id: string, userId?: string): Promise<Income> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const incomes = getIncomesFromStorage()
        let income = incomes.find(inc => inc.id === id)

        if (!income) {
          reject(new Error('Income not found'))
          return
        }

        if (userId && income.userId !== userId) {
          reject(new Error('Income not found'))
          return
        }

        resolve(income)
      }, 0)
    })
  },

  // Create new income
  createIncome: async (data: CreateIncomeRequest): Promise<Income> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        try {
          const incomes = getIncomesFromStorage()
          const now = new Date().toISOString()

          const newIncome: Income = {
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
            // Payment status - default to pending for new income
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

          incomes.push(newIncome)
          saveIncomesToStorage(incomes)
          
          // If recurring, generate future occurrences
          if (data.isRecurring && data.recurrenceType) {
            generateAndSaveRecurringIncomes(newIncome, incomes, data.recurrenceType, data.recurrenceInterval || 1, data.endDate)
          }
          
          resolve(newIncome)
        } catch (error: any) {
          reject(new Error(error.message || 'Failed to create income'))
        }
      }, 0)
    })
  },

  // Update income
  updateIncome: async (id: string, data: Partial<Income>, userId?: string): Promise<Income> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        try {
          const incomes = getIncomesFromStorage()
          const index = incomes.findIndex(inc => inc.id === id)

          if (index === -1) {
            reject(new Error('Income not found'))
            return
          }

          const income = incomes[index]

          if (userId && income.userId !== userId) {
            reject(new Error('Income not found'))
            return
          }

          const updatedIncome: Income = {
            ...income,
            ...data,
            id: income.id, // Don't allow ID change
            userId: income.userId, // Don't allow userId change
            updatedAt: new Date().toISOString()
          }

          incomes[index] = updatedIncome

          // If this is a parent recurring transaction, update all child occurrences
          if (income.isRecurring && !income.parentTransactionId) {
            // Find all child occurrences
            const childOccurrences = incomes.filter(inc => inc.parentTransactionId === income.id)
            
            // Update each child occurrence with the new data (except dates and IDs)
            childOccurrences.forEach(child => {
              const childIndex = incomes.findIndex(inc => inc.id === child.id)
              if (childIndex !== -1) {
                incomes[childIndex] = {
                  ...child,
                  // Update fields that should be synced from parent
                  title: updatedIncome.title,
                  description: updatedIncome.description,
                  amount: updatedIncome.amount,
                  category: updatedIncome.category,
                  paymentMethod: updatedIncome.paymentMethod,
                  tags: updatedIncome.tags,
                  location: updatedIncome.location,
                  isRecurring: updatedIncome.isRecurring,
                  recurrenceType: updatedIncome.recurrenceType,
                  recurrenceInterval: updatedIncome.recurrenceInterval,
                  endDate: updatedIncome.endDate,
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
            if (updatedIncome.isRecurring && updatedIncome.recurrenceType) {
              // First, generate occurrences from parent date (if any are missing)
              generateAndSaveRecurringIncomes(
                updatedIncome,
                incomes,
                updatedIncome.recurrenceType,
                updatedIncome.recurrenceInterval || 1,
                updatedIncome.endDate
              )
              
              // Then, check and generate any missing occurrences from current date forward
              checkAndGenerateRecurringIncomes()
            }
          }

          saveIncomesToStorage(incomes)
          resolve(updatedIncome)
        } catch (error: any) {
          reject(new Error(error.message || 'Failed to update income'))
        }
      }, 0)
    })
  },

  // Delete income
  deleteIncome: async (id: string, userId?: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        try {
          const incomes = getIncomesFromStorage()
          const index = incomes.findIndex(inc => inc.id === id)

          if (index === -1) {
            reject(new Error('Income not found'))
            return
          }

          const income = incomes[index]

          if (userId && income.userId !== userId) {
            reject(new Error('Income not found'))
            return
          }

          incomes.splice(index, 1)
          saveIncomesToStorage(incomes)
          resolve()
        } catch (error: any) {
          reject(new Error(error.message || 'Failed to delete income'))
        }
      }, 0)
    })
  },

  // Get income statistics
  getStats: async (userId?: string, startDate?: string, endDate?: string): Promise<IncomeStats> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        // Check and generate recurring incomes before calculating stats
        checkAndGenerateRecurringIncomes()
        const incomes = getIncomesFromStorage()
        const stats = calculateStats(incomes, userId, startDate, endDate)
        resolve(stats)
      }, 0)
    })
  },

  // Get recurring income templates (parent transactions)
  getRecurringIncomes: async (userId?: string): Promise<Income[]> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        checkAndGenerateRecurringIncomes()
        const incomes = getIncomesFromStorage()
        const recurring = incomes.filter(
          inc => inc.isRecurring && !inc.parentTransactionId && (!userId || inc.userId === userId)
        )
        resolve(recurring)
      }, 0)
    })
  },

  // Delete recurring transaction and all its occurrences
  deleteRecurringIncome: async (parentId: string, userId?: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        try {
          const incomes = getIncomesFromStorage()
          
          // Find parent transaction
          const parent = incomes.find(inc => inc.id === parentId)
          if (!parent || (userId && parent.userId !== userId)) {
            reject(new Error('Recurring income not found'))
            return
          }
          
          // Remove parent and all related occurrences
          const filtered = incomes.filter(
            inc => inc.id !== parentId && inc.parentTransactionId !== parentId
          )
          
          saveIncomesToStorage(filtered)
          resolve()
        } catch (error: any) {
          reject(new Error(error.message || 'Failed to delete recurring income'))
        }
      }, 0)
    })
  }
}

