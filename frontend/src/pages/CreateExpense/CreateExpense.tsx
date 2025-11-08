import React, { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { expenseService, CreateExpenseRequest } from '../../services/expenseService'
import { bankAccountService, BankAccount } from '../../services/bankAccountService'
import { CURRENCY_SYMBOL } from '../../utils/currency'
import './CreateExpense.css'

const CreateExpense: React.FC = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const editId = searchParams.get('edit')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentStep, setCurrentStep] = useState(1)
  const [isRecurringDecided, setIsRecurringDecided] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [loadingExpense, setLoadingExpense] = useState(!!editId)
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([])
  const [hasCreditCard, setHasCreditCard] = useState(false)
  
  const [formData, setFormData] = useState<CreateExpenseRequest>({
    userId: 'default-user',
    title: '',
    description: '',
    amount: 0,
    category: 'food',
    paymentMethod: 'cash',
    date: new Date().toISOString().split('T')[0],
    tags: [],
    location: '',
    paymentStatus: 'pending',
    isRecurring: false,
    recurrenceType: undefined,
    recurrenceInterval: 1,
    endDate: undefined,
    actualAmount: undefined,
    emiAmount: undefined,
    emiStartDate: undefined,
    emiEndDate: undefined,
    accountId: undefined,
    creditCardId: undefined,
    creditCardInfo: undefined
  })

  const [tagInput, setTagInput] = useState('')

  const stepTitles = useMemo(() => {
    if (!isRecurringDecided) {
      return ['Recurring Expense?']
    }

    if (!formData.isRecurring) {
      return [
        'Recurring Expense?',
        'What did you spend on?',
        'How much?',
        'When?',
        'Category',
        'Payment Method',
        'Payment Status',
        'Additional Details'
      ]
    }

    return [
      'Recurring Expense?',
      'Expense Details',
      'Actual Amount',
      'Monthly EMI',
      'EMI Schedule',
      'EMI End Date',
      'Category',
      'Payment Method',
      'Deduction Account',
      'Credit Card',
      'Payment Status',
      'Additional Details'
    ]
  }, [isRecurringDecided, formData.isRecurring])

  const stepIcons = useMemo(() => {
    if (!isRecurringDecided) {
      return ['🔄']
    }

    if (!formData.isRecurring) {
      return ['🔄', '✍️', '💰', '📅', '🏷️', '💳', '✅', '📝']
    }

    return ['🔄', '✍️', '💰', '💵', '📅', '📅', '🏷️', '💳', '🏦', '💳', '✅', '📝']
  }, [isRecurringDecided, formData.isRecurring])

  const totalSteps = stepTitles.length

  // Load bank accounts
  useEffect(() => {
    const loadBankAccounts = async () => {
      try {
        const userId = 'default-user'
        const accounts = await bankAccountService.getAccounts(userId)
        setBankAccounts(accounts)
      } catch (err) {
        console.error('Error loading bank accounts:', err)
      }
    }
    loadBankAccounts()
  }, [])

  // Load expense data when editing
  useEffect(() => {
    const loadExpenseData = async () => {
      if (!editId) return

      setLoadingExpense(true)
      try {
        const userId = 'default-user'
        const expense = await expenseService.getExpenseById(editId, userId)
        
        // Convert date from ISO string to YYYY-MM-DD format for date input
        const expenseDate = new Date(expense.date)
        const formattedDate = expenseDate.toISOString().split('T')[0]
        
        setFormData({
          userId: expense.userId,
          title: expense.title,
          description: expense.description || '',
          amount: expense.amount,
          category: expense.category,
          paymentMethod: expense.paymentMethod,
          date: formattedDate,
          tags: expense.tags || [],
          location: expense.location || '',
          paymentStatus: expense.paymentStatus || 'pending',
          isRecurring: expense.isRecurring || false,
          recurrenceType: expense.recurrenceType,
          recurrenceInterval: expense.recurrenceInterval || 1,
          endDate: expense.endDate ? new Date(expense.endDate).toISOString().split('T')[0] : undefined,
          actualAmount: expense.actualAmount,
          emiAmount: expense.emiAmount,
          emiStartDate: expense.emiStartDate ? new Date(expense.emiStartDate).toISOString().split('T')[0] : undefined,
          emiEndDate: expense.emiEndDate ? new Date(expense.emiEndDate).toISOString().split('T')[0] : undefined,
          accountId: expense.accountId,
          creditCardId: expense.creditCardId,
          creditCardInfo: expense.creditCardInfo
        })
        setIsEditing(true)
        setIsRecurringDecided(true)
        if (expense.creditCardId || expense.creditCardInfo) {
          setHasCreditCard(true)
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to load expense data'
        setError(message)
        console.error('Error loading expense:', err)
      } finally {
        setLoadingExpense(false)
      }
    }

    loadExpenseData()
  }, [editId])

  // Protect form inputs from browser extensions
  useEffect(() => {
    const protectInputs = () => {
      if (!formRef.current) return
      
      const inputs = formRef.current.querySelectorAll('input, textarea')
      inputs.forEach((input) => {
        const element = input as HTMLElement
        // Add extension-blocking attributes
        element.setAttribute('data-lpignore', 'true')
        element.setAttribute('data-1p-ignore', 'true')
        element.setAttribute('data-bwignore', 'true')
        element.setAttribute('data-form-type', 'other')
        element.setAttribute('autocomplete', 'off')
        
        // Temporarily make readonly to prevent extension interference
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

    // Run on mount and when step changes
    protectInputs()
    const interval = setInterval(protectInputs, 200)
    
    return () => clearInterval(interval)
  }, [currentStep])

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

    const decimalFields = ['amount', 'actualAmount', 'emiAmount']
    const integerFields = ['recurrenceInterval']

    let parsedValue: string | number | undefined = value

    if (decimalFields.includes(name)) {
      parsedValue = value === '' ? undefined : parseFloat(value)
      if (Number.isNaN(parsedValue)) {
        parsedValue = undefined
      }
    } else if (integerFields.includes(name)) {
      parsedValue = value === '' ? undefined : parseInt(value, 10)
      if (Number.isNaN(parsedValue)) {
        parsedValue = undefined
      }
    }

    setFormData(prev => ({
      ...prev,
      [name]: parsedValue
    }))
    setError(null)
  }

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
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

  const handleAccountSelect = (accountId: string) => {
    setFormData(prev => ({
      ...prev,
      accountId
    }))
    setError(null)
  }

  const handleCreditCardInfoChange = (field: 'cardName' | 'cardNumber' | 'bankName' | 'cardType', value: string) => {
    setFormData(prev => ({
      ...prev,
      creditCardInfo: {
        ...(prev.creditCardInfo || {}),
        [field]: value
      }
    }))
    setError(null)
  }

  const handleCreditCardToggle = (value: boolean) => {
    setHasCreditCard(value)
    if (!value) {
      setFormData(prev => ({
        ...prev,
        creditCardId: undefined,
        creditCardInfo: undefined
      }))
    }
    setError(null)
  }

  const validateStep = (step: number): boolean => {
    // Step 1: Recurring choice
    if (step === 1) {
      return isRecurringDecided
    }

    if (!isRecurringDecided) return false

    // Non-recurring flow
    if (!formData.isRecurring) {
      switch (step) {
        case 2:
          return !!formData.title.trim()
        case 3:
          return (formData.amount ?? 0) > 0
        case 4:
          return !!formData.date
        case 5:
          return !!formData.category
        case 6:
          return !!formData.paymentMethod
        case 7:
          return !!formData.paymentStatus
        case 8:
          return true // Optional step
        default:
          return false
      }
    }

    // Recurring flow
    switch (step) {
      case 2:
        return !!formData.title.trim()
      case 3:
        return formData.actualAmount !== undefined && formData.actualAmount > 0
      case 4:
        return formData.emiAmount !== undefined && formData.emiAmount > 0
      case 5:
        return Boolean(
          formData.emiStartDate &&
          formData.recurrenceType &&
          (formData.recurrenceInterval ?? 0) > 0
        )
      case 6:
        if (!formData.emiEndDate) return false
        if (formData.emiStartDate) {
          const start = new Date(formData.emiStartDate)
          const end = new Date(formData.emiEndDate)
          return end >= start
        }
        return true
      case 7:
        return !!formData.category
      case 8:
        return !!formData.paymentMethod
      case 9:
        return !!formData.accountId
      case 10:
        if (hasCreditCard) {
          const info = formData.creditCardInfo
          return Boolean(
            (formData.creditCardId && formData.creditCardId.trim().length > 0) ||
            (info &&
              ((info.cardNumber && info.cardNumber.trim().length > 0) ||
               (info.cardName && info.cardName.trim().length > 0)))
          )
        }
        return true
      case 11:
        return !!formData.paymentStatus
      case 12:
        return true // Optional step
      default:
        return false
    }
  }

  const handleNext = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }

    if (!validateStep(currentStep)) {
      setError('Please fill in this field to continue')
      return
    }

    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
      setError(null)
    }
  }

  const handleRecurringChoice = (isRecurring: boolean) => {
    setFormData(prev => ({
      ...prev,
      isRecurring,
      recurrenceType: isRecurring ? (prev.recurrenceType || 'monthly') : undefined,
      recurrenceInterval: isRecurring ? (prev.recurrenceInterval || 1) : undefined,
      actualAmount: isRecurring ? prev.actualAmount : undefined,
      emiAmount: isRecurring ? prev.emiAmount : undefined,
      emiStartDate: isRecurring ? prev.emiStartDate : undefined,
      emiEndDate: isRecurring ? prev.emiEndDate : undefined,
      accountId: isRecurring ? prev.accountId : undefined,
      creditCardId: isRecurring ? prev.creditCardId : undefined,
      creditCardInfo: isRecurring ? prev.creditCardInfo : undefined,
      date: !isRecurring ? (prev.date || new Date().toISOString().split('T')[0]) : prev.date
    }))
    if (!isRecurring) {
      setHasCreditCard(false)
    }
    setIsRecurringDecided(true)
    setCurrentStep(2)
    setError(null)
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
      setError(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate all steps
    let allValid = true
    for (let i = 1; i <= totalSteps; i++) {
      if (!validateStep(i)) {
        allValid = false
        break
      }
    }

    if (!allValid) {
      setError('Please complete all required steps')
      return
    }

    setLoading(true)
    setError(null)

    try {
      // For recurring expenses, use EMI start date as the main date
      // For non-recurring, use the selected date
      let dateValue: string
      if (formData.isRecurring && formData.emiStartDate) {
        const date = new Date(formData.emiStartDate)
        date.setHours(0, 0, 0, 0)
        dateValue = date.toISOString()
      } else if (formData.date) {
        const dateStr = typeof formData.date === 'string' ? formData.date : formData.date.toString()
        const date = new Date(dateStr)
        date.setHours(0, 0, 0, 0)
        dateValue = date.toISOString()
      } else {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        dateValue = today.toISOString()
      }

      // For recurring expenses, calculate end date from EMI end date
      let endDateValue: string | undefined
      if (formData.isRecurring && formData.emiEndDate) {
        const endDate = new Date(formData.emiEndDate)
        endDate.setHours(23, 59, 59, 999)
        endDateValue = endDate.toISOString()
      } else {
        endDateValue = formData.endDate ? new Date(formData.endDate).toISOString() : undefined
      }

      const cleanedTags = formData.tags
        ?.map(tag => tag.trim())
        .filter(tag => tag.length > 0)

      const cleanedCreditCardInfo = (() => {
        if (!formData.isRecurring || !hasCreditCard) return undefined
        const info = {
          cardName: formData.creditCardInfo?.cardName?.trim() || undefined,
          cardNumber: formData.creditCardInfo?.cardNumber?.trim() || undefined,
          bankName: formData.creditCardInfo?.bankName?.trim() || undefined,
          cardType: formData.creditCardInfo?.cardType?.trim() || undefined
        }
        const hasInfo = Object.values(info).some(Boolean)
        return hasInfo ? info : undefined
      })()

      const cleanedCreditCardId =
        formData.isRecurring && formData.creditCardId
          ? formData.creditCardId.trim() || undefined
          : undefined

      const expenseData: CreateExpenseRequest = {
        userId: formData.userId,
        title: formData.title.trim(),
        amount: formData.isRecurring ? (formData.emiAmount || 0) : Number(formData.amount || 0),
        category: formData.category,
        paymentMethod: formData.paymentMethod,
        date: dateValue,
        description: formData.description?.trim() || undefined,
        location: formData.location?.trim() || undefined,
        tags: cleanedTags && cleanedTags.length > 0 ? cleanedTags : undefined,
        paymentStatus: formData.paymentStatus || 'pending',
        isRecurring: formData.isRecurring || false,
        recurrenceType: formData.isRecurring ? (formData.recurrenceType || 'monthly') : undefined,
        recurrenceInterval: formData.isRecurring ? (formData.recurrenceInterval || 1) : undefined,
        endDate: endDateValue,
        // EMI/Recurring specific fields
        actualAmount: formData.isRecurring ? formData.actualAmount : undefined,
        emiAmount: formData.isRecurring ? formData.emiAmount : undefined,
        emiStartDate:
          formData.isRecurring && formData.emiStartDate
            ? (() => {
                const start = new Date(formData.emiStartDate as string)
                start.setHours(0, 0, 0, 0)
                return start.toISOString()
              })()
            : undefined,
        emiEndDate:
          formData.isRecurring && formData.emiEndDate
            ? (() => {
                const end = new Date(formData.emiEndDate as string)
                end.setHours(23, 59, 59, 999)
                return end.toISOString()
              })()
            : undefined,
        accountId: formData.isRecurring ? formData.accountId : undefined,
        creditCardId: cleanedCreditCardId,
        creditCardInfo: cleanedCreditCardInfo
      }
      
      // Validate required fields
      if (!expenseData.title || !expenseData.amount || !expenseData.category || !expenseData.paymentMethod) {
        setError('Please fill in all required fields')
        setLoading(false)
        return
      }

      if (isEditing && editId) {
        // Update existing expense
        const updatedExpense = await expenseService.updateExpense(editId, expenseData, formData.userId)
        navigate(`/expenses/${updatedExpense.id}`)
      } else {
        // Create new expense
        const expense = await expenseService.createExpense(expenseData)
        navigate(`/expenses/${expense.id}`)
      }
    } catch (err: unknown) {
      let errorMessage = 'Failed to create expense. Please try again.'
      if (err instanceof Error && err.message) {
        errorMessage = err.message
      } else if (typeof err === 'object' && err !== null) {
        const maybeResponse = (err as { response?: { data?: { error?: string; message?: string } } }).response
        if (maybeResponse?.data?.error) {
          errorMessage = maybeResponse.data.error
        } else if (maybeResponse?.data?.message) {
          errorMessage = maybeResponse.data.message
        }
      }
      setError(errorMessage)
      console.error('Error creating expense:', err)
    } finally {
      setLoading(false)
    }
  }

  const renderPaymentStatusStep = (title: string, subtitle: string) => (
    <div className="step-content">
      <div className="step-icon-large">✅</div>
      <div className="step-header">
        <h2>{title}</h2>
        <p>{subtitle}</p>
      </div>
      <div className="step-body">
        <div className="payment-status-buttons">
          <button
            type="button"
            className={`payment-status-option ${formData.paymentStatus === 'paid' ? 'active' : ''}`}
            onClick={() => {
              setFormData(prev => ({ ...prev, paymentStatus: 'paid' }))
              setError(null)
            }}
          >
            <span>✅ Paid</span>
          </button>
          <button
            type="button"
            className={`payment-status-option ${formData.paymentStatus === 'pending' ? 'active' : ''}`}
            onClick={() => {
              setFormData(prev => ({ ...prev, paymentStatus: 'pending' }))
              setError(null)
            }}
          >
            <span>⏳ Pending</span>
          </button>
        </div>
        <p className="form-help-text">
          Choose whether this amount has already been paid or is planned for later.
        </p>
      </div>
    </div>
  )

  const renderAdditionalDetailsStep = (subtitle = 'Add optional details to keep everything organised') => (
    <div className="step-content">
      <div className="step-icon-large">📝</div>
      <div className="step-header">
        <h2>Anything else?</h2>
        <p>{subtitle}</p>
      </div>
      <div className="step-body">
        <div className="form-group-optional">
          <label htmlFor="description">📝 Description (Optional)</label>
          <textarea
            id="description"
            name="description"
            value={formData.description ?? ''}
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
          <label htmlFor="location">📍 Location (Optional)</label>
          <input
            type="text"
            id="location"
            name="location"
            value={formData.location ?? ''}
            onChange={handleChange}
            placeholder="Where did this transaction occur?"
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
  )

  const renderCategoryStep = (title: string, subtitle: string) => (
    <div className="step-content">
      <div className="step-icon-large">🏷️</div>
      <div className="step-header">
        <h2>{title}</h2>
        <p>{subtitle}</p>
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
                setFormData(prev => ({ ...prev, category: category.value }))
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
  )

  const renderPaymentMethodStep = (title: string, subtitle: string) => (
    <div className="step-content">
      <div className="step-icon-large">💳</div>
      <div className="step-header">
        <h2>{title}</h2>
        <p>{subtitle}</p>
      </div>
      <div className="step-body">
        <div className="payment-methods-grid-large">
          {paymentMethods.map(method => (
            <button
              key={method.value}
              type="button"
              className={`payment-method-option-large ${formData.paymentMethod === method.value ? 'active' : ''}`}
              onClick={() => {
                setFormData(prev => ({ ...prev, paymentMethod: method.value }))
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
      </div>
    </div>
  )

  type AmountField = 'amount' | 'actualAmount' | 'emiAmount'

  const renderAmountStep = (
    field: AmountField,
    icon: string,
    title: string,
    subtitle: string,
    quickAmounts: number[]
  ) => {
    const value = formData[field] as number | undefined

    return (
      <div className="step-content">
        <div className="step-icon-large">{icon}</div>
        <div className="step-header">
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>
        <div className="step-body">
          <div className="form-group-focused amount-group">
            <div className="currency-display">{CURRENCY_SYMBOL}</div>
            <input
              type="number"
              id={field}
              name={field}
              value={value ?? ''}
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
              aria-label={title}
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
          {quickAmounts.length > 0 && (
            <div className="quick-amounts">
              {quickAmounts.map(amountValue => (
                <button
                  type="button"
                  key={amountValue}
                  className="quick-amount-btn"
                  onClick={() => {
                  setFormData(prev => {
                    const nextState: CreateExpenseRequest = {
                      ...prev,
                      [field]: amountValue
                    } as CreateExpenseRequest
                    return nextState
                  })
                  setError(null)
                }}
                >
                  {CURRENCY_SYMBOL}{amountValue.toLocaleString()}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  const renderNonRecurringDateStep = () => (
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
  )

  const renderRecurringScheduleStep = () => (
    <div className="step-content">
      <div className="step-icon-large">📅</div>
      <div className="step-header">
        <h2>When does the EMI start?</h2>
        <p>Set the start date and frequency for this recurring payment</p>
      </div>
      <div className="step-body">
        <div className="form-group">
          <label htmlFor="emiStartDate">EMI Start Date</label>
          <input
            type="date"
            id="emiStartDate"
            name="emiStartDate"
            value={formData.emiStartDate || ''}
            onChange={handleChange}
            min={formData.date}
            required
            className="form-input"
            autoComplete="off"
            data-lpignore="true"
            data-form-type="other"
            data-1p-ignore="true"
            data-bwignore="true"
            aria-label="EMI start date"
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

        <div className="form-group-split">
          <div className="form-group">
            <label htmlFor="recurrenceInterval">Repeats every</label>
            <input
              type="number"
              id="recurrenceInterval"
              name="recurrenceInterval"
              min={1}
              value={formData.recurrenceInterval ?? 1}
              onChange={handleChange}
              className="form-input"
            />
          </div>
          <div className="form-group">
            <label htmlFor="recurrenceType">Frequency</label>
            <select
              id="recurrenceType"
              name="recurrenceType"
              value={formData.recurrenceType || 'monthly'}
              onChange={handleSelectChange}
              className="form-input"
            >
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>
        </div>
        <p className="form-help-text">
          Example: Every <strong>{formData.recurrenceInterval ?? 1}</strong>{' '}
          {formData.recurrenceType || 'month'}(s)
        </p>
      </div>
    </div>
  )

  const renderRecurringEndDateStep = () => (
    <div className="step-content">
      <div className="step-icon-large">📅</div>
      <div className="step-header">
        <h2>When does the EMI end?</h2>
        <p>Set the last scheduled EMI date</p>
      </div>
      <div className="step-body">
        <div className="form-group">
          <label htmlFor="emiEndDate">EMI End Date</label>
          <input
            type="date"
            id="emiEndDate"
            name="emiEndDate"
            value={formData.emiEndDate || ''}
            onChange={handleChange}
            min={formData.emiStartDate || formData.date}
            required
            className="form-input"
            autoComplete="off"
            data-lpignore="true"
            data-form-type="other"
            data-1p-ignore="true"
            data-bwignore="true"
            aria-label="EMI end date"
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
        <p className="form-help-text">
          Ensure this date is after the EMI start date. You can adjust it later if needed.
        </p>
      </div>
    </div>
  )

  const renderAccountSelectionStep = () => (
    <div className="step-content">
      <div className="step-icon-large">🏦</div>
      <div className="step-header">
        <h2>Which account pays this EMI?</h2>
        <p>Select the bank or cash account the EMI will be deducted from</p>
      </div>
      <div className="step-body">
        <div className="account-options-grid">
          {bankAccounts.length > 0 ? (
            bankAccounts.map(account => (
              <button
                type="button"
                key={account.id}
                className={`account-option ${formData.accountId === account.id ? 'active' : ''}`}
                onClick={() => handleAccountSelect(account.id)}
              >
                <div className="account-option-header">
                  <span className="account-option-name">{account.name}</span>
                  <span className="account-option-type">
                    {account.type === 'cash'
                      ? 'Cash account'
                      : account.bankName || 'Bank account'}
                  </span>
                </div>
                <div className="account-option-balance">
                  Balance: {CURRENCY_SYMBOL}{account.balance.toLocaleString()}
                </div>
                {account.description && (
                  <div className="account-option-description">{account.description}</div>
                )}
              </button>
            ))
          ) : (
            <div className="account-option-empty">
              <p>No accounts yet. You can add bank or cash accounts from the Bank Accounts section.</p>
            </div>
          )}

          <button
            type="button"
            className={`account-option ${formData.accountId === 'manual-entry' ? 'active' : ''}`}
            onClick={() => handleAccountSelect('manual-entry')}
          >
            <div className="account-option-header">
              <span className="account-option-name">Manual Tracking</span>
              <span className="account-option-type">Deduct manually or track elsewhere</span>
            </div>
            <div className="account-option-description">
              Use this if the EMI is paid from an account not tracked here.
            </div>
          </button>
        </div>
        {bankAccounts.length === 0 && (
          <p className="form-help-text">
            Tip: Create bank or cash accounts to keep balances in sync with your transactions.
          </p>
        )}
      </div>
    </div>
  )

  const renderCreditCardStep = () => (
    <div className="step-content">
      <div className="step-icon-large">💳</div>
      <div className="step-header">
        <h2>Is this linked to a credit card?</h2>
        <p>Track the card details if this EMI is attached to a credit card</p>
      </div>
      <div className="step-body">
        <div className="credit-card-toggle">
          <button
            type="button"
            className={`credit-card-toggle-option ${!hasCreditCard ? 'active' : ''}`}
            onClick={() => handleCreditCardToggle(false)}
          >
            Not linked
          </button>
          <button
            type="button"
            className={`credit-card-toggle-option ${hasCreditCard ? 'active' : ''}`}
            onClick={() => handleCreditCardToggle(true)}
          >
            Linked to a credit card
          </button>
        </div>

        {hasCreditCard && (
          <div className="credit-card-details">
            <div className="form-group">
              <label htmlFor="creditCardId">Card Identifier (Optional)</label>
              <input
                type="text"
                id="creditCardId"
                name="creditCardId"
                value={formData.creditCardId ?? ''}
                onChange={handleChange}
                placeholder="e.g., HDFC Regalia, Last 4 digits, etc."
                className="form-input"
                autoComplete="off"
                data-lpignore="true"
                data-form-type="other"
                data-1p-ignore="true"
                data-bwignore="true"
                aria-label="Credit card identifier"
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

            <div className="form-group">
              <label htmlFor="creditCardCardName">Name on Card</label>
              <input
                type="text"
                id="creditCardCardName"
                value={formData.creditCardInfo?.cardName ?? ''}
                onChange={(e) => handleCreditCardInfoChange('cardName', e.target.value)}
                placeholder="Cardholder name"
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="creditCardNumber">Card Number / Last 4 digits</label>
              <input
                type="text"
                id="creditCardNumber"
                value={formData.creditCardInfo?.cardNumber ?? ''}
                onChange={(e) => handleCreditCardInfoChange('cardNumber', e.target.value)}
                placeholder="XXXX-XXXX-XXXX-1234"
                className="form-input"
              />
            </div>

            <div className="form-group-split">
              <div className="form-group">
                <label htmlFor="creditCardBank">Issuing Bank</label>
                <input
                  type="text"
                  id="creditCardBank"
                  value={formData.creditCardInfo?.bankName ?? ''}
                  onChange={(e) => handleCreditCardInfoChange('bankName', e.target.value)}
                  placeholder="Bank name"
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label htmlFor="creditCardType">Card Type</label>
                <input
                  type="text"
                  id="creditCardType"
                  value={formData.creditCardInfo?.cardType ?? ''}
                  onChange={(e) => handleCreditCardInfoChange('cardType', e.target.value)}
                  placeholder="Visa, MasterCard..."
                  className="form-input"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )

  const renderRecurringChoiceStep = () => (
    <div className="step-content">
      <div className="step-icon-large">🔄</div>
      <div className="step-header">
        <h2>Is this a recurring expense?</h2>
        <p>Select if this expense repeats regularly (EMI, subscription, monthly bills)</p>
        {isRecurringDecided && (
          <p className="step-subtle">You can switch between one-time and recurring at any time.</p>
        )}
      </div>
      <div className="step-body">
        <div className="recurring-choice-buttons">
          <button
            type="button"
            className={`recurring-choice-option ${isRecurringDecided && !formData.isRecurring ? 'selected' : ''}`}
            onClick={() => handleRecurringChoice(false)}
          >
            <span className="choice-icon">💳</span>
            <span className="choice-title">One-time Expense</span>
            <span className="choice-description">Single payment, no repetition</span>
          </button>
          <button
            type="button"
            className={`recurring-choice-option ${isRecurringDecided && formData.isRecurring ? 'selected' : ''}`}
            onClick={() => handleRecurringChoice(true)}
          >
            <span className="choice-icon">🔄</span>
            <span className="choice-title">Recurring Expense</span>
            <span className="choice-description">EMI, subscription, or regular payment</span>
          </button>
        </div>
      </div>
    </div>
  )

  const renderNonRecurringStepContent = () => {
    switch (currentStep) {
      case 2:
        return (
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
                <span>💡 Tip:</span> Be specific to track your spending better
              </div>
            </div>
          </div>
        )
      case 3:
        return renderAmountStep(
          'amount',
          '💰',
          'How much did you spend?',
          'Enter the amount',
          [100, 500, 1000, 5000]
        )
      case 4:
        return renderNonRecurringDateStep()
      case 5:
        return renderCategoryStep(
          'What category?',
          'Select the category that fits best'
        )
      case 6:
        return renderPaymentMethodStep(
          'How did you pay?',
          'Select your payment method'
        )
      case 7:
        return renderPaymentStatusStep(
          'Payment status',
          'Mark whether this amount has been paid already'
        )
      case 8:
        return renderAdditionalDetailsStep()
      default:
        return null
    }
  }

  const renderRecurringStepContent = () => {
    switch (currentStep) {
      case 2:
        return (
          <div className="step-content">
            <div className="step-icon-large">✍️</div>
            <div className="step-header">
              <h2>What is this expense for?</h2>
              <p>Give your recurring expense a clear title</p>
            </div>
            <div className="step-body">
              <div className="form-group-focused">
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="e.g., MacBook EMI, Netflix Subscription"
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
                <span>💡 Tip:</span> Mention the product or service so you recognise it instantly.
              </div>
            </div>
          </div>
        )
      case 3:
        return renderAmountStep(
          'actualAmount',
          '💰',
          'What is the purchase amount?',
          'Enter the total price of the item or service',
          [5000, 10000, 25000, 50000]
        )
      case 4:
        return renderAmountStep(
          'emiAmount',
          '💵',
          'What is the monthly EMI?',
          'Enter the amount that repeats each cycle',
          [500, 1000, 1500, 2500]
        )
      case 5:
        return renderRecurringScheduleStep()
      case 6:
        return renderRecurringEndDateStep()
      case 7:
        return renderCategoryStep(
          'Which category suits this EMI?',
          'Choose the category that best matches this recurring payment'
        )
      case 8:
        return renderPaymentMethodStep(
          'How do you pay the EMI?',
          'Select how this recurring amount is paid each cycle'
        )
      case 9:
        return renderAccountSelectionStep()
      case 10:
        return renderCreditCardStep()
      case 11:
        return renderPaymentStatusStep(
          'Payment status',
          'Mark whether the current cycle is already paid or pending'
        )
      case 12:
        return renderAdditionalDetailsStep('Add helpful notes, receipts, or extra context for this EMI')
      default:
        return null
    }
  }

  const renderStepContent = () => {
    if (currentStep === 1 || !isRecurringDecided) {
      return renderRecurringChoiceStep()
    }

    if (!formData.isRecurring) {
      return renderNonRecurringStepContent()
    }

    return renderRecurringStepContent()
  }

  if (loadingExpense) {
    return (
      <div className="create-expense">
        <div className="container" style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
          <div className="loading-spinner"></div>
          <p>Loading expense data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="create-expense">
      <div className="container" style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div className="page-header">
          <div>
            <h1>{isEditing ? 'Edit Expense' : 'Add New Expense'}</h1>
            <p className="page-subtitle">{isEditing ? 'Update your expense details' : 'Quick and simple expense tracking'}</p>
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
          className="expense-form" 
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
          {renderStepContent()}

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
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  handleNext(e)
                }}
                className="btn btn-primary btn-nav"
                disabled={loading || loadingExpense}
              >
                Next →
              </button>
            ) : (
              <button
                type="submit"
                className="btn btn-primary btn-nav"
                disabled={loading || loadingExpense}
              >
                {loading ? (isEditing ? 'Updating...' : 'Creating...') : (isEditing ? '✨ Update Expense' : '✨ Create Expense')}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateExpense