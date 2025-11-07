// LocalStorage-based bank account service

const STORAGE_KEY = 'expense-manager-bank-accounts'

export type AccountType = 'bank' | 'cash'

export interface BankAccount {
  id: string
  userId: string
  name: string
  type: AccountType
  bankName?: string // For bank accounts
  accountNumber?: string // For bank accounts
  balance: number
  currency: string
  description?: string
  createdAt: string
  updatedAt: string
}

export interface CreateBankAccountRequest {
  userId: string
  name: string
  type: AccountType
  bankName?: string
  accountNumber?: string
  balance: number
  currency?: string
  description?: string
}

// Helper functions for localStorage
const getAccountsFromStorage = (): BankAccount[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch (error) {
    console.error('Error reading from localStorage:', error)
    return []
  }
}

const saveAccountsToStorage = (accounts: BankAccount[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts))
  } catch (error) {
    console.error('Error saving to localStorage:', error)
    throw new Error('Failed to save account. LocalStorage may be full.')
  }
}

const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

export const bankAccountService = {
  // Get all accounts
  getAccounts: async (userId?: string): Promise<BankAccount[]> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const accounts = getAccountsFromStorage()
        let filtered = [...accounts]

        if (userId) {
          filtered = filtered.filter(acc => acc.userId === userId)
        }

        resolve(filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()))
      }, 0)
    })
  },

  // Get account by ID
  getAccountById: async (id: string, userId?: string): Promise<BankAccount> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const accounts = getAccountsFromStorage()
        let account = accounts.find(acc => acc.id === id)

        if (!account) {
          reject(new Error('Account not found'))
          return
        }

        if (userId && account.userId !== userId) {
          reject(new Error('Unauthorized'))
          return
        }

        resolve(account)
      }, 0)
    })
  },

  // Create new account
  createAccount: async (data: CreateBankAccountRequest): Promise<BankAccount> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        try {
          const accounts = getAccountsFromStorage()
          const now = new Date().toISOString()

          const newAccount: BankAccount = {
            id: generateId(),
            userId: data.userId,
            name: data.name.trim(),
            type: data.type,
            bankName: data.bankName?.trim(),
            accountNumber: data.accountNumber?.trim(),
            balance: Number(data.balance),
            currency: data.currency || 'INR',
            description: data.description?.trim(),
            createdAt: now,
            updatedAt: now
          }

          accounts.push(newAccount)
          saveAccountsToStorage(accounts)

          resolve(newAccount)
        } catch (error: any) {
          reject(new Error(error.message || 'Failed to create account'))
        }
      }, 0)
    })
  },

  // Update account
  updateAccount: async (id: string, data: Partial<BankAccount>, userId?: string): Promise<BankAccount> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        try {
          const accounts = getAccountsFromStorage()
          const accountIndex = accounts.findIndex(acc => acc.id === id)

          if (accountIndex === -1) {
            reject(new Error('Account not found'))
            return
          }

          const account = accounts[accountIndex]

          if (userId && account.userId !== userId) {
            reject(new Error('Unauthorized'))
            return
          }

          const updatedAccount: BankAccount = {
            ...account,
            ...data,
            id: account.id, // Ensure ID cannot be changed
            userId: account.userId, // Ensure userId cannot be changed
            updatedAt: new Date().toISOString()
          }

          accounts[accountIndex] = updatedAccount
          saveAccountsToStorage(accounts)

          resolve(updatedAccount)
        } catch (error: any) {
          reject(new Error(error.message || 'Failed to update account'))
        }
      }, 0)
    })
  },

  // Update account balance
  updateBalance: async (id: string, balance: number, userId?: string): Promise<BankAccount> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        try {
          const accounts = getAccountsFromStorage()
          const accountIndex = accounts.findIndex(acc => acc.id === id)

          if (accountIndex === -1) {
            reject(new Error('Account not found'))
            return
          }

          const account = accounts[accountIndex]

          if (userId && account.userId !== userId) {
            reject(new Error('Unauthorized'))
            return
          }

          const updatedAccount: BankAccount = {
            ...account,
            balance: Number(balance),
            updatedAt: new Date().toISOString()
          }

          accounts[accountIndex] = updatedAccount
          saveAccountsToStorage(accounts)

          resolve(updatedAccount)
        } catch (error: any) {
          reject(new Error(error.message || 'Failed to update balance'))
        }
      }, 0)
    })
  },

  // Delete account
  deleteAccount: async (id: string, userId?: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        try {
          const accounts = getAccountsFromStorage()
          const accountIndex = accounts.findIndex(acc => acc.id === id)

          if (accountIndex === -1) {
            reject(new Error('Account not found'))
            return
          }

          const account = accounts[accountIndex]

          if (userId && account.userId !== userId) {
            reject(new Error('Unauthorized'))
            return
          }

          accounts.splice(accountIndex, 1)
          saveAccountsToStorage(accounts)

          resolve()
        } catch (error: any) {
          reject(new Error(error.message || 'Failed to delete account'))
        }
      }, 0)
    })
  },

  // Get total balance across all accounts
  getTotalBalance: async (userId?: string): Promise<number> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const accounts = getAccountsFromStorage()
        let filtered = [...accounts]

        if (userId) {
          filtered = filtered.filter(acc => acc.userId === userId)
        }

        const total = filtered.reduce((sum, acc) => sum + acc.balance, 0)
        resolve(total)
      }, 0)
    })
  }
}

