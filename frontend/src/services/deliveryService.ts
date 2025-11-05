import apiClient from './api'

export interface Delivery {
  id: string
  userId: string
  trackingNumber: string
  senderName: string
  senderAddress: string
  senderPhone: string
  senderEmail?: string
  recipientName: string
  recipientAddress: string
  recipientPhone: string
  recipientEmail?: string
  packageType: 'document' | 'parcel' | 'express' | 'fragile' | 'heavy'
  packageWeight: number
  packageDescription?: string
  priority: 'standard' | 'express' | 'urgent'
  status: 'pending' | 'confirmed' | 'picked_up' | 'in_transit' | 'out_for_delivery' | 'delivered' | 'cancelled'
  estimatedDelivery: string
  actualDelivery?: string
  deliveryNotes?: string
  price: number
  currency: string
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded'
  createdAt: string
  updatedAt: string
}

export interface CreateDeliveryRequest {
  userId: string
  senderName: string
  senderAddress: string
  senderPhone: string
  senderEmail?: string
  recipientName: string
  recipientAddress: string
  recipientPhone: string
  recipientEmail?: string
  packageType: 'document' | 'parcel' | 'express' | 'fragile' | 'heavy'
  packageWeight: number
  packageDescription?: string
  priority: 'standard' | 'express' | 'urgent'
  estimatedDelivery: string
  deliveryNotes?: string
}

export interface DeliveryStats {
  total: number
  pending: number
  inTransit: number
  delivered: number
  cancelled: number
}

export const deliveryService = {
  // Get all deliveries
  getDeliveries: async (userId?: string, status?: string): Promise<Delivery[]> => {
    const params: any = {}
    if (userId) params.userId = userId
    if (status) params.status = status
    
    const response = await apiClient.get('/deliveries', { params })
    return response.data
  },

  // Get delivery by ID
  getDeliveryById: async (id: string, userId?: string): Promise<Delivery> => {
    const params: any = {}
    if (userId) params.userId = userId
    
    const response = await apiClient.get(`/deliveries/${id}`, { params })
    return response.data
  },

  // Get delivery by tracking number
  getDeliveryByTracking: async (trackingNumber: string): Promise<Delivery> => {
    const response = await apiClient.get(`/deliveries/tracking/${trackingNumber}`)
    return response.data
  },

  // Create new delivery
  createDelivery: async (data: CreateDeliveryRequest): Promise<Delivery> => {
    const response = await apiClient.post('/deliveries', data)
    return response.data
  },

  // Update delivery
  updateDelivery: async (id: string, data: Partial<Delivery>, userId?: string): Promise<Delivery> => {
    const updateData = { ...data }
    if (userId) updateData.userId = userId as any
    
    const response = await apiClient.put(`/deliveries/${id}`, updateData)
    return response.data
  },

  // Delete delivery
  deleteDelivery: async (id: string, userId?: string): Promise<void> => {
    const params: any = {}
    if (userId) params.userId = userId
    
    await apiClient.delete(`/deliveries/${id}`, { params })
  },

  // Get delivery statistics
  getStats: async (userId?: string): Promise<DeliveryStats> => {
    const params: any = {}
    if (userId) params.userId = userId
    
    const response = await apiClient.get('/deliveries/stats', { params })
    return response.data
  }
}
