import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { incomeService, Income } from '../../services/incomeService'
import { formatCurrency } from '../../utils/currency'
import './IncomeDetail.css'

const IncomeDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [income, setIncome] = useState<Income | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const fetchIncome = async () => {
      if (!id) return

      try {
        const userId = 'default-user'
        const data = await incomeService.getIncomeById(id, userId)
        setIncome(data)
      } catch (err: any) {
        const errorMessage = err.message || 'Failed to load income. Please try again.'
        setError(errorMessage)
      } finally {
        setLoading(false)
      }
    }

    fetchIncome()
  }, [id])

  const handleDelete = async () => {
    if (!income || !window.confirm('Are you sure you want to delete this income?')) return

    setDeleting(true)
    try {
      const userId = 'default-user'
      await incomeService.deleteIncome(income.id, userId)
      navigate('/income')
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to delete income. Please try again.'
      alert(errorMessage)
      console.error('Error deleting income:', err)
    } finally {
      setDeleting(false)
    }
  }

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

  const formatRecurrenceType = (type?: string, interval?: number) => {
    if (!type) return ''
    const intervalText = interval && interval > 1 ? `Every ${interval} ` : 'Every '
    const typeText = type === 'weekly' ? 'Week(s)' : type === 'monthly' ? 'Month(s)' : 'Year(s)'
    return `${intervalText}${typeText}`
  }

  const formatPaymentStatus = (status: string) => {
    return status === 'paid' ? '✅ Paid' : '⏳ Pending'
  }

  if (loading) {
    return (
      <div className="income-detail-loading">
        <div className="loading-spinner"></div>
        <p>Loading income details...</p>
      </div>
    )
  }

  if (error || !income) {
    return (
      <div className="income-detail-error">
        <p>{error || 'Income not found'}</p>
        <button onClick={() => navigate('/income')} className="btn btn-primary">
          Back to Income
        </button>
      </div>
    )
  }

  return (
    <div className="income-detail">
      <div className="container">
        <div className="detail-header">
          <button onClick={() => navigate(-1)} className="back-button">
            ← Back
          </button>
          <div className="header-actions">
            <button
              onClick={() => navigate(`/income/create?edit=${income.id}`)}
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

        <div className="income-detail-card">
          <div className="income-header-detail">
            <div className="income-icon-large" style={{ backgroundColor: getCategoryColor(income.category) }}>
              {income.category.charAt(0).toUpperCase()}
            </div>
            <div className="income-title-section">
              <h1>{income.title}</h1>
              <p className="income-amount-large">{formatCurrency(income.amount)}</p>
            </div>
          </div>

          <div className="income-details-grid">
            <div className="detail-item">
              <span className="detail-label">Category</span>
              <span className="detail-value">
                <span className="category-badge" style={{ backgroundColor: getCategoryColor(income.category) }}>
                  {formatCategory(income.category)}
                </span>
              </span>
            </div>

            <div className="detail-item">
              <span className="detail-label">Date</span>
              <span className="detail-value">
                {new Date(income.date).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
            </div>

            <div className="detail-item">
              <span className="detail-label">Payment Method</span>
              <span className="detail-value">{formatPaymentMethod(income.paymentMethod)}</span>
            </div>

            <div className="detail-item">
              <span className="detail-label">Payment Status</span>
              <span className="detail-value">
                <span className={`payment-status-badge ${income.paymentStatus === 'paid' ? 'paid' : 'pending'}`}>
                  {formatPaymentStatus(income.paymentStatus)}
                </span>
              </span>
            </div>

            {income.isRecurring && (
              <div className="detail-item full-width recurring-details-section">
                <span className="detail-label">🔄 Recurring Transaction</span>
                <div className="recurring-details">
                  <div className="recurring-detail-row">
                    <span className="recurring-label">Type:</span>
                    <span className="recurring-value">{formatRecurrenceType(income.recurrenceType, income.recurrenceInterval)}</span>
                  </div>
                  {income.nextOccurrence && (
                    <div className="recurring-detail-row">
                      <span className="recurring-label">Next Occurrence:</span>
                      <span className="recurring-value">
                        {new Date(income.nextOccurrence).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                  )}
                  {income.endDate && (
                    <div className="recurring-detail-row">
                      <span className="recurring-label">Ends On:</span>
                      <span className="recurring-value">
                        {new Date(income.endDate).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                  )}
                  {income.parentTransactionId ? (
                    <div className="recurring-detail-row">
                      <span className="recurring-label">Status:</span>
                      <span className="recurring-value">This is an occurrence of a recurring transaction</span>
                    </div>
                  ) : (
                    <div className="recurring-detail-row">
                      <span className="recurring-label">Status:</span>
                      <span className="recurring-value">Parent recurring transaction</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {income.location && (
              <div className="detail-item">
                <span className="detail-label">Location</span>
                <span className="detail-value">{income.location}</span>
              </div>
            )}

            {income.description && (
              <div className="detail-item full-width">
                <span className="detail-label">Description</span>
                <span className="detail-value">{income.description}</span>
              </div>
            )}

            {income.tags && income.tags.length > 0 && (
              <div className="detail-item full-width">
                <span className="detail-label">Tags</span>
                <div className="tags-list">
                  {income.tags.map(tag => (
                    <span key={tag} className="tag">{tag}</span>
                  ))}
                </div>
              </div>
            )}

            <div className="detail-item">
              <span className="detail-label">Created</span>
              <span className="detail-value">
                {new Date(income.createdAt).toLocaleDateString('en-US', {
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

export default IncomeDetail

