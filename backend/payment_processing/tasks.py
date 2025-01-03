from celery import shared_task
from datetime import timedelta
from django.utils import timezone
from django.db import transaction
from django.conf import settings
from .models import Transaction, PaymentMethod
from .providers import get_provider, PaymentProviderError
from .notifications import send_payment_notification

@shared_task(
    name='payment_processing.check_pending_transactions',
    max_retries=3,
    default_retry_delay=60
)
def check_pending_transactions():
    """Check status of pending transactions."""
    pending_transactions = Transaction.objects.filter(
        status__in=['pending', 'processing'],
        created_at__gte=timezone.now() - timedelta(days=1)  # Only check last 24 hours
    ).select_related('payment_method')

    for txn in pending_transactions:
        try:
            provider = get_provider(txn.payment_method.provider)
            result = provider.verify_payment(txn)
            
            with transaction.atomic():
                if result['status'] == 'completed':
                    txn.status = 'completed'
                    txn.completed_at = timezone.now()
                    txn.provider_status = result['provider_status']
                    txn.save(update_fields=[
                        'status', 'completed_at', 'provider_status', 'updated_at'
                    ])
                    
                    # Send success notification
                    send_payment_notification.delay(
                        txn.id,
                        'success',
                        f"Payment of {txn.formatted_amount} has been confirmed."
                    )
                
                elif result['status'] == 'failed':
                    txn.status = 'failed'
                    txn.provider_status = result['provider_status']
                    txn.provider_message = result.get('reason', '')
                    txn.save(update_fields=[
                        'status', 'provider_status', 'provider_message', 'updated_at'
                    ])
                    
                    # Send failure notification
                    send_payment_notification.delay(
                        txn.id,
                        'error',
                        f"Payment of {txn.formatted_amount} has failed. {result.get('reason', '')}"
                    )
                
                # For processing/pending status, we just update the provider status
                else:
                    txn.provider_status = result['provider_status']
                    txn.save(update_fields=['provider_status', 'updated_at'])
        
        except PaymentProviderError as e:
            txn.increment_attempts(str(e))
            if txn.attempts >= settings.PAYMENT_SETTINGS['MAX_RETRIES']:
                txn.status = 'failed'
                txn.save(update_fields=['status', 'updated_at'])
                
                # Send failure notification
                send_payment_notification.delay(
                    txn.id,
                    'error',
                    f"Payment of {txn.formatted_amount} has failed after multiple attempts."
                )

@shared_task(
    name='payment_processing.expire_old_transactions',
    max_retries=3,
    default_retry_delay=60
)
def expire_old_transactions():
    """Mark expired transactions as expired."""
    expired_transactions = Transaction.objects.filter(
        status__in=['pending', 'processing'],
        expires_at__lt=timezone.now()
    ).select_related('payment_method')

    for txn in expired_transactions:
        with transaction.atomic():
            txn.status = 'expired'
            txn.save(update_fields=['status', 'updated_at'])
            
            # Send expiry notification
            send_payment_notification.delay(
                txn.id,
                'warning',
                f"Payment of {txn.formatted_amount} has expired."
            )

@shared_task(
    name='payment_processing.retry_failed_transactions',
    max_retries=3,
    default_retry_delay=60
)
def retry_failed_transactions():
    """Retry failed transactions that are eligible for retry."""
    retry_window = timezone.now() - timedelta(hours=1)
    failed_transactions = Transaction.objects.filter(
        status='failed',
        attempts__lt=settings.PAYMENT_SETTINGS['MAX_RETRIES'],
        updated_at__gte=retry_window
    ).select_related('payment_method')

    for txn in failed_transactions:
        try:
            provider = get_provider(txn.payment_method.provider)
            
            # Reset status to pending and increment attempts
            txn.status = 'pending'
            txn.increment_attempts()
            
            # Try to initiate payment again
            result = provider.initiate_payment(txn)
            
            with transaction.atomic():
                txn.provider_ref = result['provider_ref']
                txn.provider_status = result['status']
                txn.save(update_fields=[
                    'provider_ref', 'provider_status', 'updated_at'
                ])
                
                # Send retry notification
                send_payment_notification.delay(
                    txn.id,
                    'info',
                    f"Retrying payment of {txn.formatted_amount}."
                )
        
        except PaymentProviderError as e:
            txn.status = 'failed'
            txn.last_error = str(e)
            txn.save(update_fields=['status', 'last_error', 'updated_at'])
            
            # Send failure notification
            send_payment_notification.delay(
                txn.id,
                'error',
                f"Failed to retry payment of {txn.formatted_amount}. {str(e)}"
            )

@shared_task(
    name='payment_processing.clean_old_transactions',
    max_retries=3,
    default_retry_delay=60
)
def clean_old_transactions():
    """Clean up old transaction records."""
    # Archive transactions older than 90 days
    cutoff_date = timezone.now() - timedelta(days=90)
    old_transactions = Transaction.objects.filter(
        created_at__lt=cutoff_date,
        status__in=['completed', 'failed', 'expired', 'cancelled']
    )
    
    # Here you might want to archive these transactions to a different storage
    # For now, we'll just update their metadata
    for txn in old_transactions:
        txn.metadata['archived'] = True
        txn.metadata['archived_at'] = timezone.now().isoformat()
        txn.save(update_fields=['metadata', 'updated_at'])
