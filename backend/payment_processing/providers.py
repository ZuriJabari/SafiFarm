from abc import ABC, abstractmethod
from typing import Dict, Any
import requests
import uuid
import json
from datetime import datetime, timedelta
from django.conf import settings
from django.core.cache import cache
from .models import Transaction

class PaymentProviderError(Exception):
    """Custom exception for payment provider errors."""
    pass

class PaymentProvider(ABC):
    """Abstract base class for payment providers."""
    
    @abstractmethod
    def initiate_payment(self, transaction: Transaction) -> Dict[str, Any]:
        """Initiate payment with provider."""
        pass
    
    @abstractmethod
    def verify_payment(self, transaction: Transaction) -> Dict[str, Any]:
        """Verify payment status with provider."""
        pass
    
    @abstractmethod
    def process_webhook(self, payload: Dict) -> Dict[str, Any]:
        """Process webhook notification from provider."""
        pass

class MTNMobileMoneyProvider(PaymentProvider):
    """Implementation for MTN Mobile Money."""
    
    def __init__(self):
        self.config = settings.PAYMENT_PROVIDERS['MTN']
        self.headers = {
            'X-Target-Environment': self.config['ENVIRONMENT'],
            'Ocp-Apim-Subscription-Key': self.config['SUBSCRIPTION_KEY'],
            'Content-Type': 'application/json'
        }
    
    def _get_access_token(self) -> str:
        """Get OAuth access token from MTN."""
        cache_key = 'mtn_access_token'
        token = cache.get(cache_key)
        
        if token:
            return token
            
        try:
            auth_url = f"{self.config['API_BASE_URL']}/token/"
            response = requests.post(
                auth_url,
                headers={
                    'Ocp-Apim-Subscription-Key': self.config['SUBSCRIPTION_KEY']
                },
                auth=(self.config['API_KEY'], self.config['API_SECRET'])
            )
            response.raise_for_status()
            token = response.json()['access_token']
            
            # Cache token for 50 minutes (tokens usually valid for 1 hour)
            cache.set(cache_key, token, timeout=3000)
            return token
            
        except requests.RequestException as e:
            raise PaymentProviderError(f"Failed to get MTN access token: {str(e)}")
    
    def initiate_payment(self, transaction: Transaction) -> Dict[str, Any]:
        """Initiate MTN Mobile Money payment."""
        try:
            token = self._get_access_token()
            self.headers['Authorization'] = f'Bearer {token}'
            
            payload = {
                'amount': str(int(transaction.amount)),
                'currency': 'UGX',
                'externalId': str(transaction.id),
                'payer': {
                    'partyIdType': 'MSISDN',
                    'partyId': transaction.payment_method.phone_number
                },
                'payerMessage': f'Payment for {transaction.get_transaction_type_display()}',
                'payeeNote': f'SafiFarm {transaction.get_transaction_type_display()}',
                'callbackUrl': self.config['CALLBACK_URL']
            }
            
            response = requests.post(
                f"{self.config['API_BASE_URL']}/requesttopay",
                headers=self.headers,
                json=payload
            )
            response.raise_for_status()
            
            return {
                'provider_ref': response.headers.get('X-Reference-Id'),
                'status': 'pending'
            }
            
        except requests.RequestException as e:
            raise PaymentProviderError(f"MTN payment initiation failed: {str(e)}")
    
    def verify_payment(self, transaction: Transaction) -> Dict[str, Any]:
        """Verify MTN Mobile Money payment status."""
        try:
            token = self._get_access_token()
            self.headers['Authorization'] = f'Bearer {token}'
            
            response = requests.get(
                f"{self.config['API_BASE_URL']}/requesttopay/{transaction.provider_ref}",
                headers=self.headers
            )
            response.raise_for_status()
            
            status_data = response.json()
            return {
                'status': status_data.get('status', 'UNKNOWN').lower(),
                'provider_status': status_data.get('status'),
                'reason': status_data.get('reason', '')
            }
            
        except requests.RequestException as e:
            raise PaymentProviderError(f"MTN payment verification failed: {str(e)}")
    
    def process_webhook(self, payload: Dict) -> Dict[str, Any]:
        """Process MTN Mobile Money webhook notification."""
        try:
            return {
                'transaction_id': payload.get('externalId'),
                'status': payload.get('status', 'UNKNOWN').lower(),
                'provider_ref': payload.get('referenceId'),
                'reason': payload.get('reason', '')
            }
        except Exception as e:
            raise PaymentProviderError(f"MTN webhook processing failed: {str(e)}")

class AirtelMoneyProvider(PaymentProvider):
    """Implementation for Airtel Money."""
    
    def __init__(self):
        self.config = settings.PAYMENT_PROVIDERS['AIRTEL']
        self.headers = {
            'Content-Type': 'application/json',
            'X-Country': 'UGA',
            'X-Currency': 'UGX'
        }
    
    def _get_access_token(self) -> str:
        """Get OAuth access token from Airtel."""
        cache_key = 'airtel_access_token'
        token = cache.get(cache_key)
        
        if token:
            return token
            
        try:
            auth_url = f"{self.config['API_BASE_URL']}/oauth2/token"
            response = requests.post(
                auth_url,
                headers={'Content-Type': 'application/json'},
                json={
                    'client_id': self.config['CLIENT_ID'],
                    'client_secret': self.config['API_SECRET'],
                    'grant_type': 'client_credentials'
                }
            )
            response.raise_for_status()
            token = response.json()['access_token']
            
            # Cache token for 50 minutes
            cache.set(cache_key, token, timeout=3000)
            return token
            
        except requests.RequestException as e:
            raise PaymentProviderError(f"Failed to get Airtel access token: {str(e)}")
    
    def initiate_payment(self, transaction: Transaction) -> Dict[str, Any]:
        """Initiate Airtel Money payment."""
        try:
            token = self._get_access_token()
            self.headers['Authorization'] = f'Bearer {token}'
            
            payload = {
                'reference': str(transaction.id),
                'subscriber': {
                    'country': 'UGA',
                    'currency': 'UGX',
                    'msisdn': transaction.payment_method.phone_number
                },
                'transaction': {
                    'amount': str(int(transaction.amount)),
                    'country': 'UGA',
                    'currency': 'UGX',
                    'id': str(transaction.id)
                },
                'callbackUrl': self.config['CALLBACK_URL']
            }
            
            response = requests.post(
                f"{self.config['API_BASE_URL']}/collections",
                headers=self.headers,
                json=payload
            )
            response.raise_for_status()
            
            return {
                'provider_ref': response.json().get('transaction', {}).get('id'),
                'status': 'pending'
            }
            
        except requests.RequestException as e:
            raise PaymentProviderError(f"Airtel payment initiation failed: {str(e)}")
    
    def verify_payment(self, transaction: Transaction) -> Dict[str, Any]:
        """Verify Airtel Money payment status."""
        try:
            token = self._get_access_token()
            self.headers['Authorization'] = f'Bearer {token}'
            
            response = requests.get(
                f"{self.config['API_BASE_URL']}/collections/{transaction.provider_ref}",
                headers=self.headers
            )
            response.raise_for_status()
            
            status_data = response.json()
            return {
                'status': status_data.get('status', 'UNKNOWN').lower(),
                'provider_status': status_data.get('status'),
                'reason': status_data.get('message', '')
            }
            
        except requests.RequestException as e:
            raise PaymentProviderError(f"Airtel payment verification failed: {str(e)}")
    
    def process_webhook(self, payload: Dict) -> Dict[str, Any]:
        """Process Airtel Money webhook notification."""
        try:
            transaction_data = payload.get('transaction', {})
            return {
                'transaction_id': transaction_data.get('id'),
                'status': payload.get('status', 'UNKNOWN').lower(),
                'provider_ref': transaction_data.get('id'),
                'reason': payload.get('message', '')
            }
        except Exception as e:
            raise PaymentProviderError(f"Airtel webhook processing failed: {str(e)}")

def get_provider(provider_name: str) -> PaymentProvider:
    """Factory function to get payment provider instance."""
    providers = {
        'mtn': MTNMobileMoneyProvider,
        'airtel': AirtelMoneyProvider
    }
    
    provider_class = providers.get(provider_name.lower())
    if not provider_class:
        raise ValueError(f"Unsupported payment provider: {provider_name}")
    
    return provider_class()
