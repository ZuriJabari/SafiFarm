export interface Config {
  API_URL: string
  MOBILE_MONEY_API: {
    MTN_API_KEY: string
    MTN_SUBSCRIPTION_KEY: string
    MTN_TOKEN_URL: string
    MTN_PAYMENT_URL: string
    AIRTEL_API_KEY: string
    AIRTEL_TOKEN_URL: string
    AIRTEL_PAYMENT_URL: string
    ENVIRONMENT: 'sandbox' | 'production'
  }
  AI_MODEL: {
    MODEL_URL: string
    LABELS_URL: string
  }
}

export const Config: Config = {
  API_URL: process.env.API_URL || "https://api.safifarm.com",
  MOBILE_MONEY_API: {
    MTN_API_KEY: process.env.MTN_API_KEY || "YOUR_MTN_API_KEY",
    MTN_SUBSCRIPTION_KEY: process.env.MTN_SUBSCRIPTION_KEY || "YOUR_MTN_SUBSCRIPTION_KEY",
    MTN_TOKEN_URL: process.env.MTN_TOKEN_URL || "https://sandbox.momodeveloper.mtn.com/collection/token/",
    MTN_PAYMENT_URL: process.env.MTN_PAYMENT_URL || "https://sandbox.momodeveloper.mtn.com/collection/v1_0/requesttopay",
    AIRTEL_API_KEY: process.env.AIRTEL_API_KEY || "YOUR_AIRTEL_API_KEY",
    AIRTEL_TOKEN_URL: process.env.AIRTEL_TOKEN_URL || "https://openapiuat.airtel.africa/auth/oauth2/token",
    AIRTEL_PAYMENT_URL: process.env.AIRTEL_PAYMENT_URL || "https://openapiuat.airtel.africa/merchant/v1/payments",
    ENVIRONMENT: (process.env.MOBILE_MONEY_ENVIRONMENT || 'sandbox') as 'sandbox' | 'production'
  },
  AI_MODEL: {
    MODEL_URL: process.env.MODEL_URL || "https://storage.googleapis.com/safifarm-models/crop-disease-model.json",
    LABELS_URL: process.env.LABELS_URL || "https://storage.googleapis.com/safifarm-models/crop-disease-labels.json"
  }
} 