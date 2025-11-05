import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { deliveryService, Delivery } from '../../services/deliveryService'
import './DeliveryDetail.css'

const DeliveryDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [delivery, setDelivery] = useState<Delivery | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchDelivery = async () => {
      if (!id) return

      try {
        const userId = 'default-user' // TODO: Get from auth context
        const data = await deliveryService.getDeliveryById(id, userId)
        setDelivery(data)
      } catch (err: any) {
        setError(err.response?.data?.error || 'Delivery not found')
      } finally {
        setLoading(false)
      }
    }

    fetchDelivery()
  }, [id])

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
      <div className="delivery-detail-loading">
        <p>Loading delivery details...</p>
      </div>
    )
  }

  if (error || !delivery) {
    return (
      <div className="delivery-detail-error">
        <p>{error || 'Delivery not found'}</p>
        <button onClick={() => navigate('/deliveries')} className="btn btn-primary">
          Back to Deliveries
        </button>
      </div>
    )
  }

  return (
    <div className="delivery-detail">
      <div className="container">
        <div className="detail-header">
          <button onClick={() => navigate(-1)} className="back-button">
            ← Back
          </button>
          <h1>Delivery Details</h1>
        </div>

        <div className="delivery-status-card">
          <div className="status-header">
            <div>
              <h2>Tracking Number</h2>
              <p className="tracking-number-large">{delivery.trackingNumber}</p>
            </div>
            <span
              className="status-badge-large"
              style={{ backgroundColor: getStatusColor(delivery.status) }}
            >
              {formatStatus(delivery.status)}
            </span>
          </div>
        </div>

        <div className="details-grid">
          <div className="detail-card">
            <h3>Sender Information</h3>
            <div className="detail-content">
              <p><strong>Name:</strong> {delivery.senderName}</p>
              <p><strong>Address:</strong> {delivery.senderAddress}</p>
              <p><strong>Phone:</strong> {delivery.senderPhone}</p>
              {delivery.senderEmail && <p><strong>Email:</strong> {delivery.senderEmail}</p>}
            </div>
          </div>

          <div className="detail-card">
            <h3>Recipient Information</h3>
            <div className="detail-content">
              <p><strong>Name:</strong> {delivery.recipientName}</p>
              <p><strong>Address:</strong> {delivery.recipientAddress}</p>
              <p><strong>Phone:</strong> {delivery.recipientPhone}</p>
              {delivery.recipientEmail && <p><strong>Email:</strong> {delivery.recipientEmail}</p>}
            </div>
          </div>

          <div className="detail-card">
            <h3>Package Details</h3>
            <div className="detail-content">
              <p><strong>Type:</strong> {delivery.packageType}</p>
              <p><strong>Weight:</strong> {delivery.packageWeight} kg</p>
              <p><strong>Priority:</strong> {delivery.priority}</p>
              {delivery.packageDescription && (
                <p><strong>Description:</strong> {delivery.packageDescription}</p>
              )}
            </div>
          </div>

          <div className="detail-card">
            <h3>Delivery Information</h3>
            <div className="detail-content">
              <p><strong>Status:</strong> {formatStatus(delivery.status)}</p>
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

        <div className="detail-actions">
          <button onClick={() => navigate('/track')} className="btn btn-secondary">
            Track Another
          </button>
          <button onClick={() => navigate('/deliveries/create')} className="btn btn-primary">
            Create New Delivery
          </button>
        </div>
      </div>
    </div>
  )
}

export default DeliveryDetail
