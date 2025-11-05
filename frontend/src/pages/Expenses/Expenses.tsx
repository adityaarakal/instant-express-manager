import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { expenseService, Expense } from '../../services/expenseService'
import { formatCurrency } from '../../utils/currency'
import './Expenses.css'

const Expenses: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [filterDate, setFilterDate] = useState<string>('all')

  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'food', label: '🍔 Food' },
    { value: 'transport', label: '🚗 Transport' },
    { value: 'shopping', label: '🛍️ Shopping' },
    { value: 'bills', label: '💳 Bills' },
    { value: 'entertainment', label: '🎬 Entertainment' },
    { value: 'health', label: '🏥 Health' },
    { value: 'education', label: '📚 Education' },
    { value: 'travel', label: '✈️ Travel' },
    { value: 'other', label: '📦 Other' }
  ]

  useEffect(() => {
    const fetchExpenses = async () => {
      try {
        const userId = 'default-user'
        const category = filterCategory === 'all' ? undefined : filterCategory
        
        let startDate: string | undefined
        let endDate: string | undefined
        
        if (filterDate === 'today') {
          const today = new Date()
          today.setHours(0, 0, 0, 0)
          const endOfToday = new Date()
          endOfToday.setHours(23, 59, 59, 999)
          startDate = today.toISOString()
          endDate = endOfToday.toISOString()
        } else if (filterDate === 'week') {
          const weekAgo = new Date()
          weekAgo.setDate(weekAgo.getDate() - 7)
          weekAgo.setHours(0, 0, 0, 0)
          const endOfToday = new Date()
          endOfToday.setHours(23, 59, 59, 999)
          startDate = weekAgo.toISOString()
          endDate = endOfToday.toISOString()
        } else if (filterDate === 'month') {
          const monthAgo = new Date()
          monthAgo.setMonth(monthAgo.getMonth() - 1)
          monthAgo.setHours(0, 0, 0, 0)
          const endOfToday = new Date()
          endOfToday.setHours(23, 59, 59, 999)
          startDate = monthAgo.toISOString()
          endDate = endOfToday.toISOString()
        }

        const data = await expenseService.getExpenses(userId, category, startDate, endDate)
        setExpenses(data)
      } catch (error: any) {
        console.error('Error fetching expenses:', error)
        // On error, show empty state
        setExpenses([])
      } finally {
        setLoading(false)
      }
    }

    fetchExpenses()
  }, [filterCategory, filterDate])

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      food: '#FF6B6B',
      transport: '#4ECDC4',
      shopping: '#95E1D3',
      bills: '#F38181',
      entertainment: '#AA96DA',
      health: '#FCBAD3',
      education: '#FDFFAB',
      travel: '#A8E6CF',
      other: '#FFD3A5'
    }
    return colors[category] || '#CCCCCC'
  }

  const formatCategory = (category: string) => {
    return category.charAt(0).toUpperCase() + category.slice(1)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
    })
  }

  const totalAmount = expenses.reduce((sum, exp) => sum + exp.amount, 0)

  if (loading) {
    return (
      <div className="expenses-loading">
        <div className="loading-spinner"></div>
        <p>Loading expenses...</p>
      </div>
    )
  }

  return (
    <div className="expenses-page">
      <div className="container">
        <div className="expenses-header">
          <div>
            <h1>My Expenses</h1>
            <p className="expenses-subtitle">View and manage all your expenses</p>
          </div>
          <Link to="/expenses/create" className="btn btn-primary">
            + Add Expense
          </Link>
        </div>

        <div className="filters-section">
          <div className="filter-group">
            <label>Category</label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="filter-select"
            >
              {categories.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Time Period</label>
            <select
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
            </select>
          </div>

          <div className="total-display">
            <span className="total-label">Total:</span>
            <span className="total-amount">{formatCurrency(totalAmount)}</span>
          </div>
        </div>

        {expenses.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">💰</div>
            <p>No expenses found.</p>
            <Link to="/expenses/create" className="btn btn-primary">
              Add Your First Expense
            </Link>
          </div>
        ) : (
          <div className="expenses-list">
            {expenses.map((expense) => (
              <Link
                key={expense.id}
                to={`/expenses/${expense.id}`}
                className="expense-card"
              >
                <div className="expense-icon" style={{ backgroundColor: getCategoryColor(expense.category) }}>
                  {expense.category.charAt(0).toUpperCase()}
                </div>
                <div className="expense-content">
                  <div className="expense-header">
                    <h3>{expense.title}</h3>
                    <span className="expense-amount">{formatCurrency(expense.amount)}</span>
                  </div>
                  <div className="expense-meta">
                    <span className="expense-category">{formatCategory(expense.category)}</span>
                    <span className="expense-separator">•</span>
                    <span className="expense-date">{formatDate(expense.date)}</span>
                    {expense.location && (
                      <>
                        <span className="expense-separator">•</span>
                        <span className="expense-location">{expense.location}</span>
                      </>
                    )}
                  </div>
                  {expense.description && (
                    <p className="expense-description">{expense.description}</p>
                  )}
                  {expense.tags && expense.tags.length > 0 && (
                    <div className="expense-tags">
                      {expense.tags.map(tag => (
                        <span key={tag} className="tag">{tag}</span>
                      ))}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Expenses
