import { Config } from '../config/config.base';

export type PaymentProvider = 'MTN' | 'AIRTEL';

export interface PaymentDetails {
  amount: number;
  phoneNumber: string;
  currency: string;
  description: string;
  provider: PaymentProvider;
  referenceId: string;
}

export interface PaymentResult {
  success: boolean;
  transactionId?: string;
  error?: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
}

export interface TransactionStatus {
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  message: string;
  transactionId: string;
  amount: number;
  currency: string;
  timestamp: Date;
}

class PaymentService {
  private mtnHeaders: Record<string, string>;
  private airtelHeaders: Record<string, string>;

  constructor() {
    this.mtnHeaders = {
      'Authorization': `Bearer ${Config.MOBILE_MONEY_API.MTN_API_KEY}`,
      'Content-Type': 'application/json',
      'X-Reference-Id': '',
      'X-Target-Environment': Config.MOBILE_MONEY_API.ENVIRONMENT
    };

    this.airtelHeaders = {
      'Authorization': `Bearer ${Config.MOBILE_MONEY_API.AIRTEL_API_KEY}`,
      'Content-Type': 'application/json',
      'X-Country': 'UG',
      'X-Currency': 'UGX'
    };
  }

  private async generateToken(provider: 'MTN' | 'AIRTEL'): Promise<string> {
    try {
      const tokenEndpoint = provider === 'MTN' 
        ? Config.MOBILE_MONEY_API.MTN_TOKEN_URL 
        : Config.MOBILE_MONEY_API.AIRTEL_TOKEN_URL;

      const response = await fetch(tokenEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(provider === 'MTN' 
            ? { 'Ocp-Apim-Subscription-Key': Config.MOBILE_MONEY_API.MTN_SUBSCRIPTION_KEY }
            : { 'X-API-Key': Config.MOBILE_MONEY_API.AIRTEL_API_KEY }
          )
        },
        body: JSON.stringify({
          grant_type: 'client_credentials'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate token');
      }

      const data = await response.json();
      return data.access_token;
    } catch (error) {
      console.error('Error generating token:', error);
      throw new Error('Failed to generate authentication token');
    }
  }

  async initiatePayment(details: PaymentDetails): Promise<PaymentResult> {
    try {
      // Generate new token
      const token = await this.generateToken(details.provider);
      
      // Update headers with new token
      if (details.provider === 'MTN') {
        this.mtnHeaders['Authorization'] = `Bearer ${token}`;
        this.mtnHeaders['X-Reference-Id'] = details.referenceId;
      } else {
        this.airtelHeaders['Authorization'] = `Bearer ${token}`;
      }

      const headers = details.provider === 'MTN' ? this.mtnHeaders : this.airtelHeaders;
      const apiUrl = details.provider === 'MTN'
        ? Config.MOBILE_MONEY_API.MTN_PAYMENT_URL
        : Config.MOBILE_MONEY_API.AIRTEL_PAYMENT_URL;

      const payload = details.provider === 'MTN' ? {
        amount: details.amount,
        currency: details.currency,
        externalId: details.referenceId,
        payer: {
          partyIdType: 'MSISDN',
          partyId: details.phoneNumber
        },
        payerMessage: details.description,
        payeeNote: details.description
      } : {
        amount: details.amount,
        currency: details.currency,
        reference: details.referenceId,
        phoneNumber: details.phoneNumber,
        description: details.description
      };

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Payment initiation failed');
      }

      const data = await response.json();
      
      return {
        success: true,
        transactionId: data.transactionId || details.referenceId,
        status: 'PENDING'
      };
    } catch (error) {
      console.error('Payment initiation error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Payment initiation failed',
        status: 'FAILED'
      };
    }
  }

  async checkTransactionStatus(
    transactionId: string,
    provider: 'MTN' | 'AIRTEL'
  ): Promise<TransactionStatus> {
    try {
      // Generate new token
      const token = await this.generateToken(provider);
      
      // Update headers with new token
      if (provider === 'MTN') {
        this.mtnHeaders['Authorization'] = `Bearer ${token}`;
      } else {
        this.airtelHeaders['Authorization'] = `Bearer ${token}`;
      }

      const headers = provider === 'MTN' ? this.mtnHeaders : this.airtelHeaders;
      const statusUrl = provider === 'MTN'
        ? `${Config.MOBILE_MONEY_API.MTN_PAYMENT_URL}/${transactionId}`
        : `${Config.MOBILE_MONEY_API.AIRTEL_PAYMENT_URL}/${transactionId}`;

      const response = await fetch(statusUrl, {
        method: 'GET',
        headers
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to check transaction status');
      }

      const data = await response.json();
      
      return {
        status: this.mapProviderStatus(data.status, provider),
        message: data.message || data.statusMessage || '',
        transactionId: data.transactionId || transactionId,
        amount: data.amount,
        currency: data.currency,
        timestamp: new Date(data.timestamp || data.createdAt)
      };
    } catch (error) {
      console.error('Error checking transaction status:', error);
      throw new Error('Failed to check transaction status');
    }
  }

  private mapProviderStatus(
    status: string,
    provider: 'MTN' | 'AIRTEL'
  ): 'PENDING' | 'COMPLETED' | 'FAILED' {
    if (provider === 'MTN') {
      switch (status.toUpperCase()) {
        case 'SUCCESSFUL':
        case 'COMPLETED':
          return 'COMPLETED';
        case 'FAILED':
        case 'REJECTED':
          return 'FAILED';
        default:
          return 'PENDING';
      }
    } else {
      // Airtel status mapping
      switch (status.toUpperCase()) {
        case 'SUCCESS':
        case 'SUCCESSFUL':
          return 'COMPLETED';
        case 'FAILED':
        case 'REJECTED':
          return 'FAILED';
        default:
          return 'PENDING';
      }
    }
  }

  validatePhoneNumber(phoneNumber: string, provider: 'MTN' | 'AIRTEL'): boolean {
    // Uganda phone number validation
    const mtnPrefixes = ['077', '078'];
    const airtelPrefixes = ['070', '075'];
    
    // Remove any spaces or special characters
    const cleanNumber = phoneNumber.replace(/[^0-9]/g, '');
    
    // Check if it's a valid Ugandan number
    if (cleanNumber.length !== 10) {
      return false;
    }

    const prefix = cleanNumber.substring(0, 3);
    
    if (provider === 'MTN') {
      return mtnPrefixes.includes(prefix);
    } else {
      return airtelPrefixes.includes(prefix);
    }
  }

  formatPhoneNumber(phoneNumber: string): string {
    // Remove any non-digit characters
    const cleanNumber = phoneNumber.replace(/[^0-9]/g, '');
    
    // Ensure it's a 10-digit number
    if (cleanNumber.length !== 10) {
      throw new Error('Invalid phone number length');
    }
    
    // Format as 256XXXXXXXXX (Uganda format)
    return `256${cleanNumber.substring(1)}`;
  }
}

export const paymentService = new PaymentService(); 