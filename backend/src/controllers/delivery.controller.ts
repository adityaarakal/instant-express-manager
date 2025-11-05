import { DeliveryModel } from '../models/Delivery.model'
import { CreateDeliveryRequest, UpdateDeliveryRequest, DeliveryResponse, DeliveryStats } from '../types/delivery.types'

// Calculate price based on weight, type, and priority
const calculatePrice = (
  weight: number,
  packageType: string,
  priority: string
): number => {
  let basePrice = 5.0 // Base price in USD
  
  // Weight-based pricing
  if (weight > 10) basePrice += (weight - 10) * 2
  else if (weight > 5) basePrice += (weight - 5) * 1.5
  else if (weight > 1) basePrice += (weight - 1) * 1
  
  // Type-based pricing
  if (packageType === 'fragile') basePrice += 10
  if (packageType === 'heavy') basePrice += 15
  if (packageType === 'express') basePrice += 20
  
  // Priority-based pricing
  if (priority === 'express') basePrice *= 1.5
  if (priority === 'urgent') basePrice *= 2
  
  return Math.round(basePrice * 100) / 100 // Round to 2 decimal places
}

export const createDelivery = async (
  request: CreateDeliveryRequest
): Promise<DeliveryResponse> => {
  const {
    userId,
    senderName,
    senderAddress,
    senderPhone,
    senderEmail,
    recipientName,
    recipientAddress,
    recipientPhone,
    recipientEmail,
    packageType,
    packageWeight,
    packageDescription,
    priority,
    estimatedDelivery,
    deliveryNotes
  } = request

  const price = calculatePrice(packageWeight, packageType, priority)

  try {
    const delivery = await DeliveryModel.create({
      userId,
      senderName,
      senderAddress,
      senderPhone,
      senderEmail,
      recipientName,
      recipientAddress,
      recipientPhone,
      recipientEmail,
      packageType,
      packageWeight,
      packageDescription,
      priority,
      estimatedDelivery: new Date(estimatedDelivery),
      deliveryNotes,
      price,
      currency: 'USD'
    })

    return deliveryToResponse(delivery)
  } catch (error: any) {
    throw new Error(`Failed to create delivery: ${error.message}`)
  }
}

export const getDeliveryById = async (
  deliveryId: string,
  userId?: string
): Promise<DeliveryResponse | null> => {
  try {
    const query: any = { _id: deliveryId }
    if (userId) {
      query.userId = userId
    }

    const delivery = await DeliveryModel.findOne(query)
    return delivery ? deliveryToResponse(delivery) : null
  } catch (error: any) {
    throw new Error(`Failed to get delivery: ${error.message}`)
  }
}

export const getDeliveryByTrackingNumber = async (
  trackingNumber: string
): Promise<DeliveryResponse | null> => {
  try {
    const delivery = await DeliveryModel.findOne({ trackingNumber })
    return delivery ? deliveryToResponse(delivery) : null
  } catch (error: any) {
    throw new Error(`Failed to get delivery: ${error.message}`)
  }
}

export const getUserDeliveries = async (
  userId: string,
  status?: string,
  limit: number = 50,
  skip: number = 0
): Promise<DeliveryResponse[]> => {
  try {
    const query: any = { userId }
    if (status) {
      query.status = status
    }

    const deliveries = await DeliveryModel.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)

    return deliveries.map(deliveryToResponse)
  } catch (error: any) {
    throw new Error(`Failed to get deliveries: ${error.message}`)
  }
}

export const updateDelivery = async (
  deliveryId: string,
  userId: string,
  updates: UpdateDeliveryRequest
): Promise<DeliveryResponse | null> => {
  try {
    const updateData: any = {}
    
    if (updates.status) updateData.status = updates.status
    if (updates.deliveryNotes) updateData.deliveryNotes = updates.deliveryNotes
    if (updates.actualDelivery) updateData.actualDelivery = new Date(updates.actualDelivery)
    
    // If status is delivered, set actualDelivery if not provided
    if (updates.status === 'delivered' && !updates.actualDelivery) {
      updateData.actualDelivery = new Date()
    }

    const delivery = await DeliveryModel.findOneAndUpdate(
      { _id: deliveryId, userId },
      updateData,
      { new: true }
    )

    return delivery ? deliveryToResponse(delivery) : null
  } catch (error: any) {
    throw new Error(`Failed to update delivery: ${error.message}`)
  }
}

export const deleteDelivery = async (
  deliveryId: string,
  userId: string
): Promise<boolean> => {
  try {
    const result = await DeliveryModel.findOneAndDelete({ _id: deliveryId, userId })
    return !!result
  } catch (error: any) {
    throw new Error(`Failed to delete delivery: ${error.message}`)
  }
}

export const getDeliveryStats = async (userId: string): Promise<DeliveryStats> => {
  try {
    const stats = await DeliveryModel.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ])

    const statsMap: Record<string, number> = {
      total: 0,
      pending: 0,
      inTransit: 0,
      delivered: 0,
      cancelled: 0
    }

    stats.forEach((stat) => {
      statsMap.total += stat.count
      if (stat._id === 'pending' || stat._id === 'confirmed') {
        statsMap.pending += stat.count
      } else if (stat._id === 'picked_up' || stat._id === 'in_transit' || stat._id === 'out_for_delivery') {
        statsMap.inTransit += stat.count
      } else if (stat._id === 'delivered') {
        statsMap.delivered += stat.count
      } else if (stat._id === 'cancelled') {
        statsMap.cancelled += stat.count
      }
    })

    return statsMap as DeliveryStats
  } catch (error: any) {
    throw new Error(`Failed to get delivery stats: ${error.message}`)
  }
}

// Helper function to convert Mongoose document to response object
const deliveryToResponse = (delivery: any): DeliveryResponse => {
  return {
    id: delivery._id.toString(),
    userId: delivery.userId,
    trackingNumber: delivery.trackingNumber,
    senderName: delivery.senderName,
    senderAddress: delivery.senderAddress,
    senderPhone: delivery.senderPhone,
    senderEmail: delivery.senderEmail,
    recipientName: delivery.recipientName,
    recipientAddress: delivery.recipientAddress,
    recipientPhone: delivery.recipientPhone,
    recipientEmail: delivery.recipientEmail,
    packageType: delivery.packageType,
    packageWeight: delivery.packageWeight,
    packageDescription: delivery.packageDescription,
    priority: delivery.priority,
    status: delivery.status,
    estimatedDelivery: delivery.estimatedDelivery,
    actualDelivery: delivery.actualDelivery,
    deliveryNotes: delivery.deliveryNotes,
    price: delivery.price,
    currency: delivery.currency,
    paymentStatus: delivery.paymentStatus,
    createdAt: delivery.createdAt,
    updatedAt: delivery.updatedAt
  }
}
