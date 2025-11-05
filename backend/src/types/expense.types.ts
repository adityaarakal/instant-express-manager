export interface CreateExpenseRequest {
  userId: string
  title: string
  description?: string
  amount: number
  category: 'food' | 'transport' | 'shopping' | 'bills' | 'entertainment' | 'health' | 'education' | 'travel' | 'other'
  paymentMethod: 'cash' | 'card' | 'digital_wallet' | 'bank_transfer' | 'other'
  date: string | Date
  tags?: string[]
  receiptUrl?: string
  location?: string
}

export interface UpdateExpenseRequest {
  title?: string
  description?: string
  amount?: number
  category?: 'food' | 'transport' | 'shopping' | 'bills' | 'entertainment' | 'health' | 'education' | 'travel' | 'other'
  paymentMethod?: 'cash' | 'card' | 'digital_wallet' | 'bank_transfer' | 'other'
  date?: string | Date
  tags?: string[]
  receiptUrl?: string
  location?: string
}

export interface ExpenseResponse {
  id: string
  userId: string
  title: string
  description?: string
  amount: number
  category: string
  paymentMethod: string
  date: Date
  tags?: string[]
  receiptUrl?: string
  location?: string
  createdAt: Date
  updatedAt: Date
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
