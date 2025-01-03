export interface Config {
  API_URL: string
  MOBILE_MONEY_API: {
    MTN_API_KEY: string
    AIRTEL_API_KEY: string
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
    AIRTEL_API_KEY: process.env.AIRTEL_API_KEY || "YOUR_AIRTEL_API_KEY"
  },
  AI_MODEL: {
    MODEL_URL: process.env.MODEL_URL || "https://storage.googleapis.com/safifarm-models/crop-disease-model.json",
    LABELS_URL: process.env.LABELS_URL || "https://storage.googleapis.com/safifarm-models/crop-disease-labels.json"
  }
} 