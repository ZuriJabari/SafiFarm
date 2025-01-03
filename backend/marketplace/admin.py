from django.contrib import admin
from django.utils.html import format_html
from .models import Equipment, Rental, Specialist, Consultation, Review

@admin.register(Equipment)
class EquipmentAdmin(admin.ModelAdmin):
    list_display = ('name', 'owner', 'equipment_type', 'daily_rate', 'location', 'is_available')
    list_filter = ('equipment_type', 'is_available', 'location')
    search_fields = ('name', 'description', 'owner__username', 'location')
    readonly_fields = ('created_at', 'updated_at')
    fieldsets = (
        ('Basic Information', {
            'fields': ('owner', 'name', 'equipment_type', 'description')
        }),
        ('Pricing & Availability', {
            'fields': ('daily_rate', 'is_available')
        }),
        ('Location', {
            'fields': ('location', 'latitude', 'longitude')
        }),
        ('Additional Information', {
            'fields': ('specifications', 'images')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )

@admin.register(Rental)
class RentalAdmin(admin.ModelAdmin):
    list_display = ('equipment', 'renter', 'start_date', 'end_date', 'status', 'payment_status')
    list_filter = ('status', 'payment_status')
    search_fields = ('equipment__name', 'renter__username', 'notes')
    readonly_fields = ('created_at', 'updated_at')
    fieldsets = (
        ('Rental Information', {
            'fields': ('equipment', 'renter', 'start_date', 'end_date')
        }),
        ('Status & Payment', {
            'fields': ('status', 'payment_status', 'total_amount')
        }),
        ('Additional Information', {
            'fields': ('notes',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )

@admin.register(Specialist)
class SpecialistAdmin(admin.ModelAdmin):
    list_display = ('user', 'specialist_type', 'location', 'rating', 'is_verified')
    list_filter = ('specialist_type', 'is_verified', 'location')
    search_fields = ('user__username', 'user__email', 'bio', 'location')
    readonly_fields = ('rating', 'total_reviews', 'created_at', 'updated_at')
    fieldsets = (
        ('Basic Information', {
            'fields': ('user', 'specialist_type', 'bio')
        }),
        ('Qualifications', {
            'fields': ('qualifications', 'experience_years', 'languages')
        }),
        ('Pricing & Availability', {
            'fields': ('hourly_rate', 'available_hours')
        }),
        ('Location', {
            'fields': ('location', 'latitude', 'longitude')
        }),
        ('Status', {
            'fields': ('is_verified', 'rating', 'total_reviews')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )

@admin.register(Consultation)
class ConsultationAdmin(admin.ModelAdmin):
    list_display = ('specialist', 'farmer', 'consultation_type', 'scheduled_time', 'status', 'payment_status')
    list_filter = ('consultation_type', 'status', 'payment_status')
    search_fields = ('specialist__user__username', 'farmer__username', 'problem_description')
    readonly_fields = ('created_at', 'updated_at')
    fieldsets = (
        ('Consultation Information', {
            'fields': ('specialist', 'farmer', 'consultation_type', 'scheduled_time', 'duration_minutes')
        }),
        ('Status & Payment', {
            'fields': ('status', 'payment_status', 'total_amount')
        }),
        ('Details', {
            'fields': ('problem_description', 'notes')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )

@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ('reviewer', 'rating', 'content_type', 'get_reviewed_item', 'created_at')
    list_filter = ('rating', 'content_type')
    search_fields = ('reviewer__username', 'comment')
    readonly_fields = ('created_at', 'updated_at')
    
    def get_reviewed_item(self, obj):
        """Display a link to the reviewed item."""
        if obj.content_type.model == 'rental':
            return format_html('<a href="/admin/marketplace/rental/{}/">{}</a>',
                             obj.object_id,
                             f"Rental #{obj.object_id}")
        elif obj.content_type.model == 'consultation':
            return format_html('<a href="/admin/marketplace/consultation/{}/">{}</a>',
                             obj.object_id,
                             f"Consultation #{obj.object_id}")
        return str(obj.object_id)
    
    get_reviewed_item.short_description = 'Reviewed Item'
