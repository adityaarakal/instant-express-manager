import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { deliveryService, CreateDeliveryRequest } from '../../services/deliveryService'
import './CreateDelivery.css'

const CreateDelivery: React.FC = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [formData, setFormData] = useState<CreateDeliveryRequest>({
    userId: 'default-user', // TODO: Get from auth context
    senderName: '',
    senderAddress: '',
    senderPhone: '',
    senderEmail: '',
    recipientName: '',
    recipientAddress: '',
    recipientPhone: '',
    recipientEmail: '',
    packageType: 'parcel',
    packageWeight: 1,
    packageDescription: '',
    priority: 'standard',
    estimatedDelivery: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    deliveryNotes: ''
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'packageWeight' ? parseFloat(value) || 0 : value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Convert date string to ISO format
      const deliveryData = {
        ...formData,
        estimatedDelivery: new Date(formData.estimatedDelivery).toISOString()
      }
      
      const delivery = await deliveryService.createDelivery(deliveryData)
      navigate(`/deliveries/${delivery.id}`)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create delivery. Please try again.')
      console.error('Error creating delivery:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="create-delivery">
      <div className="container">
        <div className="page-header">
          <h1>Create New Delivery</h1>
          <button onClick={() => navigate(-1)} className="btn btn-secondary">
            Back
          </button>
        </div>

        <form onSubmit={handleSubmit} className="delivery-form">
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <div className="form-section">
            <h2>Sender Information</h2>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="senderName">Name *</label>
                <input
                  type="text"
                  id="senderName"
                  name="senderName"
                  value={formData.senderName}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="senderPhone">Phone *</label>
                <input
                  type="tel"
                  id="senderPhone"
                  name="senderPhone"
                  value={formData.senderPhone}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group full-width">
                <label htmlFor="senderAddress">Address *</label>
                <input
                  type="text"
                  id="senderAddress"
                  name="senderAddress"
                  value={formData.senderAddress}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="senderEmail">Email</label>
                <input
                  type="email"
                  id="senderEmail"
                  name="senderEmail"
                  value={formData.senderEmail}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h2>Recipient Information</h2>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="recipientName">Name *</label>
                <input
                  type="text"
                  id="recipientName"
                  name="recipientName"
                  value={formData.recipientName}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="recipientPhone">Phone *</label>
                <input
                  type="tel"
                  id="recipientPhone"
                  name="recipientPhone"
                  value={formData.recipientPhone}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group full-width">
                <label htmlFor="recipientAddress">Address *</label>
                <input
                  type="text"
                  id="recipientAddress"
                  name="recipientAddress"
                  value={formData.recipientAddress}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="recipientEmail">Email</label>
                <input
                  type="email"
                  id="recipientEmail"
                  name="recipientEmail"
                  value={formData.recipientEmail}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h2>Package Details</h2>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="packageType">Package Type *</label>
                <select
                  id="packageType"
                  name="packageType"
                  value={formData.packageType}
                  onChange={handleChange}
                  required
                >
                  <option value="parcel">Parcel</option>
                  <option value="document">Document</option>
                  <option value="express">Express</option>
                  <option value="fragile">Fragile</option>
                  <option value="heavy">Heavy</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="packageWeight">Weight (kg) *</label>
                <input
                  type="number"
                  id="packageWeight"
                  name="packageWeight"
                  value={formData.packageWeight}
                  onChange={handleChange}
                  min="0.1"
                  step="0.1"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="priority">Priority *</label>
                <select
                  id="priority"
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                  required
                >
                  <option value="standard">Standard</option>
                  <option value="express">Express</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="estimatedDelivery">Estimated Delivery *</label>
                <input
                  type="date"
                  id="estimatedDelivery"
                  name="estimatedDelivery"
                  value={formData.estimatedDelivery}
                  onChange={handleChange}
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>
              <div className="form-group full-width">
                <label htmlFor="packageDescription">Description</label>
                <textarea
                  id="packageDescription"
                  name="packageDescription"
                  value={formData.packageDescription}
                  onChange={handleChange}
                  rows={3}
                />
              </div>
              <div className="form-group full-width">
                <label htmlFor="deliveryNotes">Delivery Notes</label>
                <textarea
                  id="deliveryNotes"
                  name="deliveryNotes"
                  value={formData.deliveryNotes}
                  onChange={handleChange}
                  rows={3}
                />
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="btn btn-secondary"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Delivery'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateDelivery
