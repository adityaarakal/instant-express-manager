import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { incomeService, CreateIncomeRequest } from '../../services/incomeService'
import { CURRENCY_SYMBOL } from '../../utils/currency'
import './CreateIncome.css'

const CreateIncome: React.FC = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentStep, setCurrentStep] = useState(1)
  const totalSteps = 6
  const formRef = useRef<HTMLFormElement>(null)
  
  const [formData, setFormData] = useState<CreateIncomeRequest>({
    userId: 'default-user',
    title: '',
    description: '',
    amount: 0,
    category: 'salary',
    paymentMethod: 'cash',
    date: new Date().toISOString().split('T')[0],
    tags: [],
    location: ''
  })

  const [tagInput, setTagInput] = useState('')

  // Protect form inputs from browser extensions
  useEffect(() => {
    const protectInputs = () => {
      if (!formRef.current) return
      
      const inputs = formRef.current.querySelectorAll('input, textarea')
      inputs.forEach((input) => {
        const element = input as HTMLElement
        element.setAttribute('data-lpignore', 'true')
        element.setAttribute('data-1p-ignore', 'true')
        element.setAttribute('data-bwignore', 'true')
        element.setAttribute('data-form-type', 'other')
        element.setAttribute('autocomplete', 'off')
        
        if (document.activeElement !== element) {
          element.setAttribute('readonly', 'readonly')
          setTimeout(() => {
            if (document.activeElement !== element) {
              element.removeAttribute('readonly')
            }
          }, 50)
        }
      })
    }

    protectInputs()
    const interval = setInterval(protectInputs, 200)
    
    return () => clearInterval(interval)
  }, [currentStep])

  const categories = [
    { value: 'salary', label: 'Salary', color: '#10b981', icon: '💼' },
    { value: 'freelance', label: 'Freelance', color: '#3b82f6', icon: '💻' },
    { value: 'business', label: 'Business', color: '#8b5cf6', icon: '🏢' },
    { value: 'investment', label: 'Investment', color: '#f59e0b', icon: '📈' },
    { value: 'rental', label: 'Rental', color: '#ec4899', icon: '🏠' },
    { value: 'gift', label: 'Gift', color: '#f472b6', icon: '🎁' },
    { value: 'refund', label: 'Refund', color: '#06b6d4', icon: '↩️' },
    { value: 'other', label: 'Other', color: '#6366f1', icon: '💰' }
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
        return true
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
      let dateValue: string
      if (formData.date) {
        const dateStr = typeof formData.date === 'string' ? formData.date : formData.date.toString()
        const date = new Date(dateStr)
        date.setHours(0, 0, 0, 0)
        dateValue = date.toISOString()
      } else {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        dateValue = today.toISOString()
      }
      
      const incomeData: CreateIncomeRequest = {
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
      
      if (!incomeData.title || !incomeData.amount || !incomeData.category || !incomeData.paymentMethod) {
        setError('Please fill in all required fields')
        setLoading(false)
        return
      }

      const income = await incomeService.createIncome(incomeData)
      navigate(`/income/${income.id}`)
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to create income. Please try again.'
      setError(errorMessage)
      console.error('Error creating income:', err)
    } finally {
      setLoading(false)
    }
  }

  const stepTitles = [
    'What income did you receive?',
    'How much?',
    'When?',
    'Category',
    'Payment Method',
    'Additional Details'
  ]

  const stepIcons = ['✍️', '💰', '📅', '🏷️', '💳', '📝']

  return (
    <div className="create-income">
      <div className="container" style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div className="page-header">
          <div>
            <h1>Add New Income</h1>
            <p className="page-subtitle">Track your income sources</p>
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
          ref={formRef}
          onSubmit={handleSubmit} 
          className="income-form" 
          data-lpignore="true" 
          data-1p-ignore="true"
          data-bwignore="true"
          autoComplete="off"
          data-form-type="other"
          data-disable-autofill="true"
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
                <h2>What income did you receive?</h2>
                <p>Give your income a clear title</p>
              </div>
              <div className="step-body">
                <div className="form-group-focused">
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="e.g., Monthly Salary, Freelance Project, Investment Returns"
                    required
                    className="form-input-focused"
                    autoFocus
                    autoComplete="off"
                    data-lpignore="true"
                    data-form-type="other"
                    data-1p-ignore="true"
                    data-bwignore="true"
                    aria-label="Income title"
                    onFocus={(e) => {
                      e.target.removeAttribute('readonly')
                    }}
                    onBlur={(e) => {
                      setTimeout(() => {
                        if (document.activeElement !== e.target) {
                          e.target.setAttribute('readonly', 'readonly')
                        }
                      }, 100)
                    }}
                  />
                </div>
                <div className="step-hint">
                  <span>💡 Tip:</span> Be specific to track your income better
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Amount */}
          {currentStep === 2 && (
            <div className="step-content">
              <div className="step-icon-large">💰</div>
              <div className="step-header">
                <h2>How much did you receive?</h2>
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
                    aria-label="Income amount"
                    onFocus={(e) => {
                      e.target.removeAttribute('readonly')
                    }}
                    onBlur={(e) => {
                      setTimeout(() => {
                        if (document.activeElement !== e.target) {
                          e.target.setAttribute('readonly', 'readonly')
                        }
                      }, 100)
                    }}
                  />
                </div>
                <div className="quick-amounts">
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
                  <button
                    type="button"
                    className="quick-amount-btn"
                    onClick={() => {
                      setFormData(prev => ({ ...prev, amount: 10000 }))
                      setError(null)
                    }}
                  >
                    ₹10K
                  </button>
                  <button
                    type="button"
                    className="quick-amount-btn"
                    onClick={() => {
                      setFormData(prev => ({ ...prev, amount: 50000 }))
                      setError(null)
                    }}
                  >
                    ₹50K
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
                <h2>When did you receive this?</h2>
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
                    aria-label="Income date"
                    onFocus={(e) => {
                      e.target.removeAttribute('readonly')
                    }}
                    onBlur={(e) => {
                      setTimeout(() => {
                        if (document.activeElement !== e.target) {
                          e.target.setAttribute('readonly', 'readonly')
                        }
                      }, 100)
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
                <p>Select the income source category</p>
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
                <h2>How did you receive it?</h2>
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
                    placeholder="e.g., Company Name, Client Location"
                    className="form-input"
                    autoComplete="off"
                    data-lpignore="true"
                    data-form-type="other"
                    data-1p-ignore="true"
                    data-bwignore="true"
                    aria-label="Location (optional)"
                    onFocus={(e) => {
                      e.target.removeAttribute('readonly')
                    }}
                    onBlur={(e) => {
                      setTimeout(() => {
                        if (document.activeElement !== e.target) {
                          e.target.setAttribute('readonly', 'readonly')
                        }
                      }, 100)
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
                    placeholder="Add any additional notes about this income..."
                    rows={4}
                    className="form-input"
                    autoComplete="off"
                    data-lpignore="true"
                    data-form-type="other"
                    data-1p-ignore="true"
                    data-bwignore="true"
                    aria-label="Description (optional)"
                    onFocus={(e) => {
                      e.target.removeAttribute('readonly')
                    }}
                    onBlur={(e) => {
                      setTimeout(() => {
                        if (document.activeElement !== e.target) {
                          e.target.setAttribute('readonly', 'readonly')
                        }
                      }, 100)
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
                        e.target.removeAttribute('readonly')
                      }}
                      onBlur={(e) => {
                        setTimeout(() => {
                          if (document.activeElement !== e.target) {
                            e.target.setAttribute('readonly', 'readonly')
                          }
                        }, 100)
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
                {loading ? 'Creating...' : '✨ Create Income'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateIncome

