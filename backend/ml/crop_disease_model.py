import tensorflow as tf
import numpy as np
from pathlib import Path
from typing import Tuple, Dict, Any
import logging

logger = logging.getLogger(__name__)

class CropDiseaseModel:
    """Handles crop disease detection using TensorFlow."""
    
    def __init__(self):
        self.model = None
        self.class_names = []
        self.input_shape = (224, 224)  # Standard input size for many vision models
        self.model_path = Path(__file__).parent / 'models' / 'crop_disease_model'
        
    def load_model(self) -> None:
        """Load the pre-trained model."""
        try:
            self.model = tf.keras.models.load_model(str(self.model_path))
            logger.info("Model loaded successfully")
        except Exception as e:
            logger.error(f"Error loading model: {str(e)}")
            raise
            
    def preprocess_image(self, image_path: str) -> np.ndarray:
        """Preprocess image for model input.
        
        Args:
            image_path: Path to the image file
            
        Returns:
            Preprocessed image as numpy array
        """
        try:
            # Load and preprocess the image
            img = tf.keras.preprocessing.image.load_img(
                image_path,
                target_size=self.input_shape
            )
            img_array = tf.keras.preprocessing.image.img_to_array(img)
            img_array = tf.expand_dims(img_array, 0)
            img_array = tf.keras.applications.mobilenet_v2.preprocess_input(img_array)
            
            return img_array
            
        except Exception as e:
            logger.error(f"Error preprocessing image: {str(e)}")
            raise
            
    def predict(self, image_path: str) -> Dict[str, Any]:
        """Predict crop disease from image.
        
        Args:
            image_path: Path to the image file
            
        Returns:
            Dictionary containing prediction results
        """
        try:
            if self.model is None:
                self.load_model()
                
            # Preprocess the image
            processed_image = self.preprocess_image(image_path)
            
            # Make prediction
            predictions = self.model.predict(processed_image)
            
            # Get the predicted class and confidence
            predicted_class_index = np.argmax(predictions[0])
            confidence = float(predictions[0][predicted_class_index])
            
            # Get the class name
            predicted_class = self.class_names[predicted_class_index]
            
            return {
                'disease': predicted_class,
                'confidence': confidence,
                'recommendations': self.get_treatment_recommendations(predicted_class)
            }
            
        except Exception as e:
            logger.error(f"Error making prediction: {str(e)}")
            raise
            
    def get_treatment_recommendations(self, disease: str) -> Dict[str, Any]:
        """Get treatment recommendations for detected disease.
        
        Args:
            disease: Detected disease name
            
        Returns:
            Dictionary containing treatment recommendations
        """
        # This would be replaced with actual recommendations from a database
        recommendations = {
            'immediate_actions': [
                'Isolate affected plants',
                'Remove severely infected leaves'
            ],
            'treatments': [
                'Apply appropriate fungicide/pesticide',
                'Adjust watering schedule'
            ],
            'preventive_measures': [
                'Improve air circulation',
                'Maintain proper plant spacing',
                'Regular monitoring'
            ]
        }
        
        return recommendations
