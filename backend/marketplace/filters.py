from django_filters import rest_framework as filters
from django.db.models import Q
from .models import Equipment, Specialist, Rental, Consultation

class EquipmentFilter(filters.FilterSet):
    min_price = filters.NumberFilter(field_name="daily_rate", lookup_expr='gte')
    max_price = filters.NumberFilter(field_name="daily_rate", lookup_expr='lte')
    location = filters.CharFilter(method='filter_location')
    available_between = filters.CharFilter(method='filter_available_dates')
    
    class Meta:
        model = Equipment
        fields = {
            'equipment_type': ['exact'],
            'is_available': ['exact'],
            'name': ['icontains'],
            'description': ['icontains'],
        }
    
    def filter_location(self, queryset, name, value):
        """Filter by location using radius search if coordinates provided."""
        if ',' in value:
            try:
                lat, lon = map(float, value.split(','))
                # Implement radius search using coordinates
                return queryset.filter(
                    latitude__isnull=False,
                    longitude__isnull=False
                ).extra(
                    where=[
                        """
                        6371 * acos(
                            cos(radians(%s)) * cos(radians(latitude)) *
                            cos(radians(longitude) - radians(%s)) +
                            sin(radians(%s)) * sin(radians(latitude))
                        ) <= 50
                        """
                    ],
                    params=[lat, lon, lat]
                )
            except ValueError:
                pass
        return queryset.filter(location__icontains=value)
    
    def filter_available_dates(self, queryset, name, value):
        """Filter equipment available between specific dates."""
        try:
            start_date, end_date = value.split(',')
            return queryset.exclude(
                rentals__status__in=['confirmed', 'in_progress'],
                rentals__start_date__lt=end_date,
                rentals__end_date__gt=start_date
            )
        except ValueError:
            return queryset

class SpecialistFilter(filters.FilterSet):
    min_rate = filters.NumberFilter(field_name="hourly_rate", lookup_expr='gte')
    max_rate = filters.NumberFilter(field_name="hourly_rate", lookup_expr='lte')
    min_experience = filters.NumberFilter(field_name="experience_years", lookup_expr='gte')
    available_on = filters.DateTimeFilter(method='filter_available_time')
    location = filters.CharFilter(method='filter_location')
    
    class Meta:
        model = Specialist
        fields = {
            'specialist_type': ['exact'],
            'is_verified': ['exact'],
            'rating': ['gte', 'lte'],
            'user__first_name': ['icontains'],
            'user__last_name': ['icontains'],
        }
    
    def filter_location(self, queryset, name, value):
        """Filter by location using radius search if coordinates provided."""
        if ',' in value:
            try:
                lat, lon = map(float, value.split(','))
                return queryset.filter(
                    latitude__isnull=False,
                    longitude__isnull=False
                ).extra(
                    where=[
                        """
                        6371 * acos(
                            cos(radians(%s)) * cos(radians(latitude)) *
                            cos(radians(longitude) - radians(%s)) +
                            sin(radians(%s)) * sin(radians(latitude))
                        ) <= 50
                        """
                    ],
                    params=[lat, lon, lat]
                )
            except ValueError:
                pass
        return queryset.filter(location__icontains=value)
    
    def filter_available_time(self, queryset, name, value):
        """Filter specialists available at a specific time."""
        return queryset.exclude(
            consultations__status__in=['confirmed', 'in_progress'],
            consultations__scheduled_time__lte=value + timedelta(hours=1),
            consultations__scheduled_time__gte=value - timedelta(hours=1)
        )
