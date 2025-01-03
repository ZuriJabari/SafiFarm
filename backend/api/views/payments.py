from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.conf import settings
import uuid
from decimal import Decimal
from payments.services import PaymentService
from payments.exceptions import PaymentError
import logging

logger = logging.getLogger(__name__)

class PaymentViewSet(viewsets.ViewSet):
    """
    ViewSet for handling payment operations.
    """
    
    @action(detail=False, methods=['POST'])
    async def initialize(self, request):
        """
        Initialize a payment transaction.
        """
        try:
            # Validate request data
            amount = request.data.get('amount')
            phone_number = request.data.get('phone_number')
            provider = request.data.get('provider', 'mtn').lower()
            description = request.data.get('description', 'Payment for SafiFarm services')
            
            if not all([amount, phone_number]):
                return Response(
                    {'error': 'Amount and phone number are required'},
                    status=status.HTTP_400_BAD_REQUEST
                )
                
            if provider not in settings.PAYMENT_SETTINGS['SUPPORTED_PROVIDERS']:
                return Response(
                    {'error': f'Unsupported payment provider: {provider}'},
                    status=status.HTTP_400_BAD_REQUEST
                )
                
            # Generate unique reference
            reference = str(uuid.uuid4())
            
            # Initialize payment
            result = await PaymentService.initialize_payment(
                provider,
                Decimal(amount),
                phone_number,
                reference,
                description
            )
            
            return Response(result, status=status.HTTP_200_OK)
            
        except PaymentError as e:
            logger.error(f"Payment initialization failed: {str(e)}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            logger.error(f"Unexpected error in payment initialization: {str(e)}")
            return Response(
                {'error': 'Internal server error'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
            
    @action(detail=False, methods=['GET'])
    async def status(self, request):
        """
        Check payment status.
        """
        try:
            transaction_id = request.query_params.get('transaction_id')
            provider = request.query_params.get('provider', 'mtn').lower()
            
            if not transaction_id:
                return Response(
                    {'error': 'Transaction ID is required'},
                    status=status.HTTP_400_BAD_REQUEST
                )
                
            result = await PaymentService.check_payment_status(
                provider,
                transaction_id
            )
            
            return Response(result, status=status.HTTP_200_OK)
            
        except PaymentError as e:
            logger.error(f"Payment status check failed: {str(e)}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            logger.error(f"Unexpected error in payment status check: {str(e)}")
            return Response(
                {'error': 'Internal server error'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
            
    @action(detail=False, methods=['POST'])
    async def callback(self, request):
        """
        Handle payment provider callbacks.
        """
        try:
            provider = request.query_params.get('provider', 'mtn').lower()
            
            result = await PaymentService.process_callback(
                provider,
                request.data
            )
            
            return Response(result, status=status.HTTP_200_OK)
            
        except PaymentError as e:
            logger.error(f"Payment callback processing failed: {str(e)}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            logger.error(f"Unexpected error in payment callback: {str(e)}")
            return Response(
                {'error': 'Internal server error'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
            
    @action(detail=False, methods=['POST'])
    async def refund(self, request):
        """
        Initiate payment refund.
        """
        try:
            transaction_id = request.data.get('transaction_id')
            provider = request.data.get('provider', 'mtn').lower()
            amount = request.data.get('amount')
            
            if not transaction_id:
                return Response(
                    {'error': 'Transaction ID is required'},
                    status=status.HTTP_400_BAD_REQUEST
                )
                
            result = await PaymentService.refund_payment(
                provider,
                transaction_id,
                Decimal(amount) if amount else None
            )
            
            return Response(result, status=status.HTTP_200_OK)
            
        except PaymentError as e:
            logger.error(f"Payment refund failed: {str(e)}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            logger.error(f"Unexpected error in payment refund: {str(e)}")
            return Response(
                {'error': 'Internal server error'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
