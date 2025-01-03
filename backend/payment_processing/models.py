from django.db import models
import uuid
from django.contrib.auth import get_user_model
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.utils.translation import gettext_lazy as _
from decimal import Decimal
from .currency_utils import validate_transaction_amount, format_ugx
from django.core.exceptions import ValidationError
from typing import Dict, Union
from django.utils import timezone
from datetime import timedelta

User = get_user_model()

class PaymentMethod(models.Model):
    """Model for storing user payment methods."""
    PROVIDER_CHOICES = [
        ('mtn', 'MTN Mobile Money'),
        ('airtel', 'Airtel Money'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='payment_methods')
    provider = models.CharField(max_length=20, choices=PROVIDER_CHOICES)
    phone_number = models.CharField(max_length=15)
    is_default = models.BooleanField(default=False)
    is_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = [['user', 'provider', 'phone_number']]
        ordering = ['-is_default', '-created_at']
    
    def __str__(self):
        return f"{self.get_provider_display()} - {self.phone_number}"
    
    def save(self, *args, **kwargs):
        if self.is_default:
            # Set all other payment methods of this user to non-default
            PaymentMethod.objects.filter(user=self.user).update(is_default=False)
        super().save(*args, **kwargs)

class Transaction(models.Model):
    """Model for tracking all payment transactions."""
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('refunded', 'Refunded'),
        ('expired', 'Expired'),
        ('cancelled', 'Cancelled')
    ]
    
    TYPE_CHOICES = [
        ('rental', 'Equipment Rental'),
        ('consultation', 'Specialist Consultation'),
        ('refund', 'Refund'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.PROTECT, related_name='transactions')
    payment_method = models.ForeignKey(PaymentMethod, on_delete=models.PROTECT)
    amount = models.DecimalField(max_digits=12, decimal_places=0)
    currency = models.CharField(max_length=3, default='UGX', editable=False)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    transaction_type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    description = models.CharField(max_length=255, blank=True)
    
    # Provider details
    provider_ref = models.CharField(max_length=100, blank=True)
    provider_status = models.CharField(max_length=50, blank=True)
    provider_message = models.TextField(blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    
    # Additional tracking
    attempts = models.PositiveSmallIntegerField(default=0)
    last_error = models.TextField(blank=True)
    metadata = models.JSONField(default=dict, blank=True)
    
    # Related object (rental or consultation)
    content_type = models.ForeignKey(ContentType, on_delete=models.PROTECT)
    object_id = models.UUIDField()
    content_object = GenericForeignKey('content_type', 'object_id')
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status', 'created_at']),
            models.Index(fields=['user', 'status']),
            models.Index(fields=['payment_method', 'status']),
            models.Index(fields=['provider_ref']),
        ]
    
    def clean(self):
        """Validate transaction data."""
        super().clean()
        if self.amount:
            try:
                self.amount = validate_transaction_amount(
                    self.amount,
                    self.transaction_type
                )
            except ValueError as e:
                raise ValidationError({'amount': str(e)})
    
    def save(self, *args, **kwargs):
        """Override save to ensure amount validation and set expiry."""
        if not self.expires_at and self.status == 'pending':
            # Set expiry to 30 minutes from creation
            self.expires_at = timezone.now() + timedelta(minutes=30)
        
        self.full_clean()
        super().save(*args, **kwargs)
    
    @property
    def formatted_amount(self) -> str:
        """Return formatted amount in UGX."""
        return format_ugx(self.amount)
    
    @property
    def is_expired(self) -> bool:
        """Check if transaction has expired."""
        return (
            self.expires_at and 
            timezone.now() > self.expires_at and 
            self.status in ['pending', 'processing']
        )
    
    def mark_expired(self):
        """Mark transaction as expired."""
        self.status = 'expired'
        self.save(update_fields=['status', 'updated_at'])
    
    def increment_attempts(self, error_message: str = ''):
        """Increment attempt counter and store error."""
        self.attempts += 1
        if error_message:
            self.last_error = error_message
        self.save(update_fields=['attempts', 'last_error', 'updated_at'])
    
    def __str__(self) -> str:
        return f"{self.formatted_amount} - {self.get_transaction_type_display()}"

class PaymentVerification(models.Model):
    """Model for storing payment verification codes and attempts."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    payment_method = models.ForeignKey(PaymentMethod, on_delete=models.CASCADE)
    verification_code = models.CharField(max_length=6)
    attempts = models.PositiveSmallIntegerField(default=0)
    is_verified = models.BooleanField(default=False)
    expires_at = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)
    verified_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Verification for {self.payment_method}"
