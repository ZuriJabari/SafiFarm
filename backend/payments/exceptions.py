class PaymentError(Exception):
    """Base exception for payment-related errors."""
    pass

class PaymentProviderError(PaymentError):
    """Exception for provider-specific errors."""
    pass

class PaymentValidationError(PaymentError):
    """Exception for payment validation errors."""
    pass

class PaymentAuthenticationError(PaymentError):
    """Exception for authentication-related errors."""
    pass

class PaymentTimeoutError(PaymentError):
    """Exception for timeout-related errors."""
    pass
