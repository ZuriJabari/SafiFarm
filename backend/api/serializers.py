from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import (
    Payment, Disease, CropAnalysis,
    Specialization, SpecialistProfile, Booking, Review
)
from django.utils import timezone

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = [
            'id',
            'username',
            'email',
            'password',
            'first_name',
            'last_name',
            'phone_number',
            'is_farmer',
            'is_specialist',
            'location',
            'bio',
            'profile_image',
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user

class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            'id',
            'username',
            'email',
            'first_name',
            'last_name',
            'phone_number',
            'is_farmer',
            'is_specialist',
            'location',
            'bio',
            'profile_image',
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['id', 'username', 'email', 'created_at', 'updated_at']

class PaymentSerializer(serializers.ModelSerializer):
    user = UserProfileSerializer(read_only=True)
    
    class Meta:
        model = Payment
        fields = [
            'id',
            'user',
            'amount',
            'currency',
            'provider',
            'phone_number',
            'description',
            'status',
            'transaction_id',
            'error',
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['id', 'user', 'status', 'transaction_id', 'error', 'created_at', 'updated_at']

class DiseaseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Disease
        fields = [
            'id',
            'name',
            'scientific_name',
            'description',
            'symptoms',
            'treatment',
            'prevention',
            'created_at',
            'updated_at'
        ]

class CropAnalysisSerializer(serializers.ModelSerializer):
    user = UserProfileSerializer(read_only=True)
    detected_disease = DiseaseSerializer(read_only=True)
    
    class Meta:
        model = CropAnalysis
        fields = [
            'id',
            'user',
            'image_url',
            'status',
            'confidence_score',
            'detected_disease',
            'error',
            'metadata',
            'created_at',
            'updated_at',
            'is_complete',
            'is_failed'
        ]
        read_only_fields = [
            'id',
            'user',
            'status',
            'confidence_score',
            'detected_disease',
            'error',
            'created_at',
            'updated_at',
            'is_complete',
            'is_failed'
        ]

class SpecializationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Specialization
        fields = ['id', 'name', 'description', 'created_at', 'updated_at']

class SpecialistProfileSerializer(serializers.ModelSerializer):
    specializations = SpecializationSerializer(many=True, read_only=True)
    user = UserProfileSerializer(read_only=True)
    
    class Meta:
        model = SpecialistProfile
        fields = [
            'id',
            'user',
            'specializations',
            'hourly_rate',
            'availability',
            'years_of_experience',
            'qualifications',
            'is_verified',
            'rating',
            'total_reviews'
        ]
        read_only_fields = ['is_verified', 'rating', 'total_reviews']

class BookingSerializer(serializers.ModelSerializer):
    farmer = UserProfileSerializer(read_only=True)
    specialist = UserProfileSerializer(read_only=True)
    payment = PaymentSerializer(read_only=True)
    total_amount = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    can_start_video = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = Booking
        fields = [
            'id',
            'farmer',
            'specialist',
            'consultation_type',
            'scheduled_time',
            'duration',
            'status',
            'total_amount',
            'payment',
            'notes',
            'meeting_link',
            'video_room_sid',
            'created_at',
            'updated_at',
            'can_start_video'
        ]
        read_only_fields = [
            'id',
            'status',
            'payment',
            'meeting_link',
            'video_room_sid',
            'created_at',
            'updated_at',
            'can_start_video'
        ]

    def validate(self, data):
        specialist = self.context['request'].data.get('specialist_id')
        if not specialist:
            raise serializers.ValidationError("Specialist ID is required")
        
        try:
            specialist_user = User.objects.get(id=specialist)
            if not specialist_user.is_specialist:
                raise serializers.ValidationError("Selected user is not a specialist")
            
            # Check if the specialist has a profile
            if not hasattr(specialist_user, 'specialist_profile'):
                raise serializers.ValidationError("Specialist profile not found")
            
            # Calculate total amount based on specialist's hourly rate and duration
            hourly_rate = specialist_user.specialist_profile.hourly_rate
            duration_hours = data['duration'].total_seconds() / 3600
            data['total_amount'] = hourly_rate * duration_hours
            
            # Validate scheduled time
            if data['scheduled_time'] <= timezone.now():
                raise serializers.ValidationError("Scheduled time must be in the future")
            
        except User.DoesNotExist:
            raise serializers.ValidationError("Specialist not found")
        
        return data

class ReviewSerializer(serializers.ModelSerializer):
    booking = BookingSerializer(read_only=True)
    
    class Meta:
        model = Review
        fields = [
            'id',
            'booking',
            'rating',
            'comment',
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate(self, data):
        booking_id = self.context['request'].data.get('booking_id')
        if not booking_id:
            raise serializers.ValidationError("Booking ID is required")
        
        try:
            booking = Booking.objects.get(id=booking_id)
            if booking.status != 'COMPLETED':
                raise serializers.ValidationError("Can only review completed bookings")
            if hasattr(booking, 'review'):
                raise serializers.ValidationError("Booking has already been reviewed")
            if booking.farmer != self.context['request'].user:
                raise serializers.ValidationError("You can only review your own bookings")
        except Booking.DoesNotExist:
            raise serializers.ValidationError("Booking not found")
        
        return data 