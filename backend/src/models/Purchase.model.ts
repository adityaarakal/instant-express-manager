import mongoose, { Schema, Document } from 'mongoose'

export interface IPurchase extends Document {
  userId: string
  productId: string
  transactionId: string
  status: 'pending' | 'completed' | 'failed' | 'refunded'
  amount: number
  currency: string
  paymentMethod?: string
  createdAt: Date
  updatedAt: Date
}

const PurchaseSchema = new Schema<IPurchase>(
  {
    userId: {
      type: String,
      required: true,
      index: true
    },
    productId: {
      type: String,
      required: true
    },
    transactionId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'pending'
    },
    amount: {
      type: Number,
      required: true
    },
    currency: {
      type: String,
      default: 'USD'
    },
    paymentMethod: {
      type: String
    }
  },
  {
    timestamps: true
  }
)

// Compound index for efficient queries
PurchaseSchema.index({ userId: 1, productId: 1, status: 1 })

export const PurchaseModel = mongoose.model<IPurchase>('Purchase', PurchaseSchema)
