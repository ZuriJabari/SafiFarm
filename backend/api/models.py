from django.db import models
from django.utils import timezone
from django.contrib.auth.models import AbstractUser
from django.core.validators import RegexValidator
from django.core.exceptions import ValidationError

class User(AbstractUser):
    phone_regex = RegexValidator(
        regex=r'^\+?1?\d{9,15}$',
        message="Phone number must be entered in the format: '+256777777777'. Up to 15 digits allowed."
    )
    
    phone_number = models.CharField(validators=[phone_regex], max_length=17, blank=True)
    is_farmer = models.BooleanField(default=False)
    is_specialist = models.BooleanField(default=False)
    location = models.CharField(max_length=255, blank=True)
    bio = models.TextField(blank=True)
    profile_image = models.ImageField(upload_to='profile_images/', null=True, blank=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-date_joined']

    def __str__(self):
        return self.username

class Payment(models.Model):
    PROVIDER_CHOICES = [
        ('MTN', 'MTN Mobile Money'),
        ('AIRTEL', 'Airtel Money'),
    ]
    
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('PROCESSING', 'Processing'),
        ('COMPLETED', 'Completed'),
        ('FAILED', 'Failed'),
        ('CANCELLED', 'Cancelled'),
        ('EXPIRED', 'Expired'),
    ]
    
    id = models.UUIDField(primary_key=True, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='payments', null=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=3, default='UGX')
    provider = models.CharField(max_length=10, choices=PROVIDER_CHOICES)
    phone_number = models.CharField(max_length=15)
    description = models.TextField()
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='PENDING')
    transaction_id = models.CharField(max_length=100, blank=True, null=True)
    provider_reference = models.CharField(max_length=100, blank=True, null=True)
    provider_metadata = models.JSONField(default=dict, blank=True)
    error = models.TextField(blank=True, null=True)
    payment_date = models.DateTimeField(null=True, blank=True)
    expiry_date = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.provider} payment of {self.amount} {self.currency} - {self.status}"

    @property
    def is_completed(self):
        return self.status == 'COMPLETED'

    @property
    def is_failed(self):
        return self.status == 'FAILED'

    @property
    def is_pending(self):
        return self.status == 'PENDING'

    @property
    def is_processing(self):
        return self.status == 'PROCESSING'

    @property
    def is_cancelled(self):
        return self.status == 'CANCELLED'

    @property
    def is_expired(self):
        return self.status == 'EXPIRED'

    @property
    def can_retry(self):
        return self.status in ['FAILED', 'EXPIRED', 'CANCELLED']

class Disease(models.Model):
    name = models.CharField(max_length=100)
    scientific_name = models.CharField(max_length=100)
    description = models.TextField()
    symptoms = models.TextField()
    treatment = models.TextField()
    prevention = models.TextField()
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

class CropAnalysis(models.Model):
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('PROCESSING', 'Processing'),
        ('COMPLETED', 'Completed'),
        ('FAILED', 'Failed'),
    ]

    id = models.UUIDField(primary_key=True, editable=False)
    image_url = models.URLField()
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='PENDING')
    confidence_score = models.FloatField(null=True, blank=True)
    detected_disease = models.ForeignKey(Disease, on_delete=models.SET_NULL, null=True, blank=True)
    error = models.TextField(null=True, blank=True)
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='analyses', null=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name_plural = 'Crop analyses'

    def __str__(self):
        return f"Analysis {self.id} - {self.status}"

    @property
    def is_complete(self):
        return self.status == 'COMPLETED'

    @property
    def is_failed(self):
        return self.status == 'FAILED'

class Specialization(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField()
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

class SpecialistProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='specialist_profile')
    specializations = models.ManyToManyField(Specialization)
    hourly_rate = models.DecimalField(max_digits=10, decimal_places=2)
    availability = models.JSONField(default=dict)  # Store weekly availability
    years_of_experience = models.PositiveIntegerField()
    qualifications = models.TextField()
    is_verified = models.BooleanField(default=False)
    rating = models.FloatField(default=0.0)
    total_reviews = models.PositiveIntegerField(default=0)

    def __str__(self):
        return f"{self.user.get_full_name()} - {', '.join(s.name for s in self.specializations.all())}"

    def clean(self):
        if not self.user.is_specialist:
            raise ValidationError("User must be marked as a specialist")

class Booking(models.Model):
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('CONFIRMED', 'Confirmed'),
        ('IN_PROGRESS', 'In Progress'),
        ('COMPLETED', 'Completed'),
        ('CANCELLED', 'Cancelled'),
    ]

    CONSULTATION_TYPE_CHOICES = [
        ('VIDEO', 'Video Call'),
        ('VISIT', 'Farm Visit'),
    ]

    id = models.UUIDField(primary_key=True, editable=False)
    farmer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='farmer_bookings')
    specialist = models.ForeignKey(User, on_delete=models.CASCADE, related_name='specialist_bookings')
    consultation_type = models.CharField(max_length=10, choices=CONSULTATION_TYPE_CHOICES, default='VIDEO')
    scheduled_time = models.DateTimeField()
    duration = models.DurationField()  # in minutes
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment = models.OneToOneField(Payment, on_delete=models.SET_NULL, null=True, blank=True)
    notes = models.TextField(blank=True)
    meeting_link = models.URLField(blank=True)  # For virtual consultations
    video_room_sid = models.CharField(max_length=100, blank=True)  # Twilio room SID
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-scheduled_time']

    def __str__(self):
        return f"Booking {self.id} - {self.farmer.get_full_name()} with {self.specialist.get_full_name()}"

    def clean(self):
        if not self.specialist.is_specialist:
            raise ValidationError("Selected user is not a specialist")
        if self.farmer.is_specialist:
            raise ValidationError("Farmers cannot be specialists")

    @property
    def is_video_call(self):
        return self.consultation_type == 'VIDEO'

    @property
    def can_start_video(self):
        return (
            self.is_video_call and
            self.status == 'CONFIRMED' and
            timezone.now() >= self.scheduled_time and
            timezone.now() <= self.scheduled_time + self.duration
        )

class Review(models.Model):
    booking = models.OneToOneField(Booking, on_delete=models.CASCADE, related_name='review')
    rating = models.PositiveIntegerField()  # 1-5 stars
    comment = models.TextField()
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    def clean(self):
        if self.rating < 1 or self.rating > 5:
            raise ValidationError("Rating must be between 1 and 5")
        if self.booking.status != 'COMPLETED':
            raise ValidationError("Can only review completed bookings")

    def save(self, *args, **kwargs):
        # Update specialist's rating
        super().save(*args, **kwargs)
        specialist_profile = self.booking.specialist.specialist_profile
        total_reviews = specialist_profile.total_reviews + 1
        current_rating = specialist_profile.rating
        new_rating = ((current_rating * (total_reviews - 1)) + self.rating) / total_reviews
        specialist_profile.rating = new_rating
        specialist_profile.total_reviews = total_reviews
        specialist_profile.save()
