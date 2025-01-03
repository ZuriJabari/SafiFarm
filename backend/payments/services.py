from typing import Dict, Any, Optional
from decimal import Decimal
from .providers.base import PaymentProvider
from .providers.mtn import MTNMobileMoneyProvider
from .providers.airtel import AirtelMoneyProvider
from .exceptions import PaymentError
import logging

logger = logging.getLogger(__name__)

class PaymentService:
    """
    Service for handling payment operations.
    """
    
    PROVIDERS = {
        'mtn': MTNMobileMoneyProvider,
        'airtel': AirtelMoneyProvider
    }
    
    @classmethod
    def get_provider(cls, provider_name: str) -> PaymentProvider:
        """
        Get payment provider instance.
        
        Args:
            provider_name: Name of the provider
            
        Returns:
            Provider instance
        """
        provider_class = cls.PROVIDERS.get(provider_name.lower())
        if not provider_class:
            raise PaymentError(f"Unsupported payment provider: {provider_name}")
            
        return provider_class()
        
    @classmethod
    async def initialize_payment(
        cls,
        provider_name: str,
        amount: Decimal,
        phone_number: str,
        reference: str,
        description: str
    ) -> Dict[str, Any]:
        """
        Initialize a payment transaction.
        
        Args:
            provider_name: Name of the payment provider
            amount: Transaction amount
            phone_number: Customer's phone number
            reference: Unique transaction reference
            description: Transaction description
            
        Returns:
            Dictionary containing transaction details
        """
        try:
            provider = cls.get_provider(provider_name)
            return await provider.initialize_payment(
                amount,
                phone_number,
                reference,
                description
            )
        except Exception as e:
            logger.error(f"Payment initialization failed: {str(e)}")
            raise PaymentError("Failed to initialize payment")
            
    @classmethod
    async def check_payment_status(
        cls,
        provider_name: str,
        transaction_id: str
    ) -> Dict[str, Any]:
        """
        Check payment status.
        
        Args:
            provider_name: Name of the payment provider
            transaction_id: ID of the transaction to check
            
        Returns:
            Dictionary containing transaction status
        """
        try:
            provider = cls.get_provider(provider_name)
            return await provider.check_payment_status(transaction_id)
        except Exception as e:
            logger.error(f"Payment status check failed: {str(e)}")
            raise PaymentError("Failed to check payment status")
            
    @classmethod
    async def process_callback(
        cls,
        provider_name: str,
        data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Process payment callback.
        
        Args:
            provider_name: Name of the payment provider
            data: Callback data from provider
            
        Returns:
            Processed callback response
        """
        try:
            provider = cls.get_provider(provider_name)
            return await provider.process_callback(data)
        except Exception as e:
            logger.error(f"Payment callback processing failed: {str(e)}")
            raise PaymentError("Failed to process payment callback")
            
    @classmethod
    async def refund_payment(
        cls,
        provider_name: str,
        transaction_id: str,
        amount: Optional[Decimal] = None
    ) -> Dict[str, Any]:
        """
        Initiate payment refund.
        
        Args:
            provider_name: Name of the payment provider
            transaction_id: ID of the transaction to refund
            amount: Amount to refund (None for full refund)
            
        Returns:
            Dictionary containing refund details
        """
        try:
            provider = cls.get_provider(provider_name)
            return await provider.refund_payment(transaction_id, amount)
        except Exception as e:
            logger.error(f"Payment refund failed: {str(e)}")
            raise PaymentError("Failed to initiate refund")
