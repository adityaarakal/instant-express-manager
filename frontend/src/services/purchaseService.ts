import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'

export interface PurchaseResponse {
  success: boolean
  error?: string
  transactionId?: string
}

export const purchasePremium = async (): Promise<PurchaseResponse> => {
  try {
    const response = await axios.post(`${API_BASE_URL}/purchases/premium`, {
      userId: 'user-id', // Replace with actual user ID from auth context
      productId: 'premium-subscription'
    })
    return response.data
  } catch (error: any) {
    console.error('Purchase error:', error)
    return {
      success: false,
      error: error.response?.data?.message || 'Purchase failed'
    }
  }
}

export const checkPurchaseStatus = async (userId: string): Promise<boolean> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/purchases/status/${userId}`)
    return response.data.hasPremium
  } catch (error) {
    console.error('Error checking purchase status:', error)
    return false
  }
}
