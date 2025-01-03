export interface PaymentMethod {
  id: string
  provider: string
  phone_number: string
  is_active: boolean
  created_at: string
}

export interface Transaction {
  id: string
  user: string
  payment_method: PaymentMethod
  amount: number
  formatted_amount: string
  transaction_type: string
  status: string
  provider_ref?: string
  provider_status?: string
  provider_message?: string
  attempts: number
  last_error?: string
  created_at: string
  completed_at?: string
  expires_at: string
}

export type GetPaymentMethodsResult = { kind: "ok"; paymentMethods: PaymentMethod[] } | { kind: "bad-data"; message: string }
export type InitiatePaymentResult = { kind: "ok"; transaction: Transaction } | { kind: "bad-data"; message: string }
