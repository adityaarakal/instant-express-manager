import React, { useState } from 'react'
import { deliveryService, Delivery } from '../../services/deliveryService'
import './TrackDelivery.css'

const TrackDelivery: React.FC = () => {
  const [trackingNumber, setTrackingNumber] = useState('')
  const [delivery, setDelivery] = useState<Delivery | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!trackingNumber.trim()) return

    setLoading(true)
    setError(null)
    setDelivery(null)

    try {
      const result = await deliveryService.getDeliveryByTracking(trackingNumber)
      setDelivery(result)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Delivery not found. Please check your tracking number.')
      setDelivery(null)
    } finally {
      setLoading(false)
    }
  }

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

  const getStatusSteps = () => {
    if (!delivery) return []
    
    const steps = [
      { key: 'pending', label: 'Pending', completed: ['pending', 'confirmed', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered'].includes(delivery.status) },
      { key: 'confirmed', label: 'Confirmed', completed: ['confirmed', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered'].includes(delivery.status) },
      { key: 'picked_up', label: 'Picked Up', completed: ['picked_up', 'in_transit', 'out_for_delivery', 'delivered'].includes(delivery.status) },
      { key: 'in_transit', label: 'In Transit', completed: ['in_transit', 'out_for_delivery', 'delivered'].includes(delivery.status) },
      { key: 'out_for_delivery', label: 'Out for Delivery', completed: ['out_for_delivery', 'delivered'].includes(delivery.status) },
      { key: 'delivered', label: 'Delivered', completed: delivery.status === 'delivered' }
    ]
    
    return steps
  }

  return (
    <div className="track-delivery">
      <div className="container">
        <div className="track-header">
          <h1>Track Your Delivery</h1>
          <p>Enter your tracking number to view delivery status</p>
        </div>

        <form onSubmit={handleTrack} className="track-form">
          <div className="form-group-inline">
            <input
              type="text"
              placeholder="Enter tracking number (e.g., IEM...)"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value.toUpperCase())}
              className="track-input"
              required
            />
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Tracking...' : 'Track'}
            </button>
          </div>
        </form>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {delivery && (
          <div className="delivery-details">
            <div className="delivery-status-card">
              <div className="status-header">
                <h2>Tracking Number: {delivery.trackingNumber}</h2>
                <span
                  className="status-badge-large"
                  style={{ backgroundColor: getStatusColor(delivery.status) }}
                >
                  {formatStatus(delivery.status)}
                </span>
              </div>

              <div className="status-timeline">
                {getStatusSteps().map((step, index) => (
                  <div key={step.key} className="timeline-item">
                    <div className={`timeline-dot ${step.completed ? 'completed' : ''}`}>
                      {step.completed && <span>✓</span>}
                    </div>
                    <div className="timeline-content">
                      <p className={step.completed ? 'completed' : ''}>{step.label}</p>
                    </div>
                    {index < getStatusSteps().length - 1 && (
                      <div className={`timeline-line ${step.completed ? 'completed' : ''}`} />
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="details-grid">
              <div className="detail-card">
                <h3>Sender Information</h3>
                <p><strong>Name:</strong> {delivery.senderName}</p>
                <p><strong>Address:</strong> {delivery.senderAddress}</p>
                <p><strong>Phone:</strong> {delivery.senderPhone}</p>
                {delivery.senderEmail && <p><strong>Email:</strong> {delivery.senderEmail}</p>}
              </div>

              <div className="detail-card">
                <h3>Recipient Information</h3>
                <p><strong>Name:</strong> {delivery.recipientName}</p>
                <p><strong>Address:</strong> {delivery.recipientAddress}</p>
                <p><strong>Phone:</strong> {delivery.recipientPhone}</p>
                {delivery.recipientEmail && <p><strong>Email:</strong> {delivery.recipientEmail}</p>}
              </div>

              <div className="detail-card">
                <h3>Package Details</h3>
                <p><strong>Type:</strong> {delivery.packageType}</p>
                <p><strong>Weight:</strong> {delivery.packageWeight} kg</p>
                <p><strong>Priority:</strong> {delivery.priority}</p>
                {delivery.packageDescription && (
                  <p><strong>Description:</strong> {delivery.packageDescription}</p>
                )}
              </div>

              <div className="detail-card">
                <h3>Delivery Information</h3>
                <p><strong>Estimated Delivery:</strong> {new Date(delivery.estimatedDelivery).toLocaleDateString()}</p>
                {delivery.actualDelivery && (
                  <p><strong>Actual Delivery:</strong> {new Date(delivery.actualDelivery).toLocaleDateString()}</p>
                )}
                <p><strong>Price:</strong> ${delivery.price.toFixed(2)}</p>
                <p><strong>Payment Status:</strong> {delivery.paymentStatus}</p>
                {delivery.deliveryNotes && (
                  <p><strong>Notes:</strong> {delivery.deliveryNotes}</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default TrackDelivery
