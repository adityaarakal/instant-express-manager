import mongoose, { Schema, Document } from 'mongoose'

export interface IExpense extends Document {
  userId: string
  title: string
  description?: string
  amount: number
  category: 'food' | 'transport' | 'shopping' | 'bills' | 'entertainment' | 'health' | 'education' | 'travel' | 'other'
  paymentMethod: 'cash' | 'card' | 'digital_wallet' | 'bank_transfer' | 'other'
  date: Date
  tags?: string[]
  receiptUrl?: string
  location?: string
  createdAt: Date
  updatedAt: Date
}

const ExpenseSchema = new Schema<IExpense>(
  {
    userId: {
      type: String,
      required: true,
      index: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    category: {
      type: String,
      enum: ['food', 'transport', 'shopping', 'bills', 'entertainment', 'health', 'education', 'travel', 'other'],
      required: true,
      index: true
    },
    paymentMethod: {
      type: String,
      enum: ['cash', 'card', 'digital_wallet', 'bank_transfer', 'other'],
      default: 'cash'
    },
    date: {
      type: Date,
      required: true,
      default: Date.now,
      index: true
    },
    tags: [{
      type: String,
      trim: true
    }],
    receiptUrl: {
      type: String
    },
    location: {
      type: String,
      trim: true
    }
  },
  {
    timestamps: true
  }
)

// Compound indexes for efficient queries
ExpenseSchema.index({ userId: 1, date: -1 })
ExpenseSchema.index({ userId: 1, category: 1 })
ExpenseSchema.index({ userId: 1, date: -1, category: 1 })

export const ExpenseModel = mongoose.model<IExpense>('Expense', ExpenseSchema)
