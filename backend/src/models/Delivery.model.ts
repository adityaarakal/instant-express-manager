import mongoose, { Schema, Document } from 'mongoose'

export interface IDelivery extends Document {
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
  packageWeight: number // in kg
  packageDescription?: string
  priority: 'standard' | 'express' | 'urgent'
  status: 'pending' | 'confirmed' | 'picked_up' | 'in_transit' | 'out_for_delivery' | 'delivered' | 'cancelled'
  estimatedDelivery: Date
  actualDelivery?: Date
  deliveryNotes?: string
  price: number
  currency: string
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded'
  createdAt: Date
  updatedAt: Date
}

const DeliverySchema = new Schema<IDelivery>(
  {
    userId: {
      type: String,
      required: true,
      index: true
    },
    trackingNumber: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    senderName: {
      type: String,
      required: true
    },
    senderAddress: {
      type: String,
      required: true
    },
    senderPhone: {
      type: String,
      required: true
    },
    senderEmail: {
      type: String
    },
    recipientName: {
      type: String,
      required: true
    },
    recipientAddress: {
      type: String,
      required: true
    },
    recipientPhone: {
      type: String,
      required: true
    },
    recipientEmail: {
      type: String
    },
    packageType: {
      type: String,
      enum: ['document', 'parcel', 'express', 'fragile', 'heavy'],
      default: 'parcel'
    },
    packageWeight: {
      type: Number,
      required: true,
      min: 0
    },
    packageDescription: {
      type: String
    },
    priority: {
      type: String,
      enum: ['standard', 'express', 'urgent'],
      default: 'standard'
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered', 'cancelled'],
      default: 'pending',
      index: true
    },
    estimatedDelivery: {
      type: Date,
      required: true
    },
    actualDelivery: {
      type: Date
    },
    deliveryNotes: {
      type: String
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    currency: {
      type: String,
      default: 'USD'
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending'
    }
  },
  {
    timestamps: true
  }
)

// Compound indexes for efficient queries
DeliverySchema.index({ userId: 1, status: 1 })
DeliverySchema.index({ trackingNumber: 1 })
DeliverySchema.index({ createdAt: -1 })

// Generate tracking number before saving
DeliverySchema.pre('save', async function (next) {
  if (!this.trackingNumber) {
    const timestamp = Date.now().toString(36).toUpperCase()
    const random = Math.random().toString(36).substring(2, 8).toUpperCase()
    this.trackingNumber = `IEM${timestamp}${random}`
  }
  next()
})

export const DeliveryModel = mongoose.model<IDelivery>('Delivery', DeliverySchema)
