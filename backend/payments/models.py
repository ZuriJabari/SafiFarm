from django.db import models
from django.contrib.auth import get_user_model
from django.utils.translation import gettext_lazy as _
import uuid

User = get_user_model()

class Transaction(models.Model):
    """Model for tracking payment transactions."""
    
    class Status(models.TextChoices):
        PENDING = 'pending', _('Pending')
        PROCESSING = 'processing', _('Processing')
        COMPLETED = 'completed', _('Completed')
        FAILED = 'failed', _('Failed')
        REFUNDED = 'refunded', _('Refunded')
        CANCELLED = 'cancelled', _('Cancelled')
        
    class Provider(models.TextChoices):
        MTN = 'mtn', _('MTN Mobile Money')
        AIRTEL = 'airtel', _('Airtel Money')
        
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )
    user = models.ForeignKey(
        User,
        on_delete=models.PROTECT,
        related_name='transactions'
    )
    amount = models.DecimalField(
        max_digits=10,
        decimal_places=2
    )
    currency = models.CharField(
        max_length=3,
        default='UGX'
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING
    )
    provider = models.CharField(
        max_length=20,
        choices=Provider.choices
    )
    provider_transaction_id = models.CharField(
        max_length=255,
        blank=True,
        null=True
    )
    phone_number = models.CharField(max_length=20)
    description = models.TextField(blank=True)
    metadata = models.JSONField(default=dict)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['provider']),
            models.Index(fields=['created_at']),
            models.Index(fields=['user', 'status']),
        ]
        
    def __str__(self):
        return f"{self.provider} - {self.amount} {self.currency} - {self.status}"


class Refund(models.Model):
    """Model for tracking refunds."""
    
    class Status(models.TextChoices):
        PENDING = 'pending', _('Pending')
        PROCESSING = 'processing', _('Processing')
        COMPLETED = 'completed', _('Completed')
        FAILED = 'failed', _('Failed')
        
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )
    transaction = models.ForeignKey(
        Transaction,
        on_delete=models.PROTECT,
        related_name='refunds'
    )
    amount = models.DecimalField(
        max_digits=10,
        decimal_places=2
    )
    reason = models.TextField()
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING
    )
    provider_refund_id = models.CharField(
        max_length=255,
        blank=True,
        null=True
    )
    metadata = models.JSONField(default=dict)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['created_at']),
            models.Index(fields=['transaction', 'status']),
        ]
        
    def __str__(self):
        return f"Refund for {self.transaction.id} - {self.amount} {self.transaction.currency}"


class WebhookEvent(models.Model):
    """Model for tracking webhook events from payment providers."""
    
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )
    provider = models.CharField(
        max_length=20,
        choices=Transaction.Provider.choices
    )
    event_type = models.CharField(max_length=100)
    payload = models.JSONField()
    transaction = models.ForeignKey(
        Transaction,
        on_delete=models.PROTECT,
        related_name='webhook_events',
        null=True,
        blank=True
    )
    processed = models.BooleanField(default=False)
    error_message = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    processed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['provider']),
            models.Index(fields=['event_type']),
            models.Index(fields=['processed']),
            models.Index(fields=['created_at']),
        ]
        
    def __str__(self):
        return f"{self.provider} - {self.event_type} - {self.created_at}"
