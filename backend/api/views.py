from django.shortcuts import render
import uuid
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.core.files.storage import default_storage
from django.contrib.auth import get_user_model
from django.conf import settings
import os
from datetime import datetime, timedelta
from .models import (
    Payment, Disease, CropAnalysis,
    Specialization, SpecialistProfile, Booking, Review
)
from .serializers import (
    PaymentSerializer, DiseaseSerializer, CropAnalysisSerializer,
    UserSerializer, UserProfileSerializer, SpecializationSerializer,
    SpecialistProfileSerializer, BookingSerializer, ReviewSerializer
)
from .services.video_service import VideoService
from .services.payment_service import PaymentService

User = get_user_model()

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [AllowAny]  # Allow registration without authentication

    def get_permissions(self):
        if self.action == 'create':
            return [AllowAny()]
        return [IsAuthenticated()]

    def get_serializer_class(self):
        if self.action in ['update', 'partial_update', 'retrieve']:
            return UserProfileSerializer
        return UserSerializer

    @action(detail=False, methods=['get'])
    def me(self, request):
        serializer = UserProfileSerializer(request.user)
        return Response(serializer.data)

    @action(detail=False, methods=['put'])
    def update_profile(self, request):
        user = request.user
        serializer = UserProfileSerializer(user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class PaymentViewSet(viewsets.ModelViewSet):
    queryset = Payment.objects.all()
    serializer_class = PaymentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Payment.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        payment_id = uuid.uuid4()
        serializer.save(id=payment_id, user=self.request.user)

    @action(detail=True, methods=['post'])
    def process(self, request, pk=None):
        payment = self.get_object()
        
        # Initialize payment service based on provider
        payment_service = PaymentService(provider=payment.provider)
        
        try:
            # Validate phone number
            if not payment_service.validate_phone_number(payment.phone_number):
                return Response(
                    {
                        'status': 'error',
                        'message': f'Invalid phone number for {payment.provider}'
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Initiate payment with provider
            result = payment_service.initiate_payment(payment)
            
            # Update payment record
            payment.transaction_id = result['provider_reference']
            payment.save()
            
            return Response({
                'status': 'success',
                'message': 'Payment initiated successfully',
                'transaction_id': payment.transaction_id
            })
            
        except Exception as e:
            payment.status = 'FAILED'
            payment.error = str(e)
            payment.save()
            
            return Response(
                {'status': 'error', 'message': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=True, methods=['get'])
    def status_check(self, request, pk=None):
        payment = self.get_object()
        
        if not payment.transaction_id:
            return Response(
                {'error': 'Payment has not been initiated'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Check payment status with provider
            payment_service = PaymentService(provider=payment.provider)
            result = payment_service.check_payment_status(payment)
            
            # Update payment status
            payment.status = result['status']
            if result.get('provider_reference'):
                payment.transaction_id = result['provider_reference']
            payment.save()
            
            # If payment is completed and associated with a booking, update booking
            if payment.status == 'COMPLETED' and hasattr(payment, 'booking'):
                booking = payment.booking
                if booking.status == 'PENDING':
                    booking.status = 'CONFIRMED'
                    booking.save()
            
            serializer = self.get_serializer(payment)
            return Response(serializer.data)
            
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['post'])
    def validate_phone(self, request):
        phone_number = request.data.get('phone_number')
        provider = request.data.get('provider')
        
        if not phone_number or not provider:
            return Response(
                {'error': 'Phone number and provider are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        payment_service = PaymentService(provider=provider)
        is_valid = payment_service.validate_phone_number(phone_number)
        
        return Response({'is_valid': is_valid})

class DiseaseViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Disease.objects.all()
    serializer_class = DiseaseSerializer
    permission_classes = [IsAuthenticated]

class CropAnalysisViewSet(viewsets.ModelViewSet):
    queryset = CropAnalysis.objects.all()
    serializer_class = CropAnalysisSerializer
    parser_classes = (MultiPartParser, FormParser)
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return CropAnalysis.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        analysis_id = uuid.uuid4()
        serializer.save(id=analysis_id, user=self.request.user)

    @action(detail=False, methods=['post'])
    def analyze_image(self, request):
        if 'image' not in request.FILES:
            return Response(
                {'error': 'No image file provided'},
                status=status.HTTP_400_BAD_REQUEST
            )

        image_file = request.FILES['image']
        file_extension = os.path.splitext(image_file.name)[1]
        file_name = f"{uuid.uuid4()}{file_extension}"
        file_path = default_storage.save(f"crop_images/{file_name}", image_file)
        image_url = default_storage.url(file_path)

        # Create analysis record
        analysis = CropAnalysis.objects.create(
            id=uuid.uuid4(),
            image_url=image_url,
            status='PROCESSING',
            user=request.user
        )

        try:
            # Here we'll integrate with the AI model for disease detection
            # For now, we'll simulate the analysis
            # In production, this would call a machine learning service
            
            # Simulate processing
            analysis.status = 'COMPLETED'
            analysis.confidence_score = 0.95
            
            # Get or create a sample disease
            disease, _ = Disease.objects.get_or_create(
                name='Sample Disease',
                defaults={
                    'scientific_name': 'Exampleus Diseaseus',
                    'description': 'A sample disease for testing',
                    'symptoms': 'Sample symptoms',
                    'treatment': 'Sample treatment',
                    'prevention': 'Sample prevention measures'
                }
            )
            analysis.detected_disease = disease
            analysis.save()

            serializer = self.get_serializer(analysis)
            return Response(serializer.data)

        except Exception as e:
            analysis.status = 'FAILED'
            analysis.error = str(e)
            analysis.save()
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['get'])
    def status_check(self, request, pk=None):
        analysis = self.get_object()
        serializer = self.get_serializer(analysis)
        return Response(serializer.data)

class SpecializationViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Specialization.objects.all()
    serializer_class = SpecializationSerializer
    permission_classes = [IsAuthenticated]

class SpecialistProfileViewSet(viewsets.ModelViewSet):
    serializer_class = SpecialistProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if self.action == 'list':
            return SpecialistProfile.objects.filter(is_verified=True)
        return SpecialistProfile.objects.all()

    def perform_create(self, serializer):
        user = self.request.user
        if not user.is_specialist:
            user.is_specialist = True
            user.save()
        serializer.save(user=user)

    @action(detail=False, methods=['get'])
    def my_profile(self, request):
        try:
            profile = SpecialistProfile.objects.get(user=request.user)
            serializer = self.get_serializer(profile)
            return Response(serializer.data)
        except SpecialistProfile.DoesNotExist:
            return Response(
                {"error": "Specialist profile not found"},
                status=status.HTTP_404_NOT_FOUND
            )

    @action(detail=True, methods=['get'])
    def availability(self, request, pk=None):
        profile = self.get_object()
        return Response(profile.availability)

    @action(detail=True, methods=['post'])
    def update_availability(self, request, pk=None):
        profile = self.get_object()
        if profile.user != request.user:
            return Response(
                {"error": "You can only update your own availability"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        profile.availability = request.data
        profile.save()
        return Response(profile.availability)

class BookingViewSet(viewsets.ModelViewSet):
    serializer_class = BookingSerializer
    permission_classes = [IsAuthenticated]
    video_service = VideoService()

    def get_queryset(self):
        user = self.request.user
        if user.is_specialist:
            return Booking.objects.filter(specialist=user)
        return Booking.objects.filter(farmer=user)

    def perform_create(self, serializer):
        specialist_id = self.request.data.get('specialist_id')
        specialist = User.objects.get(id=specialist_id)
        
        booking_id = uuid.uuid4()
        serializer.save(
            id=booking_id,
            farmer=self.request.user,
            specialist=specialist
        )

    @action(detail=True, methods=['post'])
    def confirm(self, request, pk=None):
        booking = self.get_object()
        if booking.specialist != request.user:
            return Response(
                {"error": "Only the specialist can confirm bookings"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        if booking.status != 'PENDING':
            return Response(
                {"error": "Can only confirm pending bookings"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        booking.status = 'CONFIRMED'
        if booking.is_video_call:
            # Generate room name for video call
            room_name = self.video_service.get_room_name(booking.id)
            booking.meeting_link = f"https://meet.safifarm.com/{room_name}"
        booking.save()
        
        serializer = self.get_serializer(booking)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def start_video(self, request, pk=None):
        booking = self.get_object()
        
        # Check if user is part of the booking
        if request.user not in [booking.farmer, booking.specialist]:
            return Response(
                {"error": "You are not part of this booking"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Check if video call can be started
        if not booking.can_start_video:
            return Response(
                {"error": "Video call cannot be started at this time"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Generate room name and token
            room_name = self.video_service.get_room_name(booking.id)
            identity = str(request.user.id)
            token = self.video_service.generate_token(identity, room_name)
            
            # Update booking status if not already in progress
            if booking.status == 'CONFIRMED':
                booking.status = 'IN_PROGRESS'
                booking.save()
            
            return Response({
                'token': token,
                'room_name': room_name,
                'identity': identity
            })
            
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        booking = self.get_object()
        if booking.specialist != request.user:
            return Response(
                {"error": "Only the specialist can complete bookings"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        if booking.status not in ['CONFIRMED', 'IN_PROGRESS']:
            return Response(
                {"error": "Can only complete confirmed or in-progress bookings"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        booking.status = 'COMPLETED'
        booking.save()
        
        serializer = self.get_serializer(booking)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        booking = self.get_object()
        if booking.status not in ['PENDING', 'CONFIRMED']:
            return Response(
                {"error": "Can only cancel pending or confirmed bookings"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if user is either the farmer or specialist
        if request.user not in [booking.farmer, booking.specialist]:
            return Response(
                {"error": "You can only cancel your own bookings"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        booking.status = 'CANCELLED'
        booking.save()
        
        serializer = self.get_serializer(booking)
        return Response(serializer.data)

class ReviewViewSet(viewsets.ModelViewSet):
    serializer_class = ReviewSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Review.objects.filter(booking__farmer=self.request.user)

    def perform_create(self, serializer):
        booking_id = self.request.data.get('booking_id')
        booking = Booking.objects.get(id=booking_id)
        
        if booking.farmer != self.request.user:
            raise permissions.PermissionDenied("You can only review your own bookings")
        
        serializer.save(booking=booking)
