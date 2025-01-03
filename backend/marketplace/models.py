from django.db import models
from django.contrib.auth import get_user_model
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils.translation import gettext_lazy as _
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
import uuid

User = get_user_model()

class Equipment(models.Model):
    """Model for farm equipment and machinery listings."""
    
    class EquipmentType(models.TextChoices):
        TRACTOR = 'tractor', _('Tractor')
        HARVESTER = 'harvester', _('Harvester')
        PLANTER = 'planter', _('Planter')
        IRRIGATION = 'irrigation', _('Irrigation System')
        SPRAYER = 'sprayer', _('Sprayer')
        OTHER = 'other', _('Other')
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='equipment')
    name = models.CharField(max_length=255)
    equipment_type = models.CharField(max_length=20, choices=EquipmentType.choices)
    description = models.TextField()
    daily_rate = models.DecimalField(max_digits=10, decimal_places=2)
    location = models.CharField(max_length=255)
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    is_available = models.BooleanField(default=True)
    specifications = models.JSONField(default=dict)  # Store technical specs
    images = models.JSONField(default=list)  # Store image URLs
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['equipment_type']),
            models.Index(fields=['location']),
            models.Index(fields=['is_available']),
        ]
    
    def __str__(self):
        return f"{self.name} ({self.get_equipment_type_display()})"

class Rental(models.Model):
    """Model for equipment rental bookings."""
    
    class Status(models.TextChoices):
        PENDING = 'pending', _('Pending')
        CONFIRMED = 'confirmed', _('Confirmed')
        IN_PROGRESS = 'in_progress', _('In Progress')
        COMPLETED = 'completed', _('Completed')
        CANCELLED = 'cancelled', _('Cancelled')
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    equipment = models.ForeignKey(Equipment, on_delete=models.PROTECT, related_name='rentals')
    renter = models.ForeignKey(User, on_delete=models.PROTECT, related_name='rentals')
    start_date = models.DateTimeField()
    end_date = models.DateTimeField()
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_status = models.CharField(max_length=20, choices=[
        ('pending', _('Pending')),
        ('paid', _('Paid')),
        ('refunded', _('Refunded')),
    ], default='pending')
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['payment_status']),
            models.Index(fields=['start_date']),
        ]
    
    def __str__(self):
        return f"Rental of {self.equipment.name} by {self.renter.username}"

class Specialist(models.Model):
    """Model for agricultural specialists."""
    
    class SpecialistType(models.TextChoices):
        AGRONOMIST = 'agronomist', _('Agronomist')
        VETERINARIAN = 'veterinarian', _('Veterinarian')
        SOIL_EXPERT = 'soil_expert', _('Soil Expert')
        PEST_CONTROL = 'pest_control', _('Pest Control Expert')
        MACHINERY_EXPERT = 'machinery_expert', _('Machinery Expert')
        OTHER = 'other', _('Other')
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='marketplace_specialist')
    specialist_type = models.CharField(max_length=20, choices=SpecialistType.choices)
    bio = models.TextField()
    qualifications = models.JSONField()  # Store education and certifications
    experience_years = models.PositiveIntegerField()
    hourly_rate = models.DecimalField(max_digits=10, decimal_places=2)
    available_hours = models.JSONField()  # Store weekly availability
    rating = models.DecimalField(max_digits=3, decimal_places=2, default=0.0)
    total_reviews = models.PositiveIntegerField(default=0)
    is_verified = models.BooleanField(default=False)
    languages = models.JSONField(default=list)
    location = models.CharField(max_length=255)
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-rating', '-total_reviews']
        indexes = [
            models.Index(fields=['specialist_type']),
            models.Index(fields=['location']),
            models.Index(fields=['is_verified']),
        ]
    
    def __str__(self):
        return f"{self.user.get_full_name()} ({self.get_specialist_type_display()})"

class Consultation(models.Model):
    """Model for specialist consultations."""
    
    class Status(models.TextChoices):
        PENDING = 'pending', _('Pending')
        CONFIRMED = 'confirmed', _('Confirmed')
        IN_PROGRESS = 'in_progress', _('In Progress')
        COMPLETED = 'completed', _('Completed')
        CANCELLED = 'cancelled', _('Cancelled')
    
    class ConsultationType(models.TextChoices):
        IN_PERSON = 'in_person', _('In Person')
        VIDEO_CALL = 'video_call', _('Video Call')
        VOICE_CALL = 'voice_call', _('Voice Call')
        CHAT = 'chat', _('Chat')
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    specialist = models.ForeignKey(Specialist, on_delete=models.PROTECT, related_name='consultations')
    farmer = models.ForeignKey(User, on_delete=models.PROTECT, related_name='consultations')
    consultation_type = models.CharField(max_length=20, choices=ConsultationType.choices)
    scheduled_time = models.DateTimeField()
    duration_minutes = models.PositiveIntegerField()
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_status = models.CharField(max_length=20, choices=[
        ('pending', _('Pending')),
        ('paid', _('Paid')),
        ('refunded', _('Refunded')),
    ], default='pending')
    problem_description = models.TextField()
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-scheduled_time']
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['payment_status']),
            models.Index(fields=['scheduled_time']),
        ]
    
    def __str__(self):
        return f"Consultation with {self.specialist.user.get_full_name()} by {self.farmer.username}"

class Review(models.Model):
    """Model for reviews of equipment rentals and specialist consultations."""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    reviewer = models.ForeignKey(User, on_delete=models.PROTECT, related_name='reviews')
    rating = models.PositiveIntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    comment = models.TextField()
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.UUIDField()
    content_object = GenericForeignKey('content_type', 'object_id')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['content_type', 'object_id']),
            models.Index(fields=['rating']),
        ]
    
    def __str__(self):
        return f"Review by {self.reviewer.username} - {self.rating} stars"
