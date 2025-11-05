import { ExpenseModel } from '../models/Expense.model'
import { CreateExpenseRequest, UpdateExpenseRequest, ExpenseResponse, ExpenseStats } from '../types/expense.types'

export const createExpense = async (
  request: CreateExpenseRequest
): Promise<ExpenseResponse> => {
  try {
    const expense = await ExpenseModel.create({
      ...request,
      date: new Date(request.date)
    })

    return expenseToResponse(expense)
  } catch (error: any) {
    throw new Error(`Failed to create expense: ${error.message}`)
  }
}

export const getExpenseById = async (
  expenseId: string,
  userId?: string
): Promise<ExpenseResponse | null> => {
  try {
    const query: any = { _id: expenseId }
    if (userId) {
      query.userId = userId
    }

    const expense = await ExpenseModel.findOne(query)
    return expense ? expenseToResponse(expense) : null
  } catch (error: any) {
    throw new Error(`Failed to get expense: ${error.message}`)
  }
}

export const getUserExpenses = async (
  userId: string,
  category?: string,
  startDate?: Date,
  endDate?: Date,
  limit: number = 100,
  skip: number = 0
): Promise<ExpenseResponse[]> => {
  try {
    const query: any = { userId }
    
    if (category) {
      query.category = category
    }
    
    if (startDate || endDate) {
      query.date = {}
      if (startDate) query.date.$gte = startDate
      if (endDate) query.date.$lte = endDate
    }

    const expenses = await ExpenseModel.find(query)
      .sort({ date: -1 })
      .limit(limit)
      .skip(skip)

    return expenses.map(expenseToResponse)
  } catch (error: any) {
    throw new Error(`Failed to get expenses: ${error.message}`)
  }
}

export const updateExpense = async (
  expenseId: string,
  userId: string,
  updates: UpdateExpenseRequest
): Promise<ExpenseResponse | null> => {
  try {
    const updateData: any = { ...updates }
    
    if (updates.date) {
      updateData.date = new Date(updates.date)
    }

    const expense = await ExpenseModel.findOneAndUpdate(
      { _id: expenseId, userId },
      updateData,
      { new: true }
    )

    return expense ? expenseToResponse(expense) : null
  } catch (error: any) {
    throw new Error(`Failed to update expense: ${error.message}`)
  }
}

export const deleteExpense = async (
  expenseId: string,
  userId: string
): Promise<boolean> => {
  try {
    const result = await ExpenseModel.findOneAndDelete({ _id: expenseId, userId })
    return !!result
  } catch (error: any) {
    throw new Error(`Failed to delete expense: ${error.message}`)
  }
}

export const getExpenseStats = async (userId: string, startDate?: Date, endDate?: Date): Promise<ExpenseStats> => {
  try {
    const query: any = { userId }
    
    if (startDate || endDate) {
      query.date = {}
      if (startDate) query.date.$gte = startDate
      if (endDate) query.date.$lte = endDate
    }

    const expenses = await ExpenseModel.find(query)
    
    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0)
    const totalCount = expenses.length
    
    // Group by category
    const byCategory: Record<string, number> = {}
    expenses.forEach(exp => {
      byCategory[exp.category] = (byCategory[exp.category] || 0) + exp.amount
    })

    // Group by month
    const byMonthMap: Record<string, number> = {}
    expenses.forEach(exp => {
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
    
    const thisMonth = expenses
      .filter(exp => new Date(exp.date).toISOString().slice(0, 7) === currentMonth)
      .reduce((sum, exp) => sum + exp.amount, 0)
    
    const lastMonthTotal = expenses
      .filter(exp => new Date(exp.date).toISOString().slice(0, 7) === lastMonth)
      .reduce((sum, exp) => sum + exp.amount, 0)

    // Average per day
    const daysDiff = endDate && startDate 
      ? Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) || 30
      : 30
    const averagePerDay = totalExpenses / daysDiff

    return {
      totalExpenses,
      totalCount,
      byCategory,
      byMonth,
      thisMonth,
      lastMonth: lastMonthTotal,
      averagePerDay: Math.round(averagePerDay * 100) / 100
    }
  } catch (error: any) {
    throw new Error(`Failed to get expense stats: ${error.message}`)
  }
}

// Helper function to convert Mongoose document to response object
const expenseToResponse = (expense: any): ExpenseResponse => {
  return {
    id: expense._id.toString(),
    userId: expense.userId,
    title: expense.title,
    description: expense.description,
    amount: expense.amount,
    category: expense.category,
    paymentMethod: expense.paymentMethod,
    date: expense.date,
    tags: expense.tags,
    receiptUrl: expense.receiptUrl,
    location: expense.location,
    createdAt: expense.createdAt,
    updatedAt: expense.updatedAt
  }
}
