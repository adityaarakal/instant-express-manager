import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { deliveryService, Delivery } from '../../services/deliveryService'
import './Deliveries.css'

const Deliveries: React.FC = () => {
  const [deliveries, setDeliveries] = useState<Delivery[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')

  useEffect(() => {
    const fetchDeliveries = async () => {
      try {
        const userId = 'default-user' // TODO: Get from auth context
        const status = filter === 'all' ? undefined : filter
        const data = await deliveryService.getDeliveries(userId, status)
        setDeliveries(data)
      } catch (error) {
        console.error('Error fetching deliveries:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchDeliveries()
  }, [filter])

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
      <div className="deliveries-loading">
        <p>Loading deliveries...</p>
      </div>
    )
  }

  return (
    <div className="deliveries-page">
      <div className="container">
        <div className="deliveries-header">
          <h1>My Deliveries</h1>
          <Link to="/deliveries/create" className="btn btn-primary">
            Create New Delivery
          </Link>
        </div>

        <div className="filter-tabs">
          <button
            className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All ({deliveries.length})
          </button>
          <button
            className={`filter-tab ${filter === 'pending' ? 'active' : ''}`}
            onClick={() => setFilter('pending')}
          >
            Pending
          </button>
          <button
            className={`filter-tab ${filter === 'in_transit' ? 'active' : ''}`}
            onClick={() => setFilter('in_transit')}
          >
            In Transit
          </button>
          <button
            className={`filter-tab ${filter === 'delivered' ? 'active' : ''}`}
            onClick={() => setFilter('delivered')}
          >
            Delivered
          </button>
        </div>

        {deliveries.length === 0 ? (
          <div className="empty-state">
            <p>No deliveries found.</p>
            <Link to="/deliveries/create" className="btn btn-primary">
              Create Your First Delivery
            </Link>
          </div>
        ) : (
          <div className="deliveries-list">
            {deliveries.map((delivery) => (
              <Link
                key={delivery.id}
                to={`/deliveries/${delivery.id}`}
                className="delivery-card"
              >
                <div className="delivery-card-header">
                  <div className="delivery-tracking">
                    <span className="tracking-label">Tracking:</span>
                    <span className="tracking-number">{delivery.trackingNumber}</span>
                  </div>
                  <span
                    className="status-badge"
                    style={{ backgroundColor: getStatusColor(delivery.status) }}
                  >
                    {formatStatus(delivery.status)}
                  </span>
                </div>
                <div className="delivery-card-body">
                  <div className="delivery-route">
                    <div className="route-point">
                      <span className="route-label">From</span>
                      <span className="route-value">{delivery.senderName}</span>
                      <span className="route-location">{delivery.senderAddress}</span>
                    </div>
                    <div className="route-arrow">→</div>
                    <div className="route-point">
                      <span className="route-label">To</span>
                      <span className="route-value">{delivery.recipientName}</span>
                      <span className="route-location">{delivery.recipientAddress}</span>
                    </div>
                  </div>
                </div>
                <div className="delivery-card-footer">
                  <div className="delivery-meta">
                    <span>Priority: {delivery.priority}</span>
                    <span>Weight: {delivery.packageWeight} kg</span>
                    <span>Type: {delivery.packageType}</span>
                  </div>
                  <div className="delivery-price">
                    ${delivery.price.toFixed(2)}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Deliveries
