import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { expenseService, ExpenseStats, Expense } from '../../services/expenseService'
import { formatCurrency } from '../../utils/currency'
import './Dashboard.css'

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<ExpenseStats | null>(null)
  const [recentExpenses, setRecentExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userId = 'default-user' // TODO: Get from auth context
        const [statsData, expenses] = await Promise.all([
          expenseService.getStats(userId),
          expenseService.getExpenses(userId, undefined, undefined, undefined)
        ])
        setStats(statsData)
        setRecentExpenses(expenses.slice(0, 5))
      } catch (error: any) {
        console.error('Error fetching dashboard data:', error)
        // Set empty stats on error to prevent crashes
        setStats({
          totalExpenses: 0,
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
            <h1>Expense Dashboard</h1>
            <p className="dashboard-subtitle">Track and manage your expenses</p>
          </div>
          <Link to="/expenses/create" className="btn btn-primary">
            + Add Expense
          </Link>
        </div>

        {!stats ? (
          <div className="empty-state">
            <p>Unable to load statistics. Please check your database connection.</p>
          </div>
        ) : (
          <>
            <div className="stats-grid">
              <div className="stat-card primary">
                <div className="stat-icon">💰</div>
                <div className="stat-content">
                  <h3>Total Expenses</h3>
                  <p className="stat-value">{formatCurrency(stats.totalExpenses || 0)}</p>
                  <span className="stat-label">{stats.totalCount || 0} transactions</span>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">📅</div>
                <div className="stat-content">
                  <h3>This Month</h3>
                  <p className="stat-value">{formatCurrency(stats.thisMonth || 0)}</p>
                  <span className="stat-label">
                    {stats.lastMonth && stats.lastMonth > 0 
                      ? `${((stats.thisMonth - stats.lastMonth) / stats.lastMonth * 100).toFixed(1)}% vs last month`
                      : 'First month'
                    }
                  </span>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">📊</div>
                <div className="stat-content">
                  <h3>Daily Average</h3>
                  <p className="stat-value">{formatCurrency(stats.averagePerDay || 0)}</p>
                  <span className="stat-label">Per day</span>
                </div>
              </div>
            </div>

            <div className="dashboard-grid">
              <div className="dashboard-card">
                <h2>Expenses by Category</h2>
                <div className="category-list">
                  {stats.byCategory && Object.keys(stats.byCategory).length > 0 ? (
                    Object.entries(stats.byCategory)
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
                    <p className="empty-state">No category data available</p>
                  )}
                </div>
              </div>

              <div className="dashboard-card">
                <div className="section-header">
                  <h2>Recent Expenses</h2>
                  <Link to="/expenses" className="view-all-link">View All</Link>
                </div>

                {recentExpenses.length === 0 ? (
                  <div className="empty-state">
                    <p>No expenses yet. Add your first expense to get started!</p>
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