import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { incomeService, Income } from '../../services/incomeService'
import { formatCurrency } from '../../utils/currency'
import './IncomeList.css'

const IncomeList: React.FC = () => {
  const [incomes, setIncomes] = useState<Income[]>([])
  const [recurringIncomes, setRecurringIncomes] = useState<Income[]>([])
  const [loading, setLoading] = useState(true)
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [filterDate, setFilterDate] = useState<string>('all')
  const [showRecurring, setShowRecurring] = useState(false)

  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'salary', label: '💼 Salary' },
    { value: 'freelance', label: '💻 Freelance' },
    { value: 'business', label: '🏢 Business' },
    { value: 'investment', label: '📈 Investment' },
    { value: 'rental', label: '🏠 Rental' },
    { value: 'gift', label: '🎁 Gift' },
    { value: 'refund', label: '↩️ Refund' },
    { value: 'other', label: '💰 Other' }
  ]

  useEffect(() => {
    const fetchIncomes = async () => {
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

        const [data, recurring] = await Promise.all([
          incomeService.getIncomes(userId, category, startDate, endDate),
          incomeService.getRecurringIncomes(userId)
        ])
        setIncomes(data)
        setRecurringIncomes(recurring)
      } catch (error: any) {
        console.error('Error fetching incomes:', error)
        setIncomes([])
        setRecurringIncomes([])
      } finally {
        setLoading(false)
      }
    }

    fetchIncomes()
  }, [filterCategory, filterDate])

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      salary: '#10b981',
      freelance: '#3b82f6',
      business: '#8b5cf6',
      investment: '#f59e0b',
      rental: '#ec4899',
      gift: '#f472b6',
      refund: '#06b6d4',
      other: '#6366f1'
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

  const displayIncomes = showRecurring ? recurringIncomes : incomes
  const totalAmount = displayIncomes.reduce((sum, inc) => sum + inc.amount, 0)

  if (loading) {
    return (
      <div className="income-list-loading">
        <div className="loading-spinner"></div>
        <p>Loading incomes...</p>
      </div>
    )
  }

  return (
    <div className="income-list-page">
      <div className="container" style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div className="income-list-header">
          <div>
            <h1>My Income</h1>
            <p className="income-list-subtitle">View and manage all your income sources</p>
          </div>
          <div style={{ display: 'flex', gap: 'var(--spacing-sm)', alignItems: 'center' }}>
            {recurringIncomes.length > 0 && (
              <button
                onClick={() => setShowRecurring(!showRecurring)}
                className={`btn ${showRecurring ? 'btn-primary' : 'btn-secondary'}`}
                style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)' }}
              >
                🔄 {showRecurring ? 'Show All' : `Recurring (${recurringIncomes.length})`}
              </button>
            )}
            <Link to="/income/create" className="btn btn-primary">
              + Add Income
            </Link>
          </div>
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

        {displayIncomes.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">💰</div>
            <p>{showRecurring ? 'No recurring income found.' : 'No income found.'}</p>
            <Link to="/income/create" className="btn btn-primary">
              {showRecurring ? 'Create Recurring Income' : 'Add Your First Income'}
            </Link>
          </div>
        ) : (
          <div className="income-list">
            {displayIncomes.map((income) => (
              <Link
                key={income.id}
                to={`/income/${income.id}`}
                className="income-card"
              >
                <div className="income-icon" style={{ backgroundColor: getCategoryColor(income.category) }}>
                  {income.category.charAt(0).toUpperCase()}
                </div>
                <div className="income-content">
                  <div className="income-header">
                    <h3>{income.title}</h3>
                    <span className="income-amount">{formatCurrency(income.amount)}</span>
                  </div>
                  <div className="income-meta">
                    {income.isRecurring && !income.parentTransactionId && (
                      <>
                        <span className="income-recurring" style={{ color: 'var(--success-color)', fontWeight: 600 }}>
                          🔄 Recurring ({income.recurrenceType})
                        </span>
                        <span className="income-separator">•</span>
                      </>
                    )}
                    <span className="income-category">{formatCategory(income.category)}</span>
                    <span className="income-separator">•</span>
                    <span className="income-date">{formatDate(income.date)}</span>
                    {income.location && (
                      <>
                        <span className="income-separator">•</span>
                        <span className="income-location">{income.location}</span>
                      </>
                    )}
                  </div>
                  {income.description && (
                    <p className="income-description">{income.description}</p>
                  )}
                  {income.tags && income.tags.length > 0 && (
                    <div className="income-tags">
                      {income.tags.map(tag => (
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

export default IncomeList

