import aiohttp
import uuid
import hashlib
import json
from typing import Dict, Any, Optional
from decimal import Decimal
from datetime import datetime
from django.conf import settings
import logging
from .base import PaymentProvider
from ..exceptions import PaymentError

logger = logging.getLogger(__name__)

class AirtelMoneyProvider(PaymentProvider):
    """
    Airtel Money payment provider implementation.
    """
    
    def __init__(self):
        self.client_id = settings.AIRTEL_CLIENT_ID
        self.client_secret = settings.AIRTEL_CLIENT_SECRET
        self.environment = settings.AIRTEL_ENVIRONMENT
        
        # Set API endpoints based on environment
        if self.environment == 'production':
            self.base_url = 'https://openapi.airtel.africa'
        else:
            self.base_url = 'https://openapiuat.airtel.africa'
            
    async def _get_auth_token(self) -> str:
        """
        Get OAuth token for API authentication.
        """
        try:
            headers = {
                'Content-Type': 'application/json'
            }
            
            payload = {
                'client_id': self.client_id,
                'client_secret': self.client_secret,
                'grant_type': 'client_credentials'
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    f"{self.base_url}/auth/oauth2/token",
                    headers=headers,
                    json=payload
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
            logger.error(f"Error getting Airtel auth token: {str(e)}")
            raise PaymentError("Authentication failed")
            
    async def initialize_payment(
        self,
        amount: Decimal,
        phone_number: str,
        reference: str,
        description: str
    ) -> Dict[str, Any]:
        """
        Initialize Airtel Money payment.
        """
        try:
            token = await self._get_auth_token()
            
            # Format phone number (remove + and country code if present)
            phone_number = phone_number.replace('+', '').replace(' ', '')
            if phone_number.startswith('256'):
                phone_number = phone_number[3:]
                
            headers = {
                'Authorization': f'Bearer {token}',
                'Content-Type': 'application/json',
                'X-Country': 'UG',
                'X-Currency': 'UGX'
            }
            
            payload = {
                'reference': reference,
                'subscriber': {
                    'country': 'UG',
                    'currency': 'UGX',
                    'msisdn': phone_number
                },
                'transaction': {
                    'amount': str(amount),
                    'country': 'UG',
                    'currency': 'UGX',
                    'id': reference
                }
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    f"{self.base_url}/merchant/v1/payments",
                    headers=headers,
                    json=payload
                ) as response:
                    if response.status == 200:
                        data = await response.json()
                        return {
                            'transaction_id': reference,
                            'status': 'pending',
                            'provider': 'airtel',
                            'provider_ref': data.get('transaction', {}).get('id'),
                            'timestamp': datetime.now().isoformat()
                        }
                    else:
                        error_data = await response.text()
                        raise PaymentError(
                            f"Payment initialization failed: {error_data}"
                        )
                        
        except Exception as e:
            logger.error(f"Error initializing Airtel payment: {str(e)}")
            raise PaymentError("Payment initialization failed")
            
    async def check_payment_status(
        self,
        transaction_id: str
    ) -> Dict[str, Any]:
        """
        Check Airtel Money payment status.
        """
        try:
            token = await self._get_auth_token()
            
            headers = {
                'Authorization': f'Bearer {token}',
                'Content-Type': 'application/json',
                'X-Country': 'UG',
                'X-Currency': 'UGX'
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.get(
                    f"{self.base_url}/standard/v1/payments/{transaction_id}",
                    headers=headers
                ) as response:
                    if response.status == 200:
                        data = await response.json()
                        return {
                            'transaction_id': transaction_id,
                            'status': data.get('status', 'PENDING').lower(),
                            'provider': 'airtel',
                            'timestamp': datetime.now().isoformat()
                        }
                    else:
                        error_data = await response.text()
                        raise PaymentError(
                            f"Failed to check payment status: {error_data}"
                        )
                        
        except Exception as e:
            logger.error(f"Error checking Airtel payment status: {str(e)}")
            raise PaymentError("Failed to check payment status")
            
    async def process_callback(
        self,
        data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Process Airtel Money callback.
        """
        try:
            return {
                'transaction_id': data.get('transaction', {}).get('id'),
                'status': data.get('status', 'unknown').lower(),
                'provider': 'airtel',
                'timestamp': datetime.now().isoformat(),
                'raw_data': data
            }
            
        except Exception as e:
            logger.error(f"Error processing Airtel callback: {str(e)}")
            raise PaymentError("Failed to process callback")
            
    async def refund_payment(
        self,
        transaction_id: str,
        amount: Optional[Decimal] = None
    ) -> Dict[str, Any]:
        """
        Initiate Airtel Money refund.
        """
        try:
            token = await self._get_auth_token()
            
            headers = {
                'Authorization': f'Bearer {token}',
                'Content-Type': 'application/json',
                'X-Country': 'UG',
                'X-Currency': 'UGX'
            }
            
            payload = {
                'transaction': {
                    'id': transaction_id,
                    'amount': str(amount) if amount else None
                }
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    f"{self.base_url}/standard/v1/payments/refund",
                    headers=headers,
                    json=payload
                ) as response:
                    if response.status == 200:
                        data = await response.json()
                        return {
                            'refund_id': data.get('transaction', {}).get('id'),
                            'transaction_id': transaction_id,
                            'status': 'pending',
                            'provider': 'airtel',
                            'timestamp': datetime.now().isoformat()
                        }
                    else:
                        error_data = await response.text()
                        raise PaymentError(
                            f"Refund initiation failed: {error_data}"
                        )
                        
        except Exception as e:
            logger.error(f"Error initiating Airtel refund: {str(e)}")
            raise PaymentError("Failed to initiate refund")
