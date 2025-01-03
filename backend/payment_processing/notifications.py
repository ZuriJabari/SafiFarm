from abc import ABC, abstractmethod
import africastalking
from django.conf import settings
from django.template.loader import render_to_string
from celery import shared_task
from django.core.mail import send_mail
from django.utils import timezone
from .models import Transaction

class SMSProvider(ABC):
    """Abstract base class for SMS providers."""
    
    @abstractmethod
    def send_sms(self, phone_number: str, message: str) -> dict:
        """Send SMS message."""
        pass

class AfricasTalkingSMSProvider(SMSProvider):
    """Implementation for Africa's Talking SMS provider."""
    
    def __init__(self):
        # Initialize Africa's Talking SDK
        africastalking.initialize(
            settings.SMS_PROVIDER['API_KEY'],
            settings.SMS_PROVIDER['SENDER_ID']
        )
        self.sms = africastalking.SMS
    
    def send_sms(self, phone_number: str, message: str) -> dict:
        """Send SMS using Africa's Talking."""
        try:
            response = self.sms.send(message, [phone_number])
            return {
                'status': 'success',
                'message_id': response['SMSMessageData']['Recipients'][0]['messageId']
            }
        except Exception as e:
            return {
                'status': 'error',
                'message': str(e)
            }

def get_sms_provider() -> SMSProvider:
    """Factory function to get SMS provider."""
    providers = {
        'africastalking': AfricasTalkingSMSProvider,
    }
    
    provider_name = settings.SMS_PROVIDER['NAME'].lower()
    provider_class = providers.get(provider_name)
    
    if not provider_class:
        raise ValueError(f'Unsupported SMS provider: {provider_name}')
    
    return provider_class()

def send_verification_code(phone_number: str, code: str) -> dict:
    """Send verification code via SMS."""
    message = render_to_string('payment_processing/sms/verification_code.txt', {
        'code': code
    })
    
    provider = get_sms_provider()
    return provider.send_sms(phone_number, message)

def send_payment_confirmation(phone_number: str, amount: float, 
                            currency: str, transaction_type: str) -> dict:
    """Send payment confirmation via SMS."""
    message = render_to_string('payment_processing/sms/payment_confirmation.txt', {
        'amount': amount,
        'currency': currency,
        'transaction_type': transaction_type
    })
    
    provider = get_sms_provider()
    return provider.send_sms(phone_number, message)

@shared_task(
    name='payment_processing.send_payment_notification',
    max_retries=3,
    default_retry_delay=60
)
def send_payment_notification(transaction_id: str, notification_type: str, message: str):
    """Send payment notification via SMS."""
    try:
        transaction = Transaction.objects.select_related(
            'user', 'payment_method'
        ).get(id=transaction_id)
        
        # Get phone number from payment method
        phone_number = transaction.payment_method.phone_number
        
        # Get notification template based on type
        template_name = f'payment_processing/sms/payment_{notification_type}.txt'
        
        # Render notification message
        notification_message = render_to_string(template_name, {
            'amount': transaction.formatted_amount,
            'status': transaction.get_status_display(),
            'message': message,
            'transaction_type': transaction.get_transaction_type_display()
        })
        
        # Send SMS using the configured provider
        provider = get_sms_provider()
        result = provider.send_sms(phone_number, notification_message)
        
        # Log the notification in transaction metadata
        transaction.metadata.setdefault('notifications', []).append({
            'type': notification_type,
            'message': message,
            'status': result.get('status'),
            'sent_at': timezone.now().isoformat()
        })
        transaction.save(update_fields=['metadata', 'updated_at'])
        
        return result
        
    except Transaction.DoesNotExist:
        # Log error but don't retry for non-existent transactions
        return {'status': 'error', 'message': f'Transaction {transaction_id} not found'}
        
    except Exception as e:
        # Retry for other errors
        send_payment_notification.retry(exc=e)

@shared_task(
    name='payment_processing.send_admin_notification',
    max_retries=3,
    default_retry_delay=60
)
def send_admin_notification(transaction_id: str, notification_type: str, message: str):
    """Send admin notification for payment events."""
    try:
        transaction = Transaction.objects.select_related(
            'user', 'payment_method'
        ).get(id=transaction_id)
        
        # Get admin email from settings
        admin_email = settings.PAYMENT_SETTINGS.get('ADMIN_EMAIL')
        if not admin_email:
            return {'status': 'error', 'message': 'Admin email not configured'}
        
        # Render email template
        subject = f'Payment {notification_type.title()} - {transaction.id}'
        context = {
            'transaction': transaction,
            'message': message,
            'notification_type': notification_type
        }
        
        html_message = render_to_string(
            'payment_processing/emails/admin_notification.html',
            context
        )
        
        # Send email
        send_mail(
            subject=subject,
            message=strip_tags(html_message),
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[admin_email],
            html_message=html_message
        )
        
        return {'status': 'success'}
        
    except Transaction.DoesNotExist:
        return {'status': 'error', 'message': f'Transaction {transaction_id} not found'}
        
    except Exception as e:
        send_admin_notification.retry(exc=e)
