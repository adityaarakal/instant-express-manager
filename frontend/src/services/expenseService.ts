import apiClient from './api'

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

export const expenseService = {
  // Get all expenses
  getExpenses: async (
    userId?: string,
    category?: string,
    startDate?: string,
    endDate?: string
  ): Promise<Expense[]> => {
    const params: any = {}
    if (userId) params.userId = userId
    if (category) params.category = category
    if (startDate) params.startDate = startDate
    if (endDate) params.endDate = endDate
    
    const response = await apiClient.get('/expenses', { params })
    return response.data
  },

  // Get expense by ID
  getExpenseById: async (id: string, userId?: string): Promise<Expense> => {
    const params: any = {}
    if (userId) params.userId = userId
    
    const response = await apiClient.get(`/expenses/${id}`, { params })
    return response.data
  },

  // Create new expense
  createExpense: async (data: CreateExpenseRequest): Promise<Expense> => {
    const response = await apiClient.post('/expenses', data)
    return response.data
  },

  // Update expense
  updateExpense: async (id: string, data: Partial<Expense>, userId?: string): Promise<Expense> => {
    const updateData = { ...data }
    if (userId) updateData.userId = userId as any
    
    const response = await apiClient.put(`/expenses/${id}`, updateData)
    return response.data
  },

  // Delete expense
  deleteExpense: async (id: string, userId?: string): Promise<void> => {
    const params: any = {}
    if (userId) params.userId = userId
    
    await apiClient.delete(`/expenses/${id}`, { params })
  },

  // Get expense statistics
  getStats: async (userId?: string, startDate?: string, endDate?: string): Promise<ExpenseStats> => {
    const params: any = {}
    if (userId) params.userId = userId
    if (startDate) params.startDate = startDate
    if (endDate) params.endDate = endDate
    
    const response = await apiClient.get('/expenses/stats', { params })
    return response.data
  }
}
