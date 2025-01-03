from django.apps import AppConfig

class MLConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'ml'
    
    def ready(self):
        """
        Initialize ML models when Django starts.
        """
        from .model_manager import ModelManager
        
        try:
            manager = ModelManager()
            # Initialize crop disease model
            manager.download_model('crop_disease', 'v1.0')
        except Exception as e:
            # Log error but don't prevent app from starting
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Error initializing ML models: {str(e)}")
