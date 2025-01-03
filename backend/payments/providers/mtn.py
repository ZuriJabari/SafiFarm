import aiohttp
import uuid
import base64
import json
from typing import Dict, Any, Optional
from decimal import Decimal
from datetime import datetime
from django.conf import settings
import logging
from .base import PaymentProvider
from ..exceptions import PaymentError

logger = logging.getLogger(__name__)

class MTNMobileMoneyProvider(PaymentProvider):
    """
    MTN Mobile Money payment provider implementation.
    """
    
    def __init__(self):
        self.api_key = settings.MTN_API_KEY
        self.api_user = settings.MTN_API_USER
        self.api_password = settings.MTN_API_PASSWORD
        self.environment = settings.MTN_ENVIRONMENT
        
        # Set API endpoints based on environment
        if self.environment == 'production':
            self.base_url = 'https://api.mtn.com/collection/v1'
        else:
            self.base_url = 'https://sandbox.mtn.com/collection/v1'
            
    async def _get_auth_token(self) -> str:
        """
        Get OAuth token for API authentication.
        """
        try:
            auth_string = base64.b64encode(
                f"{self.api_user}:{self.api_password}".encode()
            ).decode()
            
            headers = {
                'Authorization': f'Basic {auth_string}',
                'Ocp-Apim-Subscription-Key': self.api_key
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    f"{self.base_url}/token",
                    headers=headers
                ) as response:
                    if response.status == 200:
                        data = await response.json()
                        return data['access_token']
                    else:
                        error_data = await response.text()
                        raise PaymentError(
                            f"Failed to get auth token: {error_data}"
                        )
                        
        except Exception as e:
            logger.error(f"Error getting MTN auth token: {str(e)}")
            raise PaymentError("Authentication failed")
            
    async def initialize_payment(
        self,
        amount: Decimal,
        phone_number: str,
        reference: str,
        description: str
    ) -> Dict[str, Any]:
        """
        Initialize MTN Mobile Money payment.
        """
        try:
            token = await self._get_auth_token()
            
            # Format phone number (remove + and country code if present)
            phone_number = phone_number.replace('+', '').replace(' ', '')
            if phone_number.startswith('256'):
                phone_number = phone_number[3:]
                
            headers = {
                'Authorization': f'Bearer {token}',
                'X-Reference-Id': reference,
                'X-Target-Environment': self.environment,
                'Ocp-Apim-Subscription-Key': self.api_key,
                'Content-Type': 'application/json'
            }
            
            payload = {
                'amount': str(amount),
                'currency': 'UGX',
                'externalId': reference,
                'payer': {
                    'partyIdType': 'MSISDN',
                    'partyId': phone_number
                },
                'payerMessage': description,
                'payeeNote': description
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    f"{self.base_url}/requesttopay",
                    headers=headers,
                    json=payload
                ) as response:
                    if response.status == 202:
                        return {
                            'transaction_id': reference,
                            'status': 'pending',
                            'provider': 'mtn',
                            'timestamp': datetime.now().isoformat()
                        }
                    else:
                        error_data = await response.text()
                        raise PaymentError(
                            f"Payment initialization failed: {error_data}"
                        )
                        
        except Exception as e:
            logger.error(f"Error initializing MTN payment: {str(e)}")
            raise PaymentError("Payment initialization failed")
            
    async def check_payment_status(
        self,
        transaction_id: str
    ) -> Dict[str, Any]:
        """
        Check MTN Mobile Money payment status.
        """
        try:
            token = await self._get_auth_token()
            
            headers = {
                'Authorization': f'Bearer {token}',
                'X-Target-Environment': self.environment,
                'Ocp-Apim-Subscription-Key': self.api_key
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.get(
                    f"{self.base_url}/requesttopay/{transaction_id}",
                    headers=headers
                ) as response:
                    if response.status == 200:
                        data = await response.json()
                        return {
                            'transaction_id': transaction_id,
                            'status': data['status'].lower(),
                            'provider': 'mtn',
                            'timestamp': datetime.now().isoformat()
                        }
                    else:
                        error_data = await response.text()
                        raise PaymentError(
                            f"Failed to check payment status: {error_data}"
                        )
                        
        except Exception as e:
            logger.error(f"Error checking MTN payment status: {str(e)}")
            raise PaymentError("Failed to check payment status")
            
    async def process_callback(
        self,
        data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Process MTN Mobile Money callback.
        """
        try:
            return {
                'transaction_id': data.get('referenceId'),
                'status': data.get('status', 'unknown').lower(),
                'provider': 'mtn',
                'timestamp': datetime.now().isoformat(),
                'raw_data': data
            }
            
        except Exception as e:
            logger.error(f"Error processing MTN callback: {str(e)}")
            raise PaymentError("Failed to process callback")
            
    async def refund_payment(
        self,
        transaction_id: str,
        amount: Optional[Decimal] = None
    ) -> Dict[str, Any]:
        """
        Initiate MTN Mobile Money refund.
        """
        try:
            token = await self._get_auth_token()
            
            headers = {
                'Authorization': f'Bearer {token}',
                'X-Reference-Id': str(uuid.uuid4()),
                'X-Target-Environment': self.environment,
                'Ocp-Apim-Subscription-Key': self.api_key,
                'Content-Type': 'application/json'
            }
            
            payload = {
                'referenceId': transaction_id,
                'amount': str(amount) if amount else None
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    f"{self.base_url}/refund",
                    headers=headers,
                    json=payload
                ) as response:
                    if response.status == 202:
                        return {
                            'refund_id': headers['X-Reference-Id'],
                            'transaction_id': transaction_id,
                            'status': 'pending',
                            'provider': 'mtn',
                            'timestamp': datetime.now().isoformat()
                        }
                    else:
                        error_data = await response.text()
                        raise PaymentError(
                            f"Refund initiation failed: {error_data}"
                        )
                        
        except Exception as e:
            logger.error(f"Error initiating MTN refund: {str(e)}")
            raise PaymentError("Failed to initiate refund")
