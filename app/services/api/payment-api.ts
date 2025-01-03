import { ApiResponse } from "apisauce"
import { Api } from "./api"
import { GetPaymentMethodsResult, InitiatePaymentResult } from "./api.types"

export class PaymentApi {
  private api: Api

  constructor(api: Api) {
    this.api = api
  }

  async getPaymentMethods(): Promise<GetPaymentMethodsResult> {
    try {
      const response: ApiResponse<any> = await this.api.apisauce.get(
        "/payment-processing/payment-methods/"
      )

      if (!response.ok) {
        const problem = response.problem
          ? response.problem
          : "Unknown error fetching payment methods"
        return { kind: "bad-data", message: problem }
      }

      return { kind: "ok", paymentMethods: response.data }
    } catch (e) {
      return { kind: "bad-data", message: e.message }
    }
  }

  async addPaymentMethod(provider: string, phoneNumber: string): Promise<ApiResponse<any>> {
    try {
      const response: ApiResponse<any> = await this.api.apisauce.post(
        "/payment-processing/payment-methods/",
        {
          provider,
          phone_number: phoneNumber,
        }
      )

      if (!response.ok) {
        const problem = response.problem
          ? response.problem
          : "Unknown error adding payment method"
        return { kind: "bad-data", message: problem }
      }

      return { kind: "ok", paymentMethod: response.data }
    } catch (e) {
      return { kind: "bad-data", message: e.message }
    }
  }

  async initiatePayment(
    paymentMethodId: string,
    amount: number,
    transactionType: string,
  ): Promise<InitiatePaymentResult> {
    try {
      const response: ApiResponse<any> = await this.api.apisauce.post(
        "/payment-processing/transactions/",
        {
          payment_method: paymentMethodId,
          amount,
          transaction_type: transactionType,
        }
      )

      if (!response.ok) {
        const problem = response.problem
          ? response.problem
          : "Unknown error initiating payment"
        return { kind: "bad-data", message: problem }
      }

      return { kind: "ok", transaction: response.data }
    } catch (e) {
      return { kind: "bad-data", message: e.message }
    }
  }

  async checkPaymentStatus(transactionId: string): Promise<ApiResponse<any>> {
    try {
      const response: ApiResponse<any> = await this.api.apisauce.get(
        `/payment-processing/transactions/${transactionId}/`
      )

      if (!response.ok) {
        const problem = response.problem
          ? response.problem
          : "Unknown error checking payment status"
        return { kind: "bad-data", message: problem }
      }

      return { kind: "ok", transaction: response.data }
    } catch (e) {
      return { kind: "bad-data", message: e.message }
    }
  }
}
