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
  estimatedDelivery: string | Date
  deliveryNotes?: string
}

export interface UpdateDeliveryRequest {
  status?: 'pending' | 'confirmed' | 'picked_up' | 'in_transit' | 'out_for_delivery' | 'delivered' | 'cancelled'
  deliveryNotes?: string
  actualDelivery?: string | Date
}

export interface DeliveryResponse {
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
  packageType: string
  packageWeight: number
  packageDescription?: string
  priority: string
  status: string
  estimatedDelivery: Date
  actualDelivery?: Date
  deliveryNotes?: string
  price: number
  currency: string
  paymentStatus: string
  createdAt: Date
  updatedAt: Date
}

export interface DeliveryStats {
  total: number
  pending: number
  inTransit: number
  delivered: number
  cancelled: number
}
