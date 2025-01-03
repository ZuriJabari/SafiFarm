from celery import shared_task
from .crop_disease_model import CropDiseaseModel
import logging
from typing import Dict, Any
import os
from django.conf import settings

logger = logging.getLogger(__name__)

@shared_task(bind=True, max_retries=3)
def analyze_crop_image(self, image_path: str) -> Dict[str, Any]:
    """
    Celery task to analyze crop images for disease detection.
    
    Args:
        image_path: Path to the uploaded image
        
    Returns:
        Dictionary containing analysis results
    """
    try:
        model = CropDiseaseModel()
        results = model.predict(image_path)
        
        # Clean up the temporary image file
        if os.path.exists(image_path):
            os.remove(image_path)
            
        return results
        
    except Exception as e:
        logger.error(f"Error analyzing crop image: {str(e)}")
        # Retry the task
        self.retry(exc=e, countdown=60)  # Retry after 60 seconds
