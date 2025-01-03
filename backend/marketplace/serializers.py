from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Equipment, Rental, Specialist, Consultation, Review

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'email']

class EquipmentSerializer(serializers.ModelSerializer):
    owner = UserSerializer(read_only=True)
    owner_id = serializers.UUIDField(write_only=True)
    
    class Meta:
        model = Equipment
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']

class RentalSerializer(serializers.ModelSerializer):
    equipment = EquipmentSerializer(read_only=True)
    equipment_id = serializers.UUIDField(write_only=True)
    renter = UserSerializer(read_only=True)
    
    class Meta:
        model = Rental
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at', 'total_amount']
    
    def validate(self, data):
        """Validate rental dates and equipment availability."""
        if data['start_date'] >= data['end_date']:
            raise serializers.ValidationError("End date must be after start date")
        
        # Check if equipment is available for the requested dates
        equipment = Equipment.objects.get(id=data['equipment_id'])
        overlapping_rentals = Rental.objects.filter(
            equipment=equipment,
            status__in=['pending', 'confirmed', 'in_progress'],
            start_date__lt=data['end_date'],
            end_date__gt=data['start_date']
        )
        
        if overlapping_rentals.exists():
            raise serializers.ValidationError("Equipment is not available for these dates")
        
        return data
    
    def create(self, validated_data):
        """Calculate total amount based on daily rate and duration."""
        equipment = Equipment.objects.get(id=validated_data['equipment_id'])
        duration = (validated_data['end_date'] - validated_data['start_date']).days
        validated_data['total_amount'] = equipment.daily_rate * duration
        return super().create(validated_data)

class SpecialistSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    user_id = serializers.UUIDField(write_only=True)
    
    class Meta:
        model = Specialist
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at', 'rating', 'total_reviews']

class ConsultationSerializer(serializers.ModelSerializer):
    specialist = SpecialistSerializer(read_only=True)
    specialist_id = serializers.UUIDField(write_only=True)
    farmer = UserSerializer(read_only=True)
    
    class Meta:
        model = Consultation
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at', 'total_amount']
    
    def validate(self, data):
        """Validate consultation time and specialist availability."""
        if not data['duration_minutes'] or data['duration_minutes'] <= 0:
            raise serializers.ValidationError("Duration must be greater than 0")
        
        specialist = Specialist.objects.get(id=data['specialist_id'])
        
        # Check specialist availability
        overlapping_consultations = Consultation.objects.filter(
            specialist=specialist,
            status__in=['pending', 'confirmed', 'in_progress'],
            scheduled_time__lt=data['scheduled_time'] + \
                             timedelta(minutes=data['duration_minutes']),
            scheduled_time__gt=data['scheduled_time']
        )
        
        if overlapping_consultations.exists():
            raise serializers.ValidationError("Specialist is not available at this time")
        
        return data
    
    def create(self, validated_data):
        """Calculate total amount based on hourly rate and duration."""
        specialist = Specialist.objects.get(id=validated_data['specialist_id'])
        duration_hours = validated_data['duration_minutes'] / 60
        validated_data['total_amount'] = specialist.hourly_rate * duration_hours
        return super().create(validated_data)

class ReviewSerializer(serializers.ModelSerializer):
    reviewer = UserSerializer(read_only=True)
    
    class Meta:
        model = Review
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']
    
    def validate(self, data):
        """Ensure the user can only review completed rentals/consultations."""
        content_type = data['content_type']
        object_id = data['object_id']
        
        if content_type.model == 'rental':
            rental = Rental.objects.get(id=object_id)
            if rental.status != 'completed':
                raise serializers.ValidationError(
                    "Can only review completed rentals"
                )
        elif content_type.model == 'consultation':
            consultation = Consultation.objects.get(id=object_id)
            if consultation.status != 'completed':
                raise serializers.ValidationError(
                    "Can only review completed consultations"
                )
        
        return data
