import requests
import uuid
import base64
import json
from datetime import datetime
from django.conf import settings
import logging

logger = logging.getLogger(__name__)

class PaymentService:
    def __init__(self, provider='MTN'):
        self.provider = provider
        self.config = settings.MOBILE_MONEY[provider]
        self.environment = self.config['ENVIRONMENT']
        self.api_key = self.config['API_KEY']
        self.api_secret = self.config['API_SECRET']
        self.base_url = self._get_base_url()

    def _get_base_url(self):
        """Get the appropriate API base URL based on environment"""
        if self.provider == 'MTN':
            return {
                'sandbox': 'https://sandbox.momodeveloper.mtn.com',
                'production': 'https://api.momodeveloper.mtn.com'
            }[self.environment]
        elif self.provider == 'AIRTEL':
            return {
                'sandbox': 'https://openapiuat.airtel.africa',
                'production': 'https://openapi.airtel.africa'
            }[self.environment]

    def _get_auth_token(self):
        """Get OAuth token for API authentication"""
        try:
            if self.provider == 'MTN':
                url = f"{self.base_url}/collection/token/"
                subscription_key = self.api_key
                auth_string = base64.b64encode(
                    f"{self.api_key}:{self.api_secret}".encode()
                ).decode()

                headers = {
                    'Authorization': f'Basic {auth_string}',
                    'Ocp-Apim-Subscription-Key': subscription_key,
                }

                response = requests.post(url, headers=headers)
                response.raise_for_status()
                return response.json()['access_token']

            elif self.provider == 'AIRTEL':
                url = f"{self.base_url}/auth/oauth2/token"
                data = {
                    'client_id': self.api_key,
                    'client_secret': self.api_secret,
                    'grant_type': 'client_credentials'
                }

                response = requests.post(url, data=data)
                response.raise_for_status()
                return response.json()['access_token']

        except Exception as e:
            logger.error(f"Error getting auth token: {str(e)}")
            raise

    def initiate_payment(self, payment):
        """
        Initiate a mobile money payment request
        
        Args:
            payment: Payment model instance
            
        Returns:
            dict: Response from the payment provider
        """
        try:
            token = self._get_auth_token()
            
            if self.provider == 'MTN':
                return self._initiate_mtn_payment(payment, token)
            elif self.provider == 'AIRTEL':
                return self._initiate_airtel_payment(payment, token)
            
        except Exception as e:
            logger.error(f"Error initiating payment: {str(e)}")
            raise

    def _initiate_mtn_payment(self, payment, token):
        """Initiate MTN Mobile Money payment"""
        url = f"{self.base_url}/collection/v1_0/requesttopay"
        
        headers = {
            'Authorization': f'Bearer {token}',
            'X-Reference-Id': str(payment.id),
            'X-Target-Environment': self.environment,
            'Content-Type': 'application/json',
            'Ocp-Apim-Subscription-Key': self.api_key
        }

        payload = {
            'amount': str(payment.amount),
            'currency': payment.currency,
            'externalId': str(payment.id),
            'payer': {
                'partyIdType': 'MSISDN',
                'partyId': payment.phone_number
            },
            'payerMessage': payment.description,
            'payeeNote': 'Payment for SafiFarm services'
        }

        response = requests.post(url, headers=headers, json=payload)
        response.raise_for_status()
        
        return {
            'status': 'PENDING',
            'transaction_id': str(payment.id),
            'provider_reference': response.headers.get('X-Reference-Id')
        }

    def _initiate_airtel_payment(self, payment, token):
        """Initiate Airtel Money payment"""
        url = f"{self.base_url}/merchant/v1/payments/"
        
        headers = {
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json'
        }

        payload = {
            'reference': str(payment.id),
            'subscriber': {
                'country': 'UGA',
                'currency': payment.currency,
                'msisdn': payment.phone_number
            },
            'transaction': {
                'amount': str(payment.amount),
                'country': 'UGA',
                'currency': payment.currency,
                'id': str(payment.id)
            }
        }

        response = requests.post(url, headers=headers, json=payload)
        response.raise_for_status()
        
        return {
            'status': 'PENDING',
            'transaction_id': str(payment.id),
            'provider_reference': response.json().get('transaction', {}).get('id')
        }

    def check_payment_status(self, payment):
        """
        Check the status of a payment
        
        Args:
            payment: Payment model instance
            
        Returns:
            dict: Payment status information
        """
        try:
            token = self._get_auth_token()
            
            if self.provider == 'MTN':
                return self._check_mtn_payment_status(payment, token)
            elif self.provider == 'AIRTEL':
                return self._check_airtel_payment_status(payment, token)
            
        except Exception as e:
            logger.error(f"Error checking payment status: {str(e)}")
            raise

    def _check_mtn_payment_status(self, payment, token):
        """Check MTN Mobile Money payment status"""
        url = f"{self.base_url}/collection/v1_0/requesttopay/{payment.id}"
        
        headers = {
            'Authorization': f'Bearer {token}',
            'X-Target-Environment': self.environment,
            'Ocp-Apim-Subscription-Key': self.api_key
        }

        response = requests.get(url, headers=headers)
        response.raise_for_status()
        
        status_data = response.json()
        return {
            'status': status_data.get('status', 'FAILED'),
            'transaction_id': str(payment.id),
            'provider_reference': status_data.get('financialTransactionId')
        }

    def _check_airtel_payment_status(self, payment, token):
        """Check Airtel Money payment status"""
        url = f"{self.base_url}/standard/v1/payments/{payment.id}"
        
        headers = {
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json'
        }

        response = requests.get(url, headers=headers)
        response.raise_for_status()
        
        status_data = response.json()
        return {
            'status': status_data.get('status', 'FAILED'),
            'transaction_id': str(payment.id),
            'provider_reference': status_data.get('transaction', {}).get('id')
        }

    def validate_phone_number(self, phone_number):
        """
        Validate phone number format for the provider
        
        Args:
            phone_number (str): Phone number to validate
            
        Returns:
            bool: True if valid, False otherwise
        """
        if self.provider == 'MTN':
            # MTN Uganda numbers start with 077 or 078
            return phone_number.startswith(('077', '078'))
        elif self.provider == 'AIRTEL':
            # Airtel Uganda numbers start with 075
            return phone_number.startswith('075')
        return False 