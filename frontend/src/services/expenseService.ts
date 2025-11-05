// LocalStorage-based expense service (no backend required)

const STORAGE_KEY = 'expense-manager-expenses'

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
    return stored ? JSON.parse(stored) : []
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
            updatedAt: now
          }

          expenses.push(newExpense)
          saveExpensesToStorage(expenses)
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
            updatedAt: new Date().toISOString()
          }

          expenses[index] = updatedExpense
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
        const expenses = getExpensesFromStorage()
        const stats = calculateStats(expenses, userId, startDate, endDate)
        resolve(stats)
      }, 0)
    })
  }
}
