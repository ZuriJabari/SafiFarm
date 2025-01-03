from django.utils import timezone
from datetime import timedelta
from django.core.mail import send_mail
from django.conf import settings
from django.template.loader import render_to_string
from .models import Equipment, Rental, Specialist, Consultation

def send_rental_notification(rental, template_name, subject):
    """Send email notification for rental status changes."""
    context = {
        'rental': rental,
        'equipment': rental.equipment,
        'renter': rental.renter,
        'owner': rental.equipment.owner
    }
    
    message = render_to_string(f'marketplace/emails/{template_name}.html', context)
    
    send_mail(
        subject=subject,
        message=message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[rental.renter.email, rental.equipment.owner.email],
        html_message=message
    )

def send_consultation_notification(consultation, template_name, subject):
    """Send email notification for consultation status changes."""
    context = {
        'consultation': consultation,
        'specialist': consultation.specialist,
        'farmer': consultation.farmer
    }
    
    message = render_to_string(f'marketplace/emails/{template_name}.html', context)
    
    send_mail(
        subject=subject,
        message=message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[consultation.farmer.email, consultation.specialist.user.email],
        html_message=message
    )

def check_equipment_availability(equipment, start_date, end_date):
    """Check if equipment is available for the given date range."""
    overlapping_rentals = Rental.objects.filter(
        equipment=equipment,
        status__in=['confirmed', 'in_progress'],
        start_date__lt=end_date,
        end_date__gt=start_date
    )
    return not overlapping_rentals.exists()

def check_specialist_availability(specialist, scheduled_time, duration_minutes):
    """Check if specialist is available for the given time slot."""
    end_time = scheduled_time + timedelta(minutes=duration_minutes)
    overlapping_consultations = Consultation.objects.filter(
        specialist=specialist,
        status__in=['confirmed', 'in_progress'],
        scheduled_time__lt=end_time,
        scheduled_time__gt=scheduled_time
    )
    return not overlapping_consultations.exists()

def calculate_rental_price(equipment, start_date, end_date):
    """Calculate total rental price including any applicable discounts."""
    days = (end_date - start_date).days
    base_price = equipment.daily_rate * days
    
    # Apply discount for longer rentals
    if days >= 7:
        base_price *= 0.9  # 10% discount for weekly rentals
    elif days >= 30:
        base_price *= 0.8  # 20% discount for monthly rentals
    
    return base_price

def calculate_consultation_price(specialist, duration_minutes):
    """Calculate consultation price including any applicable discounts."""
    duration_hours = duration_minutes / 60
    base_price = specialist.hourly_rate * duration_hours
    
    # Apply discount for longer consultations
    if duration_minutes >= 120:
        base_price *= 0.9  # 10% discount for consultations 2+ hours
    
    return base_price

def get_upcoming_rentals(user):
    """Get user's upcoming rentals (both as renter and owner)."""
    return Rental.objects.filter(
        (Q(renter=user) | Q(equipment__owner=user)) &
        Q(status__in=['confirmed', 'in_progress']) &
        Q(end_date__gte=timezone.now())
    ).select_related('equipment', 'renter')

def get_upcoming_consultations(user):
    """Get user's upcoming consultations (both as farmer and specialist)."""
    return Consultation.objects.filter(
        (Q(farmer=user) | Q(specialist__user=user)) &
        Q(status__in=['confirmed', 'in_progress']) &
        Q(scheduled_time__gte=timezone.now())
    ).select_related('specialist', 'farmer')
