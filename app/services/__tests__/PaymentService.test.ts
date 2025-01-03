import { paymentService } from '../PaymentService';
import { Config } from '../../config/config.base';

describe('PaymentService', () => {
  const mockPaymentDetails = {
    amount: 1000,
    phoneNumber: '0771234567',
    currency: 'UGX',
    description: 'Test payment',
    provider: 'MTN' as const,
    referenceId: 'TEST-REF-001'
  };

  const mockTokenResponse = {
    access_token: 'mock-token-123',
    token_type: 'Bearer',
    expires_in: 3600
  };

  const mockPaymentResponse = {
    transactionId: 'TRANS-123',
    status: 'PENDING',
    message: 'Payment initiated successfully'
  };

  const mockStatusResponse = {
    status: 'COMPLETED',
    message: 'Payment completed successfully',
    transactionId: 'TRANS-123',
    amount: 1000,
    currency: 'UGX',
    timestamp: new Date().toISOString()
  };

  beforeEach(() => {
    // Reset fetch mock
    global.fetch = jest.fn();
  });

  describe('Token Generation', () => {
    it('generates MTN token successfully', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockTokenResponse)
      });

      const result = await paymentService.initiatePayment(mockPaymentDetails);
      
      expect(global.fetch).toHaveBeenCalledWith(
        Config.MOBILE_MONEY_API.MTN_TOKEN_URL,
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Ocp-Apim-Subscription-Key': Config.MOBILE_MONEY_API.MTN_SUBSCRIPTION_KEY
          })
        })
      );
      expect(result.success).toBe(true);
    });

    it('handles token generation error', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'Invalid credentials' })
      });

      const result = await paymentService.initiatePayment(mockPaymentDetails);
      
      expect(result.success).toBe(false);
      expect(result.status).toBe('FAILED');
    });
  });

  describe('Payment Initiation', () => {
    beforeEach(() => {
      // Mock successful token generation
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockTokenResponse)
      });
    });

    it('initiates MTN payment successfully', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockTokenResponse)
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockPaymentResponse)
        });

      const result = await paymentService.initiatePayment(mockPaymentDetails);
      
      expect(result.success).toBe(true);
      expect(result.transactionId).toBe('TRANS-123');
      expect(result.status).toBe('PENDING');
    });

    it('initiates Airtel payment successfully', async () => {
      const airtelDetails = {
        ...mockPaymentDetails,
        provider: 'AIRTEL' as const,
        phoneNumber: '0751234567'
      };

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockTokenResponse)
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockPaymentResponse)
        });

      const result = await paymentService.initiatePayment(airtelDetails);
      
      expect(result.success).toBe(true);
      expect(result.transactionId).toBe('TRANS-123');
      expect(result.status).toBe('PENDING');
    });

    it('handles payment initiation error', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockTokenResponse)
        })
        .mockResolvedValueOnce({
          ok: false,
          json: () => Promise.resolve({ error: 'Insufficient funds' })
        });

      const result = await paymentService.initiatePayment(mockPaymentDetails);
      
      expect(result.success).toBe(false);
      expect(result.status).toBe('FAILED');
    });
  });

  describe('Transaction Status', () => {
    beforeEach(() => {
      // Mock successful token generation
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockTokenResponse)
      });
    });

    it('checks MTN transaction status successfully', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockTokenResponse)
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockStatusResponse)
        });

      const status = await paymentService.checkTransactionStatus('TRANS-123', 'MTN');
      
      expect(status.status).toBe('COMPLETED');
      expect(status.transactionId).toBe('TRANS-123');
    });

    it('handles status check error', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockTokenResponse)
        })
        .mockResolvedValueOnce({
          ok: false,
          json: () => Promise.resolve({ error: 'Transaction not found' })
        });

      await expect(
        paymentService.checkTransactionStatus('INVALID-TRANS', 'MTN')
      ).rejects.toThrow('Failed to check transaction status');
    });
  });

  describe('Phone Number Validation', () => {
    it('validates MTN phone numbers correctly', () => {
      expect(paymentService.validatePhoneNumber('0771234567', 'MTN')).toBe(true);
      expect(paymentService.validatePhoneNumber('0781234567', 'MTN')).toBe(true);
      expect(paymentService.validatePhoneNumber('0751234567', 'MTN')).toBe(false);
    });

    it('validates Airtel phone numbers correctly', () => {
      expect(paymentService.validatePhoneNumber('0701234567', 'AIRTEL')).toBe(true);
      expect(paymentService.validatePhoneNumber('0751234567', 'AIRTEL')).toBe(true);
      expect(paymentService.validatePhoneNumber('0771234567', 'AIRTEL')).toBe(false);
    });

    it('handles invalid phone numbers', () => {
      expect(paymentService.validatePhoneNumber('077123', 'MTN')).toBe(false);
      expect(paymentService.validatePhoneNumber('abc1234567', 'AIRTEL')).toBe(false);
    });
  });

  describe('Phone Number Formatting', () => {
    it('formats valid phone numbers correctly', () => {
      expect(paymentService.formatPhoneNumber('0771234567')).toBe('256771234567');
      expect(paymentService.formatPhoneNumber('0751234567')).toBe('256751234567');
    });

    it('throws error for invalid phone numbers', () => {
      expect(() => paymentService.formatPhoneNumber('077123')).toThrow('Invalid phone number length');
      expect(() => paymentService.formatPhoneNumber('07712345678')).toThrow('Invalid phone number length');
    });
  });
}); 