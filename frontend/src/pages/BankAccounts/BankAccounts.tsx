import React, { useEffect, useMemo, useState, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { bankAccountService, BankAccount, CreateBankAccountRequest } from '../../services/bankAccountService'
import { CURRENCY_SYMBOL } from '../../utils/currency'
import './BankAccounts.css'

const EMPTY_FORM: CreateBankAccountRequest & { id?: string } = {
  userId: 'default-user',
  name: '',
  type: 'bank',
  bankName: '',
  accountNumber: '',
  balance: 0,
  currency: 'INR',
  description: ''
}

type FormMode = 'create' | 'edit'

const BankAccounts: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()

  const [accounts, setAccounts] = useState<BankAccount[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isFormVisible, setIsFormVisible] = useState(false)
  const [formMode, setFormMode] = useState<FormMode>('create')
  const [formSubmitting, setFormSubmitting] = useState(false)
  const [formData, setFormData] = useState<CreateBankAccountRequest & { id?: string }>(EMPTY_FORM)

  const headingTitle = useMemo(() => (formMode === 'create' ? 'Add a new account' : 'Update account'), [formMode])

  const loadAccounts = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await bankAccountService.getAccounts('default-user')
      setAccounts(data)
    } catch (loadError) {
      console.error('Error loading bank accounts:', loadError)
      setError('Could not load bank accounts. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadAccounts()
  }, [loadAccounts])

  useEffect(() => {
    const handleFocus = () => {
      loadAccounts()
    }
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [loadAccounts])

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = event.target
    if (name === 'balance') {
      const numericValue = value === '' ? 0 : parseFloat(value)
      setFormData(prev => ({ ...prev, balance: Number.isNaN(numericValue) ? 0 : numericValue }))
      return
    }

    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const resetForm = () => {
    setFormData(EMPTY_FORM)
    setFormMode('create')
    setIsFormVisible(false)
    setError(null)
    setSuccess(null)
  }

  const handleCreateAccount = async () => {
    setFormSubmitting(true)
    setError(null)
    setSuccess(null)
    try {
      const payload: CreateBankAccountRequest = {
        userId: 'default-user',
        name: formData.name.trim(),
        type: formData.type,
        bankName: formData.type === 'bank' ? formData.bankName?.trim() || undefined : undefined,
        accountNumber: formData.type === 'bank' ? formData.accountNumber?.trim() || undefined : undefined,
        balance: Number(formData.balance) || 0,
        currency: formData.currency?.trim() || 'INR',
        description: formData.description?.trim() || undefined
      }

      await bankAccountService.createAccount(payload)
      setSuccess('Account created successfully!')
      setTimeout(() => setSuccess(null), 3000)
      resetForm()
      loadAccounts()
    } catch (createError) {
      const message = createError instanceof Error ? createError.message : 'Failed to create account.'
      setError(message)
    } finally {
      setFormSubmitting(false)
    }
  }

  const handleUpdateAccount = async () => {
    if (!formData.id) return

    setFormSubmitting(true)
    setError(null)
    setSuccess(null)

    try {
      const payload = {
        name: formData.name.trim(),
        type: formData.type,
        bankName: formData.type === 'bank' ? formData.bankName?.trim() || undefined : undefined,
        accountNumber: formData.type === 'bank' ? formData.accountNumber?.trim() || undefined : undefined,
        balance: Number(formData.balance) || 0,
        currency: formData.currency?.trim() || 'INR',
        description: formData.description?.trim() || undefined
      }

      await bankAccountService.updateAccount(formData.id, payload, 'default-user')
      setSuccess('Account updated successfully!')
      setTimeout(() => setSuccess(null), 3000)
      resetForm()
      loadAccounts()
    } catch (updateError) {
      const message = updateError instanceof Error ? updateError.message : 'Failed to update account.'
      setError(message)
    } finally {
      setFormSubmitting(false)
    }
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!formData.name.trim()) {
      setError('Account name is required.')
      return
    }

    if (formMode === 'create') {
      await handleCreateAccount()
    } else {
      await handleUpdateAccount()
    }
  }

  const handleEditAccount = (account: BankAccount) => {
    setFormMode('edit')
    setFormData({
      id: account.id,
      userId: account.userId,
      name: account.name,
      type: account.type,
      bankName: account.bankName || '',
      accountNumber: account.accountNumber || '',
      balance: account.balance,
      currency: account.currency,
      description: account.description || ''
    })
    setIsFormVisible(true)
    setError(null)
    setSuccess(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDeleteAccount = async (account: BankAccount) => {
    const confirmDelete = window.confirm(`Delete ${account.name}? This action cannot be undone.`)
    if (!confirmDelete) {
      return
    }

    setError(null)
    setSuccess(null)
    try {
      await bankAccountService.deleteAccount(account.id, 'default-user')
      setSuccess('Account deleted successfully.')
      setTimeout(() => setSuccess(null), 3000)
      loadAccounts()
    } catch (deleteError) {
      const message = deleteError instanceof Error ? deleteError.message : 'Failed to delete account.'
      setError(message)
    }
  }

  const handleStartCreate = () => {
    setFormMode('create')
    setFormData(EMPTY_FORM)
    setIsFormVisible(true)
    setError(null)
    setSuccess(null)
  }

  const showBackToExpense = useMemo(() => location.state && (location.state as { from?: string }).from === 'create-expense', [location.state])

  return (
    <div className="bank-accounts-page">
      <div className="container">
        <div className="page-header">
          <div>
            <h1>🏦 Bank & Cash Accounts</h1>
            <p className="page-subtitle">Add, update, or remove the accounts used for EMI deductions and cash tracking.</p>
          </div>
          <div className="page-actions">
            {showBackToExpense && (
              <button className="btn btn-secondary" onClick={() => navigate(-1)}>
                ← Back to expense
              </button>
            )}
            <button className="btn btn-primary" onClick={handleStartCreate}>
              + Add account
            </button>
          </div>
        </div>

        {isFormVisible && (
          <div className="account-form-card">
            <div className="account-form-header">
              <h2>{headingTitle}</h2>
              <button className="btn btn-secondary" onClick={resetForm}>
                Cancel
              </button>
            </div>
            <form className="account-form" onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="name">Account name</label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="e.g., HDFC Savings, Cash Wallet"
                    autoFocus
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="type">Account type</label>
                  <select id="type" name="type" value={formData.type} onChange={handleInputChange}>
                    <option value="bank">Bank account</option>
                    <option value="cash">Cash account</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="balance">Current balance</label>
                  <div className="input-with-prefix">
                    <span className="prefix">{CURRENCY_SYMBOL}</span>
                    <input
                      id="balance"
                      name="balance"
                      type="number"
                      value={formData.balance}
                      onChange={handleInputChange}
                      step="0.01"
                      min="0"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="currency">Currency</label>
                  <input
                    id="currency"
                    name="currency"
                    type="text"
                    value={formData.currency || ''}
                    onChange={handleInputChange}
                    placeholder="INR"
                  />
                </div>

                {formData.type === 'bank' && (
                  <>
                    <div className="form-group">
                      <label htmlFor="bankName">Bank name</label>
                      <input
                        id="bankName"
                        name="bankName"
                        type="text"
                        value={formData.bankName || ''}
                        onChange={handleInputChange}
                        placeholder="e.g., HDFC Bank"
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="accountNumber">Account number / reference</label>
                      <input
                        id="accountNumber"
                        name="accountNumber"
                        type="text"
                        value={formData.accountNumber || ''}
                        onChange={handleInputChange}
                        placeholder="Optional"
                      />
                    </div>
                  </>
                )}

                <div className="form-group form-group-full">
                  <label htmlFor="description">Description</label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description || ''}
                    onChange={handleInputChange}
                    placeholder="Add notes like branch details, interest, etc. (optional)"
                    rows={3}
                  />
                </div>
              </div>

              <div className="form-footer">
                <button type="submit" className="btn btn-primary" disabled={formSubmitting}>
                  {formSubmitting ? 'Saving...' : formMode === 'create' ? 'Create account' : 'Save changes'}
                </button>
              </div>
            </form>
          </div>
        )}

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <section className="accounts-section">
          <header className="accounts-section-header">
            <div>
              <h2>Your accounts</h2>
              <p>These accounts appear in the EMI account selector.</p>
            </div>
            <button className="btn btn-secondary" onClick={loadAccounts} disabled={isLoading}>
              {isLoading ? 'Refreshing...' : 'Refresh'}
            </button>
          </header>

          {isLoading ? (
            <div className="loading-state">
              <div className="loading-spinner" />
              <p>Loading accounts...</p>
            </div>
          ) : accounts.length === 0 ? (
            <div className="empty-state">
              <h3>No accounts yet</h3>
              <p>Add your bank or cash accounts so you can assign EMI deductions easily.</p>
              <button className="btn btn-primary" onClick={handleStartCreate}>
                + Add your first account
              </button>
            </div>
          ) : (
            <div className="accounts-grid">
              {accounts.map(account => (
                <article key={account.id} className="account-card">
                  <header>
                    <span className="account-type">
                      {account.type === 'bank' ? '🏦 Bank account' : '💼 Cash account'}
                    </span>
                    <div className="account-actions">
                      <button className="btn btn-small" onClick={() => handleEditAccount(account)}>
                        Edit
                      </button>
                      <button className="btn btn-small btn-danger" onClick={() => handleDeleteAccount(account)}>
                        Delete
                      </button>
                    </div>
                  </header>

                  <h3 className="account-name">{account.name}</h3>

                  <div className="account-balance">
                    <span>Current balance</span>
                    <strong>
                      {CURRENCY_SYMBOL}
                      {account.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </strong>
                  </div>

                  <dl className="account-meta">
                    {account.currency && (
                      <div>
                        <dt>Currency</dt>
                        <dd>{account.currency}</dd>
                      </div>
                    )}
                    {account.bankName && (
                      <div>
                        <dt>Bank</dt>
                        <dd>{account.bankName}</dd>
                      </div>
                    )}
                    {account.accountNumber && (
                      <div>
                        <dt>Account number</dt>
                        <dd>{account.accountNumber}</dd>
                      </div>
                    )}
                    {account.description && (
                      <div>
                        <dt>Notes</dt>
                        <dd>{account.description}</dd>
                      </div>
                    )}
                    <div>
                      <dt>Last updated</dt>
                      <dd>{new Date(account.updatedAt).toLocaleString()}</dd>
                    </div>
                  </dl>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

export default BankAccounts
