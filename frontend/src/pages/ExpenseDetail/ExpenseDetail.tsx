import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { expenseService, Expense } from '../../services/expenseService'
import './ExpenseDetail.css'

const ExpenseDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [expense, setExpense] = useState<Expense | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const fetchExpense = async () => {
      if (!id) return

      try {
        const userId = 'default-user'
        const data = await expenseService.getExpenseById(id, userId)
        setExpense(data)
      } catch (err: any) {
        setError(err.response?.data?.error || 'Expense not found')
      } finally {
        setLoading(false)
      }
    }

    fetchExpense()
  }, [id])

  const handleDelete = async () => {
    if (!expense || !window.confirm('Are you sure you want to delete this expense?')) return

    setDeleting(true)
    try {
      const userId = 'default-user'
      await expenseService.deleteExpense(expense.id, userId)
      navigate('/expenses')
    } catch (err: any) {
      alert('Failed to delete expense. Please try again.')
      console.error('Error deleting expense:', err)
    } finally {
      setDeleting(false)
    }
  }

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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount)
  }

  const formatPaymentMethod = (method: string) => {
    const methods: Record<string, string> = {
      cash: '💵 Cash',
      card: '💳 Card',
      digital_wallet: '📱 Digital Wallet',
      bank_transfer: '🏦 Bank Transfer',
      other: '🔀 Other'
    }
    return methods[method] || method
  }

  if (loading) {
    return (
      <div className="expense-detail-loading">
        <div className="loading-spinner"></div>
        <p>Loading expense details...</p>
      </div>
    )
  }

  if (error || !expense) {
    return (
      <div className="expense-detail-error">
        <p>{error || 'Expense not found'}</p>
        <button onClick={() => navigate('/expenses')} className="btn btn-primary">
          Back to Expenses
        </button>
      </div>
    )
  }

  return (
    <div className="expense-detail">
      <div className="container">
        <div className="detail-header">
          <button onClick={() => navigate(-1)} className="back-button">
            ← Back
          </button>
          <div className="header-actions">
            <button
              onClick={() => navigate(`/expenses/${expense.id}/edit`)}
              className="btn btn-secondary"
            >
              Edit
            </button>
            <button
              onClick={handleDelete}
              className="btn btn-danger"
              disabled={deleting}
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>

        <div className="expense-detail-card">
          <div className="expense-header-detail">
            <div className="expense-icon-large" style={{ backgroundColor: getCategoryColor(expense.category) }}>
              {expense.category.charAt(0).toUpperCase()}
            </div>
            <div className="expense-title-section">
              <h1>{expense.title}</h1>
              <p className="expense-amount-large">{formatCurrency(expense.amount)}</p>
            </div>
          </div>

          <div className="expense-details-grid">
            <div className="detail-item">
              <span className="detail-label">Category</span>
              <span className="detail-value">
                <span className="category-badge" style={{ backgroundColor: getCategoryColor(expense.category) }}>
                  {formatCategory(expense.category)}
                </span>
              </span>
            </div>

            <div className="detail-item">
              <span className="detail-label">Date</span>
              <span className="detail-value">
                {new Date(expense.date).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
            </div>

            <div className="detail-item">
              <span className="detail-label">Payment Method</span>
              <span className="detail-value">{formatPaymentMethod(expense.paymentMethod)}</span>
            </div>

            {expense.location && (
              <div className="detail-item">
                <span className="detail-label">Location</span>
                <span className="detail-value">{expense.location}</span>
              </div>
            )}

            {expense.description && (
              <div className="detail-item full-width">
                <span className="detail-label">Description</span>
                <span className="detail-value">{expense.description}</span>
              </div>
            )}

            {expense.tags && expense.tags.length > 0 && (
              <div className="detail-item full-width">
                <span className="detail-label">Tags</span>
                <div className="tags-list">
                  {expense.tags.map(tag => (
                    <span key={tag} className="tag">{tag}</span>
                  ))}
                </div>
              </div>
            )}

            <div className="detail-item">
              <span className="detail-label">Created</span>
              <span className="detail-value">
                {new Date(expense.createdAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ExpenseDetail
