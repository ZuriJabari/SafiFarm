from django.core.mail import send_mail
from django.conf import settings
from django.template.loader import render_to_string
import africastalking
import logging
from datetime import timedelta

logger = logging.getLogger(__name__)

class NotificationService:
    def __init__(self):
        # Initialize Africa's Talking SMS
        self.sms = None
        if settings.AFRICASTALKING_API_KEY:
            africastalking.initialize(
                settings.AFRICASTALKING_USERNAME,
                settings.AFRICASTALKING_API_KEY
            )
            self.sms = africastalking.SMS

    def _send_email(self, to_email, subject, template_name, context):
        """Send an email using a template"""
        try:
            html_message = render_to_string(f'emails/{template_name}.html', context)
            text_message = render_to_string(f'emails/{template_name}.txt', context)

            send_mail(
                subject=subject,
                message=text_message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[to_email],
                html_message=html_message
            )
            logger.info(f"Email sent to {to_email}: {subject}")
            
        except Exception as e:
            logger.error(f"Error sending email to {to_email}: {str(e)}")
            raise

    def _send_sms(self, phone_number, message):
        """Send an SMS using Africa's Talking"""
        try:
            if not self.sms:
                logger.warning("SMS service not configured")
                return

            response = self.sms.send(message, [phone_number])
            logger.info(f"SMS sent to {phone_number}: {response}")
            
        except Exception as e:
            logger.error(f"Error sending SMS to {phone_number}: {str(e)}")
            raise

    def send_payment_initiated(self, payment):
        """Send notification when payment is initiated"""
        user = payment.user
        context = {
            'user_name': user.get_full_name() or user.username,
            'amount': payment.amount,
            'currency': payment.currency,
            'provider': payment.provider,
            'transaction_id': payment.transaction_id
        }

        # Send email
        self._send_email(
            user.email,
            'Payment Initiated - SafiFarm',
            'payment_initiated',
            context
        )

        # Send SMS
        message = (
            f"Payment of {payment.currency} {payment.amount} initiated with {payment.provider}. "
            f"Please check your phone for the payment prompt."
        )
        self._send_sms(payment.phone_number, message)

    def send_payment_completed(self, payment):
        """Send notification when payment is completed"""
        user = payment.user
        context = {
            'user_name': user.get_full_name() or user.username,
            'amount': payment.amount,
            'currency': payment.currency,
            'provider': payment.provider,
            'transaction_id': payment.transaction_id
        }

        # Send email
        self._send_email(
            user.email,
            'Payment Successful - SafiFarm',
            'payment_completed',
            context
        )

        # Send SMS
        message = (
            f"Payment of {payment.currency} {payment.amount} completed successfully. "
            f"Transaction ID: {payment.transaction_id}"
        )
        self._send_sms(payment.phone_number, message)

    def send_booking_confirmation(self, booking):
        """Send notification when booking is confirmed"""
        # Notify farmer
        farmer_context = {
            'user_name': booking.farmer.get_full_name() or booking.farmer.username,
            'specialist_name': booking.specialist.get_full_name(),
            'scheduled_time': booking.scheduled_time,
            'duration': booking.duration,
            'consultation_type': booking.get_consultation_type_display(),
            'meeting_link': booking.meeting_link if booking.is_video_call else None
        }

        self._send_email(
            booking.farmer.email,
            'Booking Confirmed - SafiFarm',
            'booking_confirmed_farmer',
            farmer_context
        )

        farmer_message = (
            f"Your booking with {booking.specialist.get_full_name()} is confirmed for "
            f"{booking.scheduled_time.strftime('%Y-%m-%d %H:%M')}. "
            f"Duration: {int(booking.duration.total_seconds() / 60)} minutes."
        )
        self._send_sms(booking.farmer.phone_number, farmer_message)

        # Notify specialist
        specialist_context = {
            'user_name': booking.specialist.get_full_name() or booking.specialist.username,
            'farmer_name': booking.farmer.get_full_name(),
            'scheduled_time': booking.scheduled_time,
            'duration': booking.duration,
            'consultation_type': booking.get_consultation_type_display(),
            'meeting_link': booking.meeting_link if booking.is_video_call else None
        }

        self._send_email(
            booking.specialist.email,
            'New Booking Confirmed - SafiFarm',
            'booking_confirmed_specialist',
            specialist_context
        )

        specialist_message = (
            f"New booking confirmed with {booking.farmer.get_full_name()} for "
            f"{booking.scheduled_time.strftime('%Y-%m-%d %H:%M')}. "
            f"Duration: {int(booking.duration.total_seconds() / 60)} minutes."
        )
        self._send_sms(booking.specialist.phone_number, specialist_message)

    def send_booking_reminder(self, booking):
        """Send reminder 1 hour before booking"""
        # Notify farmer
        farmer_message = (
            f"Reminder: Your consultation with {booking.specialist.get_full_name()} "
            f"starts in 1 hour at {booking.scheduled_time.strftime('%H:%M')}. "
        )
        if booking.is_video_call:
            farmer_message += f"Join here: {booking.meeting_link}"

        self._send_sms(booking.farmer.phone_number, farmer_message)

        # Notify specialist
        specialist_message = (
            f"Reminder: Your consultation with {booking.farmer.get_full_name()} "
            f"starts in 1 hour at {booking.scheduled_time.strftime('%H:%M')}. "
        )
        if booking.is_video_call:
            specialist_message += f"Join here: {booking.meeting_link}"

        self._send_sms(booking.specialist.phone_number, specialist_message)

    def send_analysis_completed(self, analysis):
        """Send notification when crop analysis is completed"""
        user = analysis.user
        context = {
            'user_name': user.get_full_name() or user.username,
            'disease_name': analysis.detected_disease.name if analysis.detected_disease else None,
            'confidence_score': f"{analysis.confidence_score * 100:.1f}%" if analysis.confidence_score else None,
            'analysis_url': f"{settings.FRONTEND_URL}/analysis/{analysis.id}"
        }

        # Send email
        self._send_email(
            user.email,
            'Crop Analysis Results - SafiFarm',
            'analysis_completed',
            context
        )

        # Send SMS
        message = (
            f"Your crop analysis is complete. "
            f"Disease detected: {analysis.detected_disease.name if analysis.detected_disease else 'None'}. "
            f"View details at {settings.FRONTEND_URL}/analysis/{analysis.id}"
        )
        self._send_sms(user.phone_number, message) 