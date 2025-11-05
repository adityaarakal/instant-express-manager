import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { expenseService, CreateExpenseRequest } from '../../services/expenseService'
import './CreateExpense.css'

const CreateExpense: React.FC = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [formData, setFormData] = useState<CreateExpenseRequest>({
    userId: 'default-user',
    title: '',
    description: '',
    amount: 0,
    category: 'food',
    paymentMethod: 'cash',
    date: new Date().toISOString().split('T')[0],
    tags: [],
    location: ''
  })

  const [tagInput, setTagInput] = useState('')

  const categories = [
    { value: 'food', label: '🍔 Food', color: '#FF6B6B' },
    { value: 'transport', label: '🚗 Transport', color: '#4ECDC4' },
    { value: 'shopping', label: '🛍️ Shopping', color: '#95E1D3' },
    { value: 'bills', label: '💳 Bills', color: '#F38181' },
    { value: 'entertainment', label: '🎬 Entertainment', color: '#AA96DA' },
    { value: 'health', label: '🏥 Health', color: '#FCBAD3' },
    { value: 'education', label: '📚 Education', color: '#FDFFAB' },
    { value: 'travel', label: '✈️ Travel', color: '#A8E6CF' },
    { value: 'other', label: '📦 Other', color: '#FFD3A5' }
  ]

  const paymentMethods = [
    { value: 'cash', label: '💵 Cash' },
    { value: 'card', label: '💳 Card' },
    { value: 'digital_wallet', label: '📱 Digital Wallet' },
    { value: 'bank_transfer', label: '🏦 Bank Transfer' },
    { value: 'other', label: '🔀 Other' }
  ]

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'amount' ? parseFloat(value) || 0 : value
    }))
  }

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags?.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...(prev.tags || []), tagInput.trim()]
      }))
      setTagInput('')
    }
  }

  const handleRemoveTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags?.filter(t => t !== tag) || []
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const expenseData = {
        ...formData,
        date: new Date(formData.date).toISOString()
      }
      
      const expense = await expenseService.createExpense(expenseData)
      navigate(`/expenses/${expense.id}`)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create expense. Please try again.')
      console.error('Error creating expense:', err)
    } finally {
      setLoading(false)
    }
  }

  const selectedCategory = categories.find(c => c.value === formData.category)

  return (
    <div className="create-expense">
      <div className="container">
        <div className="page-header">
          <div>
            <h1>Add New Expense</h1>
            <p className="page-subtitle">Track your spending easily</p>
          </div>
          <button onClick={() => navigate(-1)} className="btn btn-secondary">
            ← Back
          </button>
        </div>

        <form onSubmit={handleSubmit} className="expense-form">
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <div className="form-section">
            <div className="form-row">
              <div className="form-group full-width">
                <label htmlFor="title">Expense Title *</label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="e.g., Grocery Shopping"
                  required
                  className="form-input"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="amount">Amount *</label>
                <div className="amount-input-wrapper">
                  <span className="currency-symbol">$</span>
                  <input
                    type="number"
                    id="amount"
                    name="amount"
                    value={formData.amount || ''}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    required
                    className="form-input amount-input"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="date">Date *</label>
                <input
                  type="date"
                  id="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  max={new Date().toISOString().split('T')[0]}
                  required
                  className="form-input"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="category">Category *</label>
                <div className="category-grid">
                  {categories.map(category => (
                    <button
                      key={category.value}
                      type="button"
                      className={`category-option ${formData.category === category.value ? 'active' : ''}`}
                      style={{
                        borderColor: formData.category === category.value ? category.color : 'var(--border-color)',
                        backgroundColor: formData.category === category.value ? `${category.color}15` : 'transparent'
                      }}
                      onClick={() => setFormData(prev => ({ ...prev, category: category.value as any }))}
                    >
                      {category.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="paymentMethod">Payment Method *</label>
                <select
                  id="paymentMethod"
                  name="paymentMethod"
                  value={formData.paymentMethod}
                  onChange={handleChange}
                  required
                  className="form-input"
                >
                  {paymentMethods.map(method => (
                    <option key={method.value} value={method.value}>
                      {method.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="location">Location</label>
                <input
                  type="text"
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="e.g., Walmart, Downtown"
                  className="form-input"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group full-width">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Add any additional notes..."
                  rows={3}
                  className="form-input"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group full-width">
                <label htmlFor="tags">Tags</label>
                <div className="tags-input-wrapper">
                  <input
                    type="text"
                    id="tags"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                    placeholder="Press Enter to add tag"
                    className="form-input"
                  />
                  <button
                    type="button"
                    onClick={handleAddTag}
                    className="btn-add-tag"
                    disabled={!tagInput.trim()}
                  >
                    Add
                  </button>
                </div>
                {formData.tags && formData.tags.length > 0 && (
                  <div className="tags-list">
                    {formData.tags.map(tag => (
                      <span key={tag} className="tag">
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="tag-remove"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="btn btn-secondary"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || !formData.title || !formData.amount}
            >
              {loading ? 'Adding...' : 'Add Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateExpense
