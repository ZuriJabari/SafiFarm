from django.shortcuts import render, get_object_or_404
from django.utils import timezone
from django.db import transaction
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from datetime import timedelta
import random
import string

from .models import PaymentMethod, Transaction, PaymentVerification
from .serializers import (
    PaymentMethodSerializer, TransactionSerializer,
    PaymentVerificationSerializer, VerifyCodeSerializer
)
from .providers import get_provider as get_payment_provider

# Create your views here.

class PaymentMethodViewSet(viewsets.ModelViewSet):
    """ViewSet for managing payment methods."""
    serializer_class = PaymentMethodSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return PaymentMethod.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        # If this is the user's first payment method, make it default
        if not PaymentMethod.objects.filter(user=self.request.user).exists():
            serializer.save(user=self.request.user, is_default=True)
        else:
            serializer.save(user=self.request.user)
    
    @action(detail=True, methods=['post'])
    def set_default(self, request, pk=None):
        """Set a payment method as default."""
        payment_method = self.get_object()
        PaymentMethod.objects.filter(user=request.user).update(is_default=False)
        payment_method.is_default = True
        payment_method.save()
        return Response({'status': 'success'})
    
    @action(detail=True, methods=['post'])
    def verify(self, request, pk=None):
        """Start verification process for a payment method."""
        payment_method = self.get_object()
        
        # Generate verification code
        verification_code = ''.join(random.choices(string.digits, k=6))
        expires_at = timezone.now() + timedelta(minutes=10)
        
        # Create or update verification record
        verification, _ = PaymentVerification.objects.update_or_create(
            payment_method=payment_method,
            defaults={
                'verification_code': verification_code,
                'expires_at': expires_at,
                'attempts': 0,
                'is_verified': False
            }
        )
        
        # TODO: Send verification code via SMS
        # For now, we'll just return it in the response (development only)
        return Response({
            'message': 'Verification code sent',
            'code': verification_code,  # Remove this in production
            'expires_at': expires_at
        })
    
    @action(detail=True, methods=['post'])
    def confirm_verification(self, request, pk=None):
        """Confirm payment method verification with code."""
        payment_method = self.get_object()
        serializer = VerifyCodeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        try:
            verification = PaymentVerification.objects.get(
                payment_method=payment_method,
                is_verified=False,
                expires_at__gt=timezone.now()
            )
        except PaymentVerification.DoesNotExist:
            return Response(
                {'error': 'No active verification found'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if verification.attempts >= 3:
            return Response(
                {'error': 'Too many attempts'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if verification.verification_code != serializer.validated_data['verification_code']:
            verification.attempts += 1
            verification.save()
            return Response(
                {'error': 'Invalid verification code'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        verification.is_verified = True
        verification.verified_at = timezone.now()
        verification.save()
        
        payment_method.is_verified = True
        payment_method.save()
        
        return Response({'status': 'success'})

class TransactionViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for viewing transactions."""
    serializer_class = TransactionSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Transaction.objects.filter(user=self.request.user)
    
    @action(detail=True, methods=['post'])
    def verify_status(self, request, pk=None):
        """Verify payment status with provider."""
        transaction = self.get_object()
        provider = get_payment_provider(transaction.payment_method.provider)
        result = provider.verify_payment(transaction)
        return Response(result)

class InitiatePaymentView(APIView):
    """View for initiating payments."""
    permission_classes = [permissions.IsAuthenticated]
    
    @transaction.atomic
    def post(self, request):
        """Initiate a new payment."""
        # Validate input
        payment_method_id = request.data.get('payment_method')
        if not payment_method_id:
            return Response(
                {'error': 'Payment method is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        payment_method = get_object_or_404(
            PaymentMethod, id=payment_method_id, user=request.user
        )
        
        if not payment_method.is_verified:
            return Response(
                {'error': 'Payment method not verified'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create transaction
        serializer = TransactionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        transaction = serializer.save(
            user=request.user,
            payment_method=payment_method,
            status='pending'
        )
        
        # Initiate payment with provider
        provider = get_payment_provider(payment_method.provider)
        result = provider.initiate_payment(transaction)
        
        if result['status'] == 'success':
            return Response({
                'status': 'success',
                'transaction': TransactionSerializer(transaction).data
            })
        
        return Response(
            {'error': result.get('message', 'Payment initiation failed')},
            status=status.HTTP_400_BAD_REQUEST
        )

class PaymentWebhookView(APIView):
    """View for handling payment provider webhooks."""
    permission_classes = []  # No authentication required for webhooks
    
    def post(self, request, provider):
        """Handle webhook notification from payment provider."""
        try:
            payment_provider = get_payment_provider(provider)
            transaction = payment_provider.process_webhook(request.data)
            
            if transaction:
                # Send notification to user about payment status
                # TODO: Implement notification system
                return Response({'status': 'success'})
            
            return Response(
                {'error': 'Transaction not found'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        except ValueError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
