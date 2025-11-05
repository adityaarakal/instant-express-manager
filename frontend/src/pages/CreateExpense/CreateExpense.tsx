import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { expenseService, CreateExpenseRequest } from '../../services/expenseService'
import { CURRENCY_SYMBOL } from '../../utils/currency'
import './CreateExpense.css'

const CreateExpense: React.FC = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentStep, setCurrentStep] = useState(1)
  const totalSteps = 6
  
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
    { value: 'food', label: 'Food', color: '#FF6B6B', icon: '🍔' },
    { value: 'transport', label: 'Transport', color: '#4ECDC4', icon: '🚗' },
    { value: 'shopping', label: 'Shopping', color: '#95E1D3', icon: '🛍️' },
    { value: 'bills', label: 'Bills', color: '#F38181', icon: '💳' },
    { value: 'entertainment', label: 'Entertainment', color: '#AA96DA', icon: '🎬' },
    { value: 'health', label: 'Health', color: '#FCBAD3', icon: '🏥' },
    { value: 'education', label: 'Education', color: '#FDFFAB', icon: '📚' },
    { value: 'travel', label: 'Travel', color: '#A8E6CF', icon: '✈️' },
    { value: 'other', label: 'Other', color: '#FFD3A5', icon: '📦' }
  ]

  const paymentMethods = [
    { value: 'cash', label: 'Cash', icon: '💵' },
    { value: 'card', label: 'Card', icon: '💳' },
    { value: 'digital_wallet', label: 'Digital Wallet', icon: '📱' },
    { value: 'bank_transfer', label: 'Bank Transfer', icon: '🏦' },
    { value: 'other', label: 'Other', icon: '🔀' }
  ]

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'amount' ? parseFloat(value) || 0 : value
    }))
    setError(null)
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

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!formData.title.trim()
      case 2:
        return formData.amount > 0
      case 3:
        return !!formData.date
      case 4:
        return !!formData.category
      case 5:
        return !!formData.paymentMethod
      case 6:
        return true // Optional step
      default:
        return false
    }
  }

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < totalSteps) {
        setCurrentStep(currentStep + 1)
        setError(null)
      }
    } else {
      setError('Please fill in this field to continue')
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
      setError(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateStep(1) || !validateStep(2) || !validateStep(3) || !validateStep(4) || !validateStep(5)) {
      setError('Please complete all required steps')
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Ensure date is properly formatted - create date at start of day to avoid timezone issues
      let dateValue: string
      if (formData.date) {
        // Create date from the date string (YYYY-MM-DD format)
        const dateStr = typeof formData.date === 'string' ? formData.date : formData.date.toString()
        // Parse the date and set to start of day in local timezone
        const date = new Date(dateStr)
        date.setHours(0, 0, 0, 0)
        dateValue = date.toISOString()
      } else {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        dateValue = today.toISOString()
      }
      
      const expenseData: CreateExpenseRequest = {
        userId: formData.userId,
        title: formData.title.trim(),
        amount: Number(formData.amount),
        category: formData.category,
        paymentMethod: formData.paymentMethod,
        date: dateValue,
        description: formData.description?.trim() || undefined,
        location: formData.location?.trim() || undefined,
        tags: formData.tags && formData.tags.length > 0 ? formData.tags : undefined
      }
      
      // Validate required fields
      if (!expenseData.title || !expenseData.amount || !expenseData.category || !expenseData.paymentMethod) {
        setError('Please fill in all required fields')
        setLoading(false)
        return
      }

      const expense = await expenseService.createExpense(expenseData)
      navigate(`/expenses/${expense.id}`)
    } catch (err: any) {
      const errorMessage = err.message || 
                          (err.response?.data?.error || err.response?.data?.message) ||
                          'Failed to create expense. Please try again.'
      setError(errorMessage)
      console.error('Error creating expense:', err)
    } finally {
      setLoading(false)
    }
  }

  const stepTitles = [
    'What did you spend on?',
    'How much?',
    'When?',
    'Category',
    'Payment Method',
    'Additional Details'
  ]

  const stepIcons = ['✍️', '💰', '📅', '🏷️', '💳', '📝']

  return (
    <div className="create-expense">
      <div className="container">
        <div className="page-header">
          <div>
            <h1>Add New Expense</h1>
            <p className="page-subtitle">Quick and simple expense tracking</p>
          </div>
          <button onClick={() => navigate(-1)} className="btn btn-secondary btn-icon">
            ✕
          </button>
        </div>

        {/* Stepper Progress */}
        <div className="stepper-container">
          {stepTitles.map((title, index) => {
            const stepNumber = index + 1
            const isActive = currentStep === stepNumber
            const isCompleted = currentStep > stepNumber
            const isClickable = isCompleted

            return (
              <React.Fragment key={stepNumber}>
                <div
                  className={`stepper-step ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''} ${isClickable ? 'clickable' : ''}`}
                  onClick={() => isClickable && setCurrentStep(stepNumber)}
                >
                  <div className="stepper-circle">
                    {isCompleted ? (
                      <span className="stepper-check">✓</span>
                    ) : (
                      <span className="stepper-icon">{stepIcons[index]}</span>
                    )}
                  </div>
                  <div className="stepper-label">{stepNumber}</div>
                </div>
                {stepNumber < totalSteps && (
                  <div className={`stepper-line ${isCompleted ? 'completed' : ''}`} />
                )}
              </React.Fragment>
            )
          })}
        </div>

        <form 
          onSubmit={handleSubmit} 
          className="expense-form" 
          data-lpignore="true" 
          data-1p-ignore="true"
          data-bwignore="true"
          autoComplete="off"
          data-form-type="other"
        >
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          {/* Step 1: Title */}
          {currentStep === 1 && (
            <div className="step-content">
              <div className="step-icon-large">✍️</div>
              <div className="step-header">
                <h2>What did you spend on?</h2>
                <p>Give your expense a clear title</p>
              </div>
              <div className="step-body">
                <div className="form-group-focused">
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="e.g., Grocery Shopping, Lunch at Restaurant"
                    required
                    className="form-input-focused"
                    autoFocus
                    autoComplete="off"
                    data-lpignore="true"
                    data-form-type="other"
                    data-1p-ignore="true"
                    data-bwignore="true"
                    aria-label="Expense title"
                    onFocus={(e) => {
                      // Prevent browser extensions from interfering
                      e.target.setAttribute('readonly', 'readonly')
                      setTimeout(() => e.target.removeAttribute('readonly'), 100)
                    }}
                  />
                </div>
                <div className="step-hint">
                  <span>💡 Tip:</span> Be specific to track your spending better
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Amount */}
          {currentStep === 2 && (
            <div className="step-content">
              <div className="step-icon-large">💰</div>
              <div className="step-header">
                <h2>How much did you spend?</h2>
                <p>Enter the amount</p>
              </div>
              <div className="step-body">
                <div className="form-group-focused amount-group">
                  <div className="currency-display">{CURRENCY_SYMBOL}</div>
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
                    className="form-input-focused amount-input-large"
                    autoFocus
                    autoComplete="off"
                    data-lpignore="true"
                    data-form-type="other"
                    data-1p-ignore="true"
                    data-bwignore="true"
                    aria-label="Expense amount"
                    onFocus={(e) => {
                      e.target.setAttribute('readonly', 'readonly')
                      setTimeout(() => e.target.removeAttribute('readonly'), 100)
                    }}
                  />
                </div>
                <div className="quick-amounts">
                  <button
                    type="button"
                    className="quick-amount-btn"
                    onClick={() => {
                      setFormData(prev => ({ ...prev, amount: 100 }))
                      setError(null)
                    }}
                  >
                    ₹100
                  </button>
                  <button
                    type="button"
                    className="quick-amount-btn"
                    onClick={() => {
                      setFormData(prev => ({ ...prev, amount: 500 }))
                      setError(null)
                    }}
                  >
                    ₹500
                  </button>
                  <button
                    type="button"
                    className="quick-amount-btn"
                    onClick={() => {
                      setFormData(prev => ({ ...prev, amount: 1000 }))
                      setError(null)
                    }}
                  >
                    ₹1K
                  </button>
                  <button
                    type="button"
                    className="quick-amount-btn"
                    onClick={() => {
                      setFormData(prev => ({ ...prev, amount: 5000 }))
                      setError(null)
                    }}
                  >
                    ₹5K
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Date */}
          {currentStep === 3 && (
            <div className="step-content">
              <div className="step-icon-large">📅</div>
              <div className="step-header">
                <h2>When did this happen?</h2>
                <p>Select the date</p>
              </div>
              <div className="step-body">
                <div className="form-group-focused">
                  <input
                    type="date"
                    id="date"
                    name="date"
                    value={formData.date}
                    onChange={handleChange}
                    max={new Date().toISOString().split('T')[0]}
                    required
                    className="form-input-focused date-input-large"
                    autoFocus
                    autoComplete="off"
                    data-lpignore="true"
                    data-form-type="other"
                    data-1p-ignore="true"
                    data-bwignore="true"
                    aria-label="Expense date"
                    onFocus={(e) => {
                      e.target.setAttribute('readonly', 'readonly')
                      setTimeout(() => e.target.removeAttribute('readonly'), 100)
                    }}
                  />
                </div>
                <div className="quick-dates">
                  <button
                    type="button"
                    className="quick-date-btn"
                    onClick={() => {
                      const today = new Date().toISOString().split('T')[0]
                      setFormData(prev => ({ ...prev, date: today }))
                      setError(null)
                    }}
                  >
                    Today
                  </button>
                  <button
                    type="button"
                    className="quick-date-btn"
                    onClick={() => {
                      const yesterday = new Date()
                      yesterday.setDate(yesterday.getDate() - 1)
                      setFormData(prev => ({ ...prev, date: yesterday.toISOString().split('T')[0] }))
                      setError(null)
                    }}
                  >
                    Yesterday
                  </button>
                  <button
                    type="button"
                    className="quick-date-btn"
                    onClick={() => {
                      const weekAgo = new Date()
                      weekAgo.setDate(weekAgo.getDate() - 7)
                      setFormData(prev => ({ ...prev, date: weekAgo.toISOString().split('T')[0] }))
                      setError(null)
                    }}
                  >
                    Last Week
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Category */}
          {currentStep === 4 && (
            <div className="step-content">
              <div className="step-icon-large">🏷️</div>
              <div className="step-header">
                <h2>What category?</h2>
                <p>Select the category that fits best</p>
              </div>
              <div className="step-body">
                <div className="category-grid-large">
                  {categories.map(category => (
                    <button
                      key={category.value}
                      type="button"
                      className={`category-option-large ${formData.category === category.value ? 'active' : ''}`}
                      style={{
                        borderColor: formData.category === category.value ? category.color : 'var(--border-color)',
                        backgroundColor: formData.category === category.value ? `${category.color}15` : 'transparent',
                        '--category-color': category.color
                      } as React.CSSProperties}
                      onClick={() => {
                        setFormData(prev => ({ ...prev, category: category.value as any }))
                        setError(null)
                      }}
                      role="button"
                      aria-label={`Select ${category.label} category`}
                      aria-pressed={formData.category === category.value}
                      data-lpignore="true"
                    >
                      <span className="category-icon-large">{category.icon}</span>
                      <span className="category-text-large">{category.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Payment Method */}
          {currentStep === 5 && (
            <div className="step-content">
              <div className="step-icon-large">💳</div>
              <div className="step-header">
                <h2>How did you pay?</h2>
                <p>Select your payment method</p>
              </div>
              <div className="step-body">
                <div className="payment-methods-grid-large">
                  {paymentMethods.map(method => (
                    <button
                      key={method.value}
                      type="button"
                      className={`payment-method-option-large ${formData.paymentMethod === method.value ? 'active' : ''}`}
                      onClick={() => {
                        setFormData(prev => ({ ...prev, paymentMethod: method.value as any }))
                        setError(null)
                      }}
                      role="button"
                      aria-label={`Select ${method.label} payment method`}
                      aria-pressed={formData.paymentMethod === method.value}
                      data-lpignore="true"
                    >
                      <span className="payment-icon-large">{method.icon}</span>
                      <span className="payment-text-large">{method.label}</span>
                    </button>
                  ))}
                </div>
                <div className="form-group-optional">
                  <label htmlFor="location">📍 Location (Optional)</label>
                  <input
                    type="text"
                    id="location"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    placeholder="e.g., Big Bazaar, MG Road, Koramangala"
                    className="form-input"
                    autoComplete="off"
                    data-lpignore="true"
                    data-form-type="other"
                    data-1p-ignore="true"
                    data-bwignore="true"
                    aria-label="Location (optional)"
                    onFocus={(e) => {
                      e.target.setAttribute('readonly', 'readonly')
                      setTimeout(() => e.target.removeAttribute('readonly'), 100)
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 6: Additional Details */}
          {currentStep === 6 && (
            <div className="step-content">
              <div className="step-icon-large">📝</div>
              <div className="step-header">
                <h2>Anything else?</h2>
                <p>Add optional details to help you remember</p>
              </div>
              <div className="step-body">
                <div className="form-group-optional">
                  <label htmlFor="description">📝 Description (Optional)</label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Add any additional notes about this expense..."
                    rows={4}
                    className="form-input"
                    autoComplete="off"
                    data-lpignore="true"
                    data-form-type="other"
                    data-1p-ignore="true"
                    data-bwignore="true"
                    aria-label="Description (optional)"
                    onFocus={(e) => {
                      e.target.setAttribute('readonly', 'readonly')
                      setTimeout(() => e.target.removeAttribute('readonly'), 100)
                    }}
                  />
                </div>

                <div className="form-group-optional">
                  <label htmlFor="tags">🏷️ Tags (Optional)</label>
                  <div className="tags-input-wrapper">
                    <input
                      type="text"
                      id="tags"
                      name="tags"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                      placeholder="Press Enter to add tag"
                      className="form-input"
                      autoComplete="off"
                      data-lpignore="true"
                      data-form-type="other"
                      data-1p-ignore="true"
                      data-bwignore="true"
                      aria-label="Tags (optional)"
                      onFocus={(e) => {
                        e.target.setAttribute('readonly', 'readonly')
                        setTimeout(() => e.target.removeAttribute('readonly'), 100)
                      }}
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
          )}

          {/* Navigation Buttons */}
          <div className="step-navigation">
            <button
              type="button"
              onClick={handlePrevious}
              className="btn btn-secondary btn-nav"
              disabled={currentStep === 1 || loading}
            >
              ← Previous
            </button>

            {currentStep < totalSteps ? (
              <button
                type="button"
                onClick={handleNext}
                className="btn btn-primary btn-nav"
                disabled={loading}
              >
                Next →
              </button>
            ) : (
              <button
                type="submit"
                className="btn btn-primary btn-nav"
                disabled={loading}
              >
                {loading ? 'Creating...' : '✨ Create Expense'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateExpense