from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.utils import timezone
from .models import Transaction, PaymentMethod

@admin.register(PaymentMethod)
class PaymentMethodAdmin(admin.ModelAdmin):
    list_display = ('user', 'provider', 'phone_number', 'is_verified', 'is_default', 'created_at')
    list_filter = ('provider', 'is_verified', 'is_default')
    search_fields = ('user__email', 'user__first_name', 'user__last_name', 'phone_number')
    readonly_fields = ('created_at', 'updated_at')
    ordering = ('-created_at',)
    
    fieldsets = (
        ('User Information', {
            'fields': ('user', 'provider', 'phone_number')
        }),
        ('Status', {
            'fields': ('is_verified', 'is_default')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )

@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = (
        'id', 'user_link', 'amount_display', 'transaction_type',
        'status_badge', 'provider_display', 'created_at_display'
    )
    list_filter = (
        'status', 'transaction_type', 'payment_method__provider',
        'created_at', 'completed_at'
    )
    search_fields = (
        'id', 'user__email', 'user__first_name', 'user__last_name',
        'payment_method__phone_number', 'provider_ref'
    )
    readonly_fields = (
        'created_at', 'updated_at', 'completed_at', 'expires_at',
        'provider_ref', 'provider_status', 'provider_message',
        'attempts', 'last_error', 'metadata_display'
    )
    ordering = ('-created_at',)
    
    fieldsets = (
        ('Basic Information', {
            'fields': (
                'user', 'payment_method', 'amount', 'transaction_type',
                'status'
            )
        }),
        ('Provider Information', {
            'fields': (
                'provider_ref', 'provider_status', 'provider_message'
            ),
            'classes': ('collapse',)
        }),
        ('Transaction Details', {
            'fields': (
                'attempts', 'last_error', 'metadata_display'
            ),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': (
                'created_at', 'updated_at', 'completed_at', 'expires_at'
            ),
            'classes': ('collapse',)
        })
    )
    
    def user_link(self, obj):
        url = reverse('admin:auth_user_change', args=[obj.user.id])
        return format_html('<a href="{}">{}</a>', url, obj.user.get_full_name() or obj.user.email)
    user_link.short_description = 'User'
    user_link.admin_order_field = 'user__email'
    
    def amount_display(self, obj):
        return format_html(
            '<span style="white-space: nowrap;">{}</span>',
            obj.formatted_amount
        )
    amount_display.short_description = 'Amount'
    amount_display.admin_order_field = 'amount'
    
    def status_badge(self, obj):
        colors = {
            'pending': '#FFA500',    # Orange
            'processing': '#1E90FF', # Blue
            'completed': '#32CD32',  # Green
            'failed': '#DC143C',     # Red
            'expired': '#808080',    # Gray
            'cancelled': '#A0522D'   # Brown
        }
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 7px; '
            'border-radius: 3px; font-size: 11px;">{}</span>',
            colors.get(obj.status, '#808080'),
            obj.get_status_display()
        )
    status_badge.short_description = 'Status'
    status_badge.admin_order_field = 'status'
    
    def provider_display(self, obj):
        if obj.payment_method:
            return format_html(
                '{}<br><span style="color: #666; font-size: 11px;">{}</span>',
                obj.payment_method.get_provider_display(),
                obj.payment_method.phone_number
            )
        return '-'
    provider_display.short_description = 'Provider'
    provider_display.admin_order_field = 'payment_method__provider'
    
    def created_at_display(self, obj):
        time_diff = timezone.now() - obj.created_at
        hours = time_diff.total_seconds() / 3600
        
        if hours < 24:
            return format_html(
                '<span style="color: #666;">{}</span><br>'
                '<span style="color: #090; font-size: 11px;">Today</span>',
                obj.created_at.strftime('%H:%M:%S')
            )
        elif hours < 48:
            return format_html(
                '<span style="color: #666;">{}</span><br>'
                '<span style="color: #900; font-size: 11px;">Yesterday</span>',
                obj.created_at.strftime('%H:%M:%S')
            )
        else:
            return format_html(
                '<span style="color: #666;">{}</span>',
                obj.created_at.strftime('%Y-%m-%d %H:%M')
            )
    created_at_display.short_description = 'Created'
    created_at_display.admin_order_field = 'created_at'
    
    def metadata_display(self, obj):
        if not obj.metadata:
            return '-'
        
        html = ['<div style="font-family: monospace; white-space: pre-wrap;">']
        for key, value in obj.metadata.items():
            if key == 'notifications':
                html.append('<strong>Notifications:</strong>')
                for notification in value:
                    html.append(
                        f"  • {notification['type']} ({notification['sent_at']}): "
                        f"{notification['message']}"
                    )
            else:
                html.append(f'<strong>{key}:</strong> {value}')
        html.append('</div>')
        
        return format_html('<br>'.join(html))
    metadata_display.short_description = 'Metadata'
    
    def has_add_permission(self, request):
        # Transactions should only be created through the API
        return False
    
    def has_delete_permission(self, request, obj=None):
        # Transactions should never be deleted
        return False
    
    class Media:
        css = {
            'all': ('admin/css/payment_admin.css',)
        }
