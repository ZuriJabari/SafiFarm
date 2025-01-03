import { Config } from "../config/config.base"

export interface PaymentRequest {
  phoneNumber: string
  amount: number
  currency: string
  provider: "mtn" | "airtel"
  reference: string
  description: string
}

export interface PaymentResponse {
  success: boolean
  transactionId?: string
  status: "pending" | "completed" | "failed"
  message: string
}

class PaymentService {
  private mtnApiKey: string
  private airtelApiKey: string
  private baseUrl: string

  constructor() {
    this.mtnApiKey = Config.MOBILE_MONEY_API.MTN_API_KEY
    this.airtelApiKey = Config.MOBILE_MONEY_API.AIRTEL_API_KEY
    this.baseUrl = Config.API_URL
  }

  async initializePayment(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      const endpoint = request.provider === "mtn" 
        ? "/api/payments/mtn/initialize"
        : "/api/payments/airtel/initialize"

      const headers = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${request.provider === "mtn" ? this.mtnApiKey : this.airtelApiKey}`
      }

      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          phoneNumber: request.phoneNumber,
          amount: request.amount,
          currency: request.currency,
          reference: request.reference,
          description: request.description
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Payment initialization failed")
      }

      return {
        success: true,
        transactionId: data.transactionId,
        status: "pending",
        message: "Payment initialized successfully"
      }
    } catch (error) {
      console.error("Payment initialization error:", error)
      return {
        success: false,
        status: "failed",
        message: error instanceof Error ? error.message : "Payment initialization failed"
      }
    }
  }

  async checkPaymentStatus(transactionId: string, provider: "mtn" | "airtel"): Promise<PaymentResponse> {
    try {
      const endpoint = provider === "mtn"
        ? `/api/payments/mtn/status/${transactionId}`
        : `/api/payments/airtel/status/${transactionId}`

      const headers = {
        "Authorization": `Bearer ${provider === "mtn" ? this.mtnApiKey : this.airtelApiKey}`
      }

      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: "GET",
        headers
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Failed to check payment status")
      }

      return {
        success: true,
        transactionId,
        status: data.status,
        message: data.message
      }
    } catch (error) {
      console.error("Payment status check error:", error)
      return {
        success: false,
        transactionId,
        status: "failed",
        message: error instanceof Error ? error.message : "Failed to check payment status"
      }
    }
  }

  async verifyPayment(transactionId: string, provider: "mtn" | "airtel"): Promise<PaymentResponse> {
    try {
      const endpoint = provider === "mtn"
        ? `/api/payments/mtn/verify/${transactionId}`
        : `/api/payments/airtel/verify/${transactionId}`

      const headers = {
        "Authorization": `Bearer ${provider === "mtn" ? this.mtnApiKey : this.airtelApiKey}`
      }

      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: "POST",
        headers
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Payment verification failed")
      }

      return {
        success: true,
        transactionId,
        status: "completed",
        message: "Payment verified successfully"
      }
    } catch (error) {
      console.error("Payment verification error:", error)
      return {
        success: false,
        transactionId,
        status: "failed",
        message: error instanceof Error ? error.message : "Payment verification failed"
      }
    }
  }
}

export const paymentService = new PaymentService() 