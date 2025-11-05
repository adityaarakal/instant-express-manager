import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { deliveryService, DeliveryStats, Delivery } from '../../services/deliveryService'
import './Dashboard.css'

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DeliveryStats | null>(null)
  const [recentDeliveries, setRecentDeliveries] = useState<Delivery[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userId = 'default-user' // TODO: Get from auth context
        const [statsData, deliveries] = await Promise.all([
          deliveryService.getStats(userId),
          deliveryService.getDeliveries(userId, undefined)
        ])
        setStats(statsData)
        setRecentDeliveries(deliveries.slice(0, 5))
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'var(--warning-color)',
      confirmed: 'var(--accent-color)',
      picked_up: 'var(--primary-color)',
      in_transit: 'var(--primary-color)',
      out_for_delivery: 'var(--primary-color)',
      delivered: 'var(--success-color)',
      cancelled: 'var(--error-color)'
    }
    return colors[status] || 'var(--text-secondary)'
  }

  const formatStatus = (status: string) => {
    return status.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ')
  }

  if (loading) {
    return (
      <div className="dashboard-loading">
        <p>Loading dashboard...</p>
      </div>
    )
  }

  return (
    <div className="dashboard">
      <div className="container">
        <div className="dashboard-header">
          <h1>Dashboard</h1>
          <Link to="/deliveries/create" className="btn btn-primary">
            Create New Delivery
          </Link>
        </div>

        {stats && (
          <div className="stats-grid">
            <div className="stat-card">
              <h3>Total Deliveries</h3>
              <p className="stat-value">{stats.total}</p>
            </div>
            <div className="stat-card">
              <h3>Pending</h3>
              <p className="stat-value" style={{ color: 'var(--warning-color)' }}>
                {stats.pending}
              </p>
            </div>
            <div className="stat-card">
              <h3>In Transit</h3>
              <p className="stat-value" style={{ color: 'var(--primary-color)' }}>
                {stats.inTransit}
              </p>
            </div>
            <div className="stat-card">
              <h3>Delivered</h3>
              <p className="stat-value" style={{ color: 'var(--success-color)' }}>
                {stats.delivered}
              </p>
            </div>
          </div>
        )}

        <div className="recent-deliveries">
          <div className="section-header">
            <h2>Recent Deliveries</h2>
            <Link to="/deliveries" className="view-all-link">View All</Link>
          </div>

          {recentDeliveries.length === 0 ? (
            <div className="empty-state">
              <p>No deliveries yet. Create your first delivery to get started!</p>
              <Link to="/deliveries/create" className="btn btn-primary">
                Create Delivery
              </Link>
            </div>
          ) : (
            <div className="deliveries-list">
              {recentDeliveries.map((delivery) => (
                <Link
                  key={delivery.id}
                  to={`/deliveries/${delivery.id}`}
                  className="delivery-card"
                >
                  <div className="delivery-header">
                    <span className="tracking-number">{delivery.trackingNumber}</span>
                    <span
                      className="status-badge"
                      style={{ backgroundColor: getStatusColor(delivery.status) }}
                    >
                      {formatStatus(delivery.status)}
                    </span>
                  </div>
                  <div className="delivery-info">
                    <p>
                      <strong>From:</strong> {delivery.senderName}
                    </p>
                    <p>
                      <strong>To:</strong> {delivery.recipientName}
                    </p>
                    <p>
                      <strong>Priority:</strong> {delivery.priority}
                    </p>
                    <p>
                      <strong>Price:</strong> ${delivery.price.toFixed(2)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Dashboard
