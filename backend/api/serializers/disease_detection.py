from rest_framework import serializers

class DiseaseDetectionSerializer(serializers.Serializer):
    """
    Serializer for crop disease detection requests.
    """
    image = serializers.ImageField(required=True)
    location = serializers.CharField(required=False, allow_blank=True)
    crop_type = serializers.CharField(required=False, allow_blank=True)
    
    def validate_image(self, value):
        """
        Validate the uploaded image.
        """
        # Check file size (max 10MB)
        if value.size > 10 * 1024 * 1024:
            raise serializers.ValidationError("Image size should not exceed 10MB")
            
        # Check file extension
        valid_extensions = ['.jpg', '.jpeg', '.png']
        ext = str(value.name).lower().split('.')[-1]
        if f'.{ext}' not in valid_extensions:
            raise serializers.ValidationError(
                "Invalid image format. Supported formats: JPG, JPEG, PNG"
            )
            
        return value
