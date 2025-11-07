import React, { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { expenseService, ExpenseStats, Expense } from '../../services/expenseService'
import { incomeService, IncomeStats, Income } from '../../services/incomeService'
import { formatCurrency } from '../../utils/currency'
import './Dashboard.css'

interface MonthlyFinancialData {
  monthKey: string
  monthLabel: string
  income: number
  expenses: number
  balance: number
}

const Dashboard: React.FC = () => {
  const [expenseStats, setExpenseStats] = useState<ExpenseStats | null>(null)
  const [incomeStats, setIncomeStats] = useState<IncomeStats | null>(null)
  const [recentExpenses, setRecentExpenses] = useState<Expense[]>([])
  const [recentIncomes, setRecentIncomes] = useState<Income[]>([])
  const [allExpenses, setAllExpenses] = useState<Expense[]>([])
  const [allIncomes, setAllIncomes] = useState<Income[]>([])
  const [monthlyFinancialData, setMonthlyFinancialData] = useState<MonthlyFinancialData[]>([])
  const [loading, setLoading] = useState(true)

  // Calculate monthly financial data for current and future months
  const calculateMonthlyFinancialData = (expenses: Expense[], incomes: Income[]): MonthlyFinancialData[] => {
    const monthlyData: MonthlyFinancialData[] = []
    const now = new Date()
    
    // Calculate for next 12 months
    for (let i = 0; i < 12; i++) {
      const targetDate = new Date(now.getFullYear(), now.getMonth() + i, 1)
      const year = targetDate.getFullYear()
      const month = targetDate.getMonth()
      const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`
      const monthLabel = targetDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
      
      // Calculate income for this month
      const monthIncome = incomes
        .filter(income => {
          const incomeDate = new Date(income.date)
          return incomeDate.getFullYear() === year && incomeDate.getMonth() === month
        })
        .reduce((sum, income) => sum + income.amount, 0)
      
      // Calculate expenses for this month
      const monthExpenses = expenses
        .filter(expense => {
          const expenseDate = new Date(expense.date)
          return expenseDate.getFullYear() === year && expenseDate.getMonth() === month
        })
        .reduce((sum, expense) => sum + expense.amount, 0)
      
      const balance = monthIncome - monthExpenses
      
      monthlyData.push({
        monthKey,
        monthLabel,
        income: monthIncome,
        expenses: monthExpenses,
        balance
      })
    }
    
    return monthlyData
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userId = 'default-user'
        const [expenseStatsData, incomeStatsData, expenses, incomes] = await Promise.all([
          expenseService.getStats(userId),
          incomeService.getStats(userId),
          expenseService.getExpenses(userId, undefined, undefined, undefined),
          incomeService.getIncomes(userId, undefined, undefined, undefined)
        ])
        setExpenseStats(expenseStatsData)
        setIncomeStats(incomeStatsData)
        setRecentExpenses(expenses.slice(0, 5))
        setRecentIncomes(incomes.slice(0, 5))
        setAllExpenses(expenses)
        setAllIncomes(incomes)
        
        // Calculate monthly financial data
        const monthlyData = calculateMonthlyFinancialData(expenses, incomes)
        setMonthlyFinancialData(monthlyData)
      } catch (error: any) {
        console.error('Error fetching dashboard data:', error)
        setExpenseStats({
          totalExpenses: 0,
          totalCount: 0,
          byCategory: {},
          byMonth: [],
          thisMonth: 0,
          lastMonth: 0,
          averagePerDay: 0
        })
        setIncomeStats({
          totalIncome: 0,
          totalCount: 0,
          byCategory: {},
          byMonth: [],
          thisMonth: 0,
          lastMonth: 0,
          averagePerDay: 0
        })
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

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

  const currentMonthKey = useMemo(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  }, [])

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    )
  }

  return (
    <div className="dashboard">
      <div className="container" style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div className="dashboard-header">
          <div>
            <h1>Financial Dashboard</h1>
            <p className="dashboard-subtitle">Track your income and expenses</p>
          </div>
          <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
            <Link to="/income/create" className="btn btn-secondary">
              + Add Income
            </Link>
            <Link to="/expenses/create" className="btn btn-primary">
              + Add Expense
            </Link>
          </div>
        </div>

        {!expenseStats || !incomeStats ? (
          <div className="empty-state">
            <p>Unable to load statistics.</p>
          </div>
        ) : (
          <>
            <div className="stats-grid">
              <div className="stat-card primary">
                <div className="stat-icon">💰</div>
                <div className="stat-content">
                  <h3>Net Balance</h3>
                  <p className="stat-value" style={{ 
                    color: (incomeStats.totalIncome - expenseStats.totalExpenses) >= 0 ? 'var(--success-color)' : 'var(--error-color)',
                    WebkitTextFillColor: (incomeStats.totalIncome - expenseStats.totalExpenses) >= 0 ? 'var(--success-color)' : 'var(--error-color)'
                  }}>
                    {formatCurrency((incomeStats.totalIncome || 0) - (expenseStats.totalExpenses || 0))}
                  </p>
                  <span className="stat-label">Income - Expenses</span>
                </div>
              </div>

              <div className="stat-card" style={{ borderLeft: '3px solid var(--success-color)' }}>
                <div className="stat-icon">📈</div>
                <div className="stat-content">
                  <h3>Total Income</h3>
                  <p className="stat-value" style={{ 
                    color: 'var(--success-color)',
                    WebkitTextFillColor: 'var(--success-color)'
                  }}>
                    {formatCurrency(incomeStats.totalIncome || 0)}
                  </p>
                  <span className="stat-label">{incomeStats.totalCount || 0} transactions</span>
                </div>
              </div>

              <div className="stat-card" style={{ borderLeft: '3px solid var(--error-color)' }}>
                <div className="stat-icon">📉</div>
                <div className="stat-content">
                  <h3>Total Expenses</h3>
                  <p className="stat-value" style={{ 
                    color: 'var(--error-color)',
                    WebkitTextFillColor: 'var(--error-color)'
                  }}>
                    {formatCurrency(expenseStats.totalExpenses || 0)}
                  </p>
                  <span className="stat-label">{expenseStats.totalCount || 0} transactions</span>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">📅</div>
                <div className="stat-content">
                  <h3>This Month</h3>
                  <p className="stat-value">
                    {formatCurrency((incomeStats.thisMonth || 0) - (expenseStats.thisMonth || 0))}
                  </p>
                  <span className="stat-label">
                    {expenseStats.lastMonth && expenseStats.lastMonth > 0 
                      ? `${(((incomeStats.thisMonth - expenseStats.thisMonth) - (incomeStats.lastMonth - expenseStats.lastMonth)) / Math.abs(incomeStats.lastMonth - expenseStats.lastMonth) * 100).toFixed(1)}% vs last month`
                      : 'First month'
                    }
                  </span>
                </div>
              </div>
            </div>

            <div className="dashboard-card monthly-financial-table">
              <h2>Monthly Financial Overview</h2>
              <div className="table-container">
                <table className="financial-table">
                  <thead>
                    <tr>
                      <th>Month/Year</th>
                      <th>Income</th>
                      <th>Expenses</th>
                      <th>Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthlyFinancialData.map((data) => {
                      const isCurrentMonth = data.monthKey === currentMonthKey
                      return (
                        <tr key={data.monthKey} className={isCurrentMonth ? 'current-month' : ''}>
                          <td className="month-cell">
                            {isCurrentMonth && (
                              <span className="current-badge">Current</span>
                            )}
                            {data.monthLabel}
                          </td>
                        <td className="income-cell">{formatCurrency(data.income)}</td>
                        <td className="expense-cell">{formatCurrency(data.expenses)}</td>
                        <td className={`balance-cell ${data.balance >= 0 ? 'positive' : 'negative'}`}>
                          {formatCurrency(data.balance)}
                        </td>
                      </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="dashboard-grid">
              <div className="dashboard-card">
                <h2>Income by Category</h2>
                <div className="category-list">
                  {incomeStats.byCategory && Object.keys(incomeStats.byCategory).length > 0 ? (
                    Object.entries(incomeStats.byCategory)
                      .sort(([, a], [, b]) => b - a)
                      .map(([category, amount]) => {
                        const incomeColors: Record<string, string> = {
                          salary: '#10b981',
                          freelance: '#3b82f6',
                          business: '#8b5cf6',
                          investment: '#f59e0b',
                          rental: '#ec4899',
                          gift: '#f472b6',
                          refund: '#06b6d4',
                          other: '#6366f1'
                        }
                        return (
                          <div key={category} className="category-item">
                            <div className="category-info">
                              <span 
                                className="category-color" 
                                style={{ backgroundColor: incomeColors[category] || '#CCCCCC' }}
                              ></span>
                              <span className="category-name">{formatCategory(category)}</span>
                            </div>
                            <span className="category-amount">{formatCurrency(amount)}</span>
                          </div>
                        )
                      })
                  ) : (
                    <p className="empty-state">No income categories yet</p>
                  )}
                </div>
              </div>

              <div className="dashboard-card">
                <h2>Expenses by Category</h2>
                <div className="category-list">
                  {expenseStats.byCategory && Object.keys(expenseStats.byCategory).length > 0 ? (
                    Object.entries(expenseStats.byCategory)
                      .sort(([, a], [, b]) => b - a)
                      .map(([category, amount]) => (
                        <div key={category} className="category-item">
                          <div className="category-info">
                            <span 
                              className="category-color" 
                              style={{ backgroundColor: getCategoryColor(category) }}
                            ></span>
                            <span className="category-name">{formatCategory(category)}</span>
                          </div>
                          <span className="category-amount">{formatCurrency(amount)}</span>
                        </div>
                      ))
                  ) : (
                    <p className="empty-state">No expense categories yet</p>
                  )}
                </div>
              </div>

              <div className="dashboard-card">
                <div className="section-header">
                  <h2>Recent Income</h2>
                  <Link to="/income" className="view-all-link">View All</Link>
                </div>

                {recentIncomes.length === 0 ? (
                  <div className="empty-state">
                    <p>No income yet. Add your first income!</p>
                    <Link to="/income/create" className="btn btn-primary btn-sm">
                      Add Income
                    </Link>
                  </div>
                ) : (
                  <div className="expenses-list">
                    {recentIncomes.map((income) => {
                      const incomeColors: Record<string, string> = {
                        salary: '#10b981',
                        freelance: '#3b82f6',
                        business: '#8b5cf6',
                        investment: '#f59e0b',
                        rental: '#ec4899',
                        gift: '#f472b6',
                        refund: '#06b6d4',
                        other: '#6366f1'
                      }
                      return (
                        <Link
                          key={income.id}
                          to={`/income/${income.id}`}
                          className="expense-item"
                        >
                          <div className="expense-icon" style={{ backgroundColor: incomeColors[income.category] || '#CCCCCC' }}>
                            {income.category.charAt(0).toUpperCase()}
                          </div>
                          <div className="expense-details">
                            <div className="expense-title">{income.title}</div>
                            <div className="expense-meta">
                              <span className="expense-category">{formatCategory(income.category)}</span>
                              <span className="expense-date">
                                {new Date(income.date).toLocaleDateString('en-US', { 
                                  month: 'short', 
                                  day: 'numeric' 
                                })}
                              </span>
                            </div>
                          </div>
                          <div className="expense-amount" style={{ color: 'var(--success-color)' }}>{formatCurrency(income.amount)}</div>
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>

              <div className="dashboard-card">
                <div className="section-header">
                  <h2>Recent Expenses</h2>
                  <Link to="/expenses" className="view-all-link">View All</Link>
                </div>

                {recentExpenses.length === 0 ? (
                  <div className="empty-state">
                    <p>No expenses yet. Add your first expense!</p>
                    <Link to="/expenses/create" className="btn btn-primary btn-sm">
                      Add Expense
                    </Link>
                  </div>
                ) : (
                  <div className="expenses-list">
                    {recentExpenses.map((expense) => (
                      <Link
                        key={expense.id}
                        to={`/expenses/${expense.id}`}
                        className="expense-item"
                      >
                        <div className="expense-icon" style={{ backgroundColor: getCategoryColor(expense.category) }}>
                          {expense.category.charAt(0).toUpperCase()}
                        </div>
                        <div className="expense-details">
                          <div className="expense-title">{expense.title}</div>
                          <div className="expense-meta">
                            <span className="expense-category">{formatCategory(expense.category)}</span>
                            <span className="expense-date">
                              {new Date(expense.date).toLocaleDateString('en-US', { 
                                month: 'short', 
                                day: 'numeric' 
                              })}
                            </span>
                          </div>
                        </div>
                        <div className="expense-amount">{formatCurrency(expense.amount)}</div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default Dashboard