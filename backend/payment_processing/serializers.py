from rest_framework import serializers
from django.utils import timezone
from .models import PaymentMethod, Transaction, PaymentVerification
from .currency_utils import validate_transaction_amount

class PaymentMethodSerializer(serializers.ModelSerializer):
    provider_display = serializers.CharField(source='get_provider_display', read_only=True)
    
    class Meta:
        model = PaymentMethod
        fields = [
            'id', 'provider', 'provider_display', 'phone_number',
            'is_default', 'is_verified', 'created_at'
        ]
        read_only_fields = ['is_verified', 'created_at']
    
    def validate_phone_number(self, value):
        """Validate Ugandan phone number format."""
        # Remove any spaces or special characters
        value = ''.join(filter(str.isdigit, value))
        
        # Ensure it starts with Uganda country code (256)
        if not value.startswith('256'):
            if value.startswith('0'):
                value = '256' + value[1:]
            elif value.startswith('+'):
                value = value[1:]
            else:
                value = '256' + value
        
        if len(value) != 12:  # 256 + 9 digits
            raise serializers.ValidationError(
                "Invalid phone number format. Must be a valid Ugandan phone number."
            )
        
        # Validate Ugandan prefixes (MTN: 77, 78, Airtel: 70, 75)
        prefix = value[3:5]
        valid_prefixes = {
            'mtn': ['77', '78'],
            'airtel': ['70', '75']
        }
        
        provider = self.initial_data.get('provider', '').lower()
        if provider and prefix not in valid_prefixes.get(provider, []):
            raise serializers.ValidationError(
                f"Phone number prefix must be valid for {provider.upper()}. "
                f"Valid prefixes: {', '.join(valid_prefixes[provider])}"
            )
        
        return value

class TransactionSerializer(serializers.ModelSerializer):
    """Serializer for Transaction model."""
    
    formatted_amount = serializers.CharField(read_only=True)
    payment_method_details = serializers.SerializerMethodField()
    
    class Meta:
        model = Transaction
        fields = [
            'id', 'user', 'payment_method', 'amount',
            'status', 'transaction_type', 'description',
            'created_at', 'updated_at', 'formatted_amount',
            'payment_method_details'
        ]
        read_only_fields = ['status', 'formatted_amount']
    
    def validate_amount(self, value):
        """Validate transaction amount."""
        transaction_type = self.initial_data.get('transaction_type')
        if not transaction_type:
            raise serializers.ValidationError(
                "transaction_type is required to validate amount"
            )
        
        try:
            return validate_transaction_amount(value, transaction_type)
        except ValueError as e:
            raise serializers.ValidationError(str(e))
    
    def get_payment_method_details(self, obj):
        """Get payment method details."""
        return {
            'provider': obj.payment_method.provider,
            'phone_number': obj.payment_method.phone_number,
            'is_default': obj.payment_method.is_default
        }

class PaymentVerificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = PaymentVerification
        fields = ['id', 'payment_method', 'verification_code', 'is_verified', 'expires_at']
        read_only_fields = ['verification_code', 'is_verified', 'expires_at']
    
    def validate(self, data):
        """Ensure verification hasn't expired."""
        if self.instance and self.instance.expires_at < timezone.now():
            raise serializers.ValidationError("Verification code has expired")
        return data

class VerifyCodeSerializer(serializers.Serializer):
    verification_code = serializers.CharField(max_length=6)
    
    def validate_verification_code(self, value):
        """Ensure verification code is numeric and 6 digits."""
        if not value.isdigit() or len(value) != 6:
            raise serializers.ValidationError("Verification code must be 6 digits")
        return value
