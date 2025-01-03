from django.shortcuts import render
from rest_framework import viewsets, permissions, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError
from django.db.models import Q, Avg
from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from datetime import timedelta
from .models import Equipment, Rental, Specialist, Consultation, Review
from .serializers import (
    EquipmentSerializer, RentalSerializer, SpecialistSerializer,
    ConsultationSerializer, ReviewSerializer
)
from .filters import EquipmentFilter, SpecialistFilter

class EquipmentViewSet(viewsets.ModelViewSet):
    """ViewSet for viewing and editing equipment listings."""
    queryset = Equipment.objects.all()
    serializer_class = EquipmentSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = EquipmentFilter
    search_fields = ['name', 'description', 'location']
    ordering_fields = ['daily_rate', 'created_at', 'rating']
    
    def get_queryset(self):
        queryset = super().get_queryset().annotate(
            rating=Avg('reviews__rating')
        )
        return queryset
    
    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)
    
    @action(detail=True, methods=['post'])
    def toggle_availability(self, request, pk=None):
        equipment = self.get_object()
        if equipment.owner != request.user and not request.user.is_staff:
            return Response(
                {"detail": "Not authorized"}, 
                status=status.HTTP_403_FORBIDDEN
            )
        equipment.is_available = not equipment.is_available
        equipment.save()
        return Response({'status': 'success'})
    
    @action(detail=True, methods=['get'])
    def availability_calendar(self, request, pk=None):
        """Get equipment availability calendar for next 30 days."""
        equipment = self.get_object()
        start_date = timezone.now().date()
        end_date = start_date + timedelta(days=30)
        
        bookings = equipment.rentals.filter(
            status__in=['confirmed', 'in_progress'],
            start_date__date__lte=end_date,
            end_date__date__gte=start_date
        ).values('start_date', 'end_date')
        
        return Response({
            'equipment_id': equipment.id,
            'bookings': bookings
        })

class RentalViewSet(viewsets.ModelViewSet):
    """ViewSet for viewing and editing equipment rentals."""
    queryset = Rental.objects.all()
    serializer_class = RentalSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['status', 'payment_status']
    ordering_fields = ['start_date', 'created_at']
    
    def get_queryset(self):
        user = self.request.user
        if user.is_staff:
            return super().get_queryset()
        return Rental.objects.filter(
            Q(renter=user) | Q(equipment__owner=user)
        )
    
    def perform_create(self, serializer):
        serializer.save(renter=self.request.user)
    
    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        rental = self.get_object()
        if rental.renter != request.user and rental.equipment.owner != request.user:
            return Response(
                {"detail": "Not authorized"}, 
                status=status.HTTP_403_FORBIDDEN
            )
        if rental.status not in ['pending', 'confirmed']:
            raise ValidationError("Cannot cancel rental at this stage")
        rental.status = 'cancelled'
        rental.save()
        return Response({'status': 'success'})
    
    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        rental = self.get_object()
        if rental.equipment.owner != request.user:
            return Response(
                {"detail": "Not authorized"}, 
                status=status.HTTP_403_FORBIDDEN
            )
        if rental.status != 'in_progress':
            raise ValidationError("Can only complete rentals that are in progress")
        rental.status = 'completed'
        rental.save()
        return Response({'status': 'success'})

class SpecialistViewSet(viewsets.ModelViewSet):
    """ViewSet for viewing and editing specialist profiles."""
    queryset = Specialist.objects.all()
    serializer_class = SpecialistSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = SpecialistFilter
    search_fields = ['user__first_name', 'user__last_name', 'bio', 'location']
    ordering_fields = ['rating', 'experience_years', 'hourly_rate']
    
    def get_queryset(self):
        queryset = super().get_queryset().annotate(
            rating=Avg('reviews__rating')
        )
        return queryset
    
    def perform_create(self, serializer):
        if Specialist.objects.filter(user=self.request.user).exists():
            raise ValidationError("User already has a specialist profile")
        serializer.save(user=self.request.user)
    
    @action(detail=True, methods=['get'])
    def availability_calendar(self, request, pk=None):
        """Get specialist availability calendar for next 7 days."""
        specialist = self.get_object()
        start_date = timezone.now()
        end_date = start_date + timedelta(days=7)
        
        bookings = specialist.consultations.filter(
            status__in=['confirmed', 'in_progress'],
            scheduled_time__lte=end_date,
            scheduled_time__gte=start_date
        ).values('scheduled_time', 'duration_minutes')
        
        return Response({
            'specialist_id': specialist.id,
            'bookings': bookings
        })

class ConsultationViewSet(viewsets.ModelViewSet):
    """ViewSet for viewing and editing specialist consultations."""
    queryset = Consultation.objects.all()
    serializer_class = ConsultationSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['status', 'payment_status', 'consultation_type']
    ordering_fields = ['scheduled_time', 'created_at']
    
    def get_queryset(self):
        user = self.request.user
        if user.is_staff:
            return super().get_queryset()
        return Consultation.objects.filter(
            Q(farmer=user) | Q(specialist__user=user)
        )
    
    def perform_create(self, serializer):
        serializer.save(farmer=self.request.user)
    
    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        consultation = self.get_object()
        if consultation.farmer != request.user and consultation.specialist.user != request.user:
            return Response(
                {"detail": "Not authorized"}, 
                status=status.HTTP_403_FORBIDDEN
            )
        if consultation.status not in ['pending', 'confirmed']:
            raise ValidationError("Cannot cancel consultation at this stage")
        if consultation.scheduled_time <= timezone.now():
            raise ValidationError("Cannot cancel past consultations")
        consultation.status = 'cancelled'
        consultation.save()
        return Response({'status': 'success'})

class ReviewViewSet(viewsets.ModelViewSet):
    """ViewSet for viewing and editing reviews."""
    queryset = Review.objects.all()
    serializer_class = ReviewSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['content_type', 'rating']
    ordering_fields = ['rating', 'created_at']
    
    def get_queryset(self):
        return Review.objects.filter(
            Q(reviewer=self.request.user) |
            Q(content_type__model='rental', object_id__in=Rental.objects.filter(
                Q(renter=self.request.user) |
                Q(equipment__owner=self.request.user)
            ).values_list('id', flat=True)) |
            Q(content_type__model='consultation', object_id__in=Consultation.objects.filter(
                Q(farmer=self.request.user) |
                Q(specialist__user=self.request.user)
            ).values_list('id', flat=True))
        )
    
    def perform_create(self, serializer):
        serializer.save(reviewer=self.request.user)
