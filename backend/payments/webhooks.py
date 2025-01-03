from django.http import HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
from django.utils import timezone
import hmac
import hashlib
import json
from typing import Dict, Any, Optional
from .models import Transaction, WebhookEvent
from .services import PaymentService
import logging

logger = logging.getLogger(__name__)

def verify_mtn_signature(request) -> bool:
    """Verify MTN webhook signature."""
    try:
        signature = request.headers.get('X-MTN-Signature')
        if not signature:
            return False
            
        secret = settings.MTN_WEBHOOK_SECRET
        payload = request.body.decode('utf-8')
        
        expected_signature = hmac.new(
            secret.encode(),
            payload.encode(),
            hashlib.sha256
        ).hexdigest()
        
        return hmac.compare_digest(signature, expected_signature)
    except Exception as e:
        logger.error(f"Error verifying MTN signature: {str(e)}")
        return False

def verify_airtel_signature(request) -> bool:
    """Verify Airtel webhook signature."""
    try:
        signature = request.headers.get('X-Airtel-Signature')
        if not signature:
            return False
            
        secret = settings.AIRTEL_WEBHOOK_SECRET
        payload = request.body.decode('utf-8')
        
        expected_signature = hmac.new(
            secret.encode(),
            payload.encode(),
            hashlib.sha256
        ).hexdigest()
        
        return hmac.compare_digest(signature, expected_signature)
    except Exception as e:
        logger.error(f"Error verifying Airtel signature: {str(e)}")
        return False

def process_mtn_webhook(event_type: str, payload: Dict[str, Any]) -> Optional[Transaction]:
    """Process MTN webhook event."""
    try:
        transaction_id = payload.get('transactionId')
        if not transaction_id:
            return None
            
        transaction = Transaction.objects.filter(
            provider_transaction_id=transaction_id,
            provider=Transaction.Provider.MTN
        ).first()
        
        if not transaction:
            return None
            
        if event_type == 'payment.success':
            transaction.status = Transaction.Status.COMPLETED
            transaction.completed_at = timezone.now()
        elif event_type == 'payment.failed':
            transaction.status = Transaction.Status.FAILED
        elif event_type == 'payment.cancelled':
            transaction.status = Transaction.Status.CANCELLED
            
        transaction.metadata['webhook_data'] = payload
        transaction.save()
        
        return transaction
    except Exception as e:
        logger.error(f"Error processing MTN webhook: {str(e)}")
        return None

def process_airtel_webhook(event_type: str, payload: Dict[str, Any]) -> Optional[Transaction]:
    """Process Airtel webhook event."""
    try:
        transaction_id = payload.get('transaction', {}).get('id')
        if not transaction_id:
            return None
            
        transaction = Transaction.objects.filter(
            provider_transaction_id=transaction_id,
            provider=Transaction.Provider.AIRTEL
        ).first()
        
        if not transaction:
            return None
            
        if event_type == 'payment.success':
            transaction.status = Transaction.Status.COMPLETED
            transaction.completed_at = timezone.now()
        elif event_type == 'payment.failed':
            transaction.status = Transaction.Status.FAILED
        elif event_type == 'payment.cancelled':
            transaction.status = Transaction.Status.CANCELLED
            
        transaction.metadata['webhook_data'] = payload
        transaction.save()
        
        return transaction
    except Exception as e:
        logger.error(f"Error processing Airtel webhook: {str(e)}")
        return None

@csrf_exempt
@require_POST
def mtn_webhook(request):
    """Handle MTN webhook callbacks."""
    try:
        if not verify_mtn_signature(request):
            return HttpResponse(status=401)
            
        payload = json.loads(request.body)
        event_type = payload.get('type')
        
        # Record webhook event
        webhook_event = WebhookEvent.objects.create(
            provider=Transaction.Provider.MTN,
            event_type=event_type,
            payload=payload
        )
        
        # Process the webhook
        transaction = process_mtn_webhook(event_type, payload)
        if transaction:
            webhook_event.transaction = transaction
            webhook_event.processed = True
            webhook_event.processed_at = timezone.now()
            webhook_event.save()
            
        return HttpResponse(status=200)
        
    except Exception as e:
        logger.error(f"Error in MTN webhook: {str(e)}")
        return HttpResponse(status=500)

@csrf_exempt
@require_POST
def airtel_webhook(request):
    """Handle Airtel webhook callbacks."""
    try:
        if not verify_airtel_signature(request):
            return HttpResponse(status=401)
            
        payload = json.loads(request.body)
        event_type = payload.get('type')
        
        # Record webhook event
        webhook_event = WebhookEvent.objects.create(
            provider=Transaction.Provider.AIRTEL,
            event_type=event_type,
            payload=payload
        )
        
        # Process the webhook
        transaction = process_airtel_webhook(event_type, payload)
        if transaction:
            webhook_event.transaction = transaction
            webhook_event.processed = True
            webhook_event.processed_at = timezone.now()
            webhook_event.save()
            
        return HttpResponse(status=200)
        
    except Exception as e:
        logger.error(f"Error in Airtel webhook: {str(e)}")
        return HttpResponse(status=500)
