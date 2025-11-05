import React, { useState } from 'react'
import { purchasePremium } from '../../services/purchaseService'
import './PurchaseButton.css'

const PurchaseButton: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handlePurchase = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await purchasePremium()
      if (result.success) {
        // Handle successful purchase
        alert('Purchase successful! Thank you for your support.')
      } else {
        setError(result.error || 'Purchase failed')
      }
    } catch (err) {
      setError('An error occurred during purchase')
      console.error('Purchase error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="purchase-button-container">
      <button
        className="btn btn-primary purchase-btn"
        onClick={handlePurchase}
        disabled={isLoading}
      >
        {isLoading ? 'Processing...' : 'Purchase Premium'}
      </button>
      {error && <p className="purchase-error">{error}</p>}
    </div>
  )
}

export default PurchaseButton
