from celery import shared_task
from django.utils import timezone
from datetime import timedelta
from .services.notification_service import NotificationService
from .models import Booking, Payment, CropAnalysis

notification_service = NotificationService()

@shared_task
def send_booking_reminder():
    """Send reminders for bookings that are about to start"""
    reminder_time = timezone.now() + timedelta(minutes=60)
    bookings = Booking.objects.filter(
        scheduled_time__range=(
            reminder_time - timedelta(minutes=5),
            reminder_time + timedelta(minutes=5)
        ),
        status='CONFIRMED'
    )
    
    for booking in bookings:
        notification_service.send_booking_reminder(booking)

@shared_task
def check_payment_expiry():
    """Check and update expired payments"""
    expiry_time = timezone.now() - timedelta(minutes=30)
    payments = Payment.objects.filter(
        created_at__lte=expiry_time,
        status='PENDING'
    )
    
    for payment in payments:
        payment.status = 'FAILED'
        payment.error = 'Payment expired'
        payment.save()

@shared_task
def check_analysis_timeout():
    """Check and update timed out analyses"""
    timeout = timezone.now() - timedelta(minutes=10)
    analyses = CropAnalysis.objects.filter(
        created_at__lte=timeout,
        status='PROCESSING'
    )
    
    for analysis in analyses:
        analysis.status = 'FAILED'
        analysis.error = 'Analysis timed out'
        analysis.save()

@shared_task
def send_payment_notification(payment_id):
    """Send payment notification"""
    try:
        payment = Payment.objects.get(id=payment_id)
        if payment.status == 'COMPLETED':
            notification_service.send_payment_completed(payment)
        elif payment.status == 'PENDING':
            notification_service.send_payment_initiated(payment)
    except Payment.DoesNotExist:
        pass

@shared_task
def send_booking_notification(booking_id):
    """Send booking notification"""
    try:
        booking = Booking.objects.get(id=booking_id)
        if booking.status == 'CONFIRMED':
            notification_service.send_booking_confirmation(booking)
    except Booking.DoesNotExist:
        pass

@shared_task
def send_analysis_notification(analysis_id):
    """Send analysis notification"""
    try:
        analysis = CropAnalysis.objects.get(id=analysis_id)
        if analysis.status == 'COMPLETED':
            notification_service.send_analysis_completed(analysis)
    except CropAnalysis.DoesNotExist:
        pass 