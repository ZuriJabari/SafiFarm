from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
from decimal import Decimal

class PaymentProvider(ABC):
    """
    Abstract base class for payment providers.
    """
    
    @abstractmethod
    async def initialize_payment(
        self,
        amount: Decimal,
        phone_number: str,
        reference: str,
        description: str
    ) -> Dict[str, Any]:
        """
        Initialize a payment transaction.
        
        Args:
            amount: Transaction amount
            phone_number: Customer's phone number
            reference: Unique transaction reference
            description: Transaction description
            
        Returns:
            Dictionary containing transaction details
        """
        pass
        
    @abstractmethod
    async def check_payment_status(
        self,
        transaction_id: str
    ) -> Dict[str, Any]:
        """
        Check the status of a payment transaction.
        
        Args:
            transaction_id: ID of the transaction to check
            
        Returns:
            Dictionary containing transaction status
        """
        pass
        
    @abstractmethod
    async def process_callback(
        self,
        data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Process payment callback from provider.
        
        Args:
            data: Callback data from provider
            
        Returns:
            Processed callback response
        """
        pass
        
    @abstractmethod
    async def refund_payment(
        self,
        transaction_id: str,
        amount: Optional[Decimal] = None
    ) -> Dict[str, Any]:
        """
        Initiate a refund for a transaction.
        
        Args:
            transaction_id: ID of the transaction to refund
            amount: Amount to refund (None for full refund)
            
        Returns:
            Dictionary containing refund details
        """
        pass
