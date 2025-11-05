export interface PurchaseRequest {
  userId: string
  productId: string
}

export interface PurchaseResponse {
  success: boolean
  transactionId?: string
  error?: string
  message?: string
}
