import boto3
import os
from pathlib import Path
import tensorflow as tf
import logging
from django.conf import settings
from typing import Optional

logger = logging.getLogger(__name__)

class ModelManager:
    """
    Manages ML model lifecycle including downloads and updates.
    """
    
    def __init__(self):
        self.s3_client = boto3.client('s3',
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
            region_name=settings.AWS_S3_REGION_NAME
        )
        self.bucket_name = settings.AWS_STORAGE_BUCKET_NAME
        self.models_dir = Path(__file__).parent / 'models'
        self.models_dir.mkdir(exist_ok=True)
        
    def download_model(self, model_name: str, version: str) -> Optional[Path]:
        """
        Download model from S3 if not present locally.
        
        Args:
            model_name: Name of the model
            version: Model version
            
        Returns:
            Path to the downloaded model or None if failed
        """
        try:
            model_path = self.models_dir / f"{model_name}_{version}"
            if model_path.exists():
                logger.info(f"Model {model_name} version {version} already exists locally")
                return model_path
                
            # Download from S3
            s3_key = f"models/{model_name}/{version}"
            local_path = model_path / "saved_model.pb"
            local_path.parent.mkdir(exist_ok=True)
            
            self.s3_client.download_file(
                self.bucket_name,
                s3_key,
                str(local_path)
            )
            
            logger.info(f"Successfully downloaded model {model_name} version {version}")
            return model_path
            
        except Exception as e:
            logger.error(f"Error downloading model: {str(e)}")
            return None
            
    def check_for_updates(self, model_name: str, current_version: str) -> bool:
        """
        Check if there's a newer version of the model available.
        
        Args:
            model_name: Name of the model
            current_version: Current version of the model
            
        Returns:
            True if updates are available, False otherwise
        """
        try:
            response = self.s3_client.list_objects_v2(
                Bucket=self.bucket_name,
                Prefix=f"models/{model_name}/"
            )
            
            if 'Contents' in response:
                versions = [
                    obj['Key'].split('/')[-1]
                    for obj in response['Contents']
                ]
                latest_version = max(versions)
                
                return latest_version > current_version
                
            return False
            
        except Exception as e:
            logger.error(f"Error checking for model updates: {str(e)}")
            return False
            
    def load_model(self, model_name: str, version: str) -> Optional[tf.keras.Model]:
        """
        Load a specific version of a model.
        
        Args:
            model_name: Name of the model
            version: Model version
            
        Returns:
            Loaded TensorFlow model or None if failed
        """
        try:
            model_path = self.download_model(model_name, version)
            if model_path is None:
                return None
                
            model = tf.keras.models.load_model(str(model_path))
            return model
            
        except Exception as e:
            logger.error(f"Error loading model: {str(e)}")
            return None
