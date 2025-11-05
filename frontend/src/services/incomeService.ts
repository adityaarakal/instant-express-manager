// LocalStorage-based income service (no backend required)

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
    return stored ? JSON.parse(stored) : []
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
            updatedAt: now
          }

          incomes.push(newIncome)
          saveIncomesToStorage(incomes)
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
            updatedAt: new Date().toISOString()
          }

          incomes[index] = updatedIncome
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
        const incomes = getIncomesFromStorage()
        const stats = calculateStats(incomes, userId, startDate, endDate)
        resolve(stats)
      }, 0)
    })
  }
}

