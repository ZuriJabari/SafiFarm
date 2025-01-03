import logging
import random
from PIL import Image
import io
from django.conf import settings

logger = logging.getLogger(__name__)

class AnalysisService:
    def __init__(self):
        self.class_names = [
            'Healthy',
            'Early Blight',
            'Late Blight',
            'Bacterial Spot',
            'Target Spot',
            'Yellow Leaf Curl Virus',
            'Mosaic Virus',
            'Leaf Mold',
            'Septoria Leaf Spot',
            'Spider Mites'
        ]
        self.image_size = (224, 224)
        logger.info("Mock analysis service initialized")

    def _validate_image(self, image_data):
        """Validate that the image data is correct"""
        try:
            # Try to open and process the image
            image = Image.open(io.BytesIO(image_data))
            if image.mode != 'RGB':
                image = image.convert('RGB')
            image = image.resize(self.image_size)
            return True
        except Exception as e:
            logger.error(f"Error validating image: {str(e)}")
            return False

    def analyze_image(self, image_data):
        """Mock analysis of an image for crop diseases"""
        try:
            # Validate the image
            if not self._validate_image(image_data):
                raise ValueError("Invalid image data")

            # Generate mock predictions
            predictions = [random.random() for _ in range(len(self.class_names))]
            # Normalize predictions to sum to 1
            total = sum(predictions)
            predictions = [p/total for p in predictions]
            
            # Get the predicted class and confidence
            predicted_class_index = predictions.index(max(predictions))
            confidence_score = predictions[predicted_class_index]
            
            # Get the disease name
            disease_name = self.class_names[predicted_class_index]
            
            return {
                'disease_name': disease_name,
                'confidence_score': confidence_score,
                'predictions': {
                    self.class_names[i]: predictions[i]
                    for i in range(len(self.class_names))
                }
            }
            
        except Exception as e:
            logger.error(f"Error analyzing image: {str(e)}")
            raise

    def get_disease_info(self, disease_name):
        """Get information about a specific disease"""
        disease_info = {
            'Healthy': {
                'description': 'No disease detected. The plant appears to be healthy.',
                'symptoms': 'N/A',
                'treatment': 'Continue regular maintenance and monitoring.',
                'prevention': 'Maintain good agricultural practices, proper irrigation, and regular monitoring.'
            },
            'Early Blight': {
                'description': 'A fungal disease that affects various crops, particularly tomatoes and potatoes.',
                'symptoms': 'Dark brown spots with concentric rings, yellowing leaves, leaf drop.',
                'treatment': 'Remove infected leaves, apply appropriate fungicides, improve air circulation.',
                'prevention': 'Crop rotation, proper spacing, avoid overhead watering.'
            },
            'Late Blight': {
                'description': 'A devastating plant disease caused by the water mold Phytophthora infestans.',
                'symptoms': 'Dark water-soaked spots, white fuzzy growth on leaf undersides, rapid spread.',
                'treatment': 'Remove infected plants, apply fungicides preventively, improve drainage.',
                'prevention': 'Use resistant varieties, monitor weather conditions, maintain good air flow.'
            },
            'Bacterial Spot': {
                'description': 'A bacterial disease that affects tomatoes and peppers.',
                'symptoms': 'Small, dark spots on leaves and fruits, spots may have yellow halos.',
                'treatment': 'Remove infected plants, apply copper-based bactericides.',
                'prevention': 'Use disease-free seeds, avoid overhead irrigation.'
            },
            'Target Spot': {
                'description': 'A fungal disease that causes circular lesions on leaves.',
                'symptoms': 'Circular brown spots with concentric rings, leaf yellowing.',
                'treatment': 'Remove infected leaves, apply fungicides.',
                'prevention': 'Improve air circulation, avoid leaf wetness.'
            },
            'Yellow Leaf Curl Virus': {
                'description': 'A viral disease transmitted by whiteflies.',
                'symptoms': 'Leaf curling, yellowing, and stunted growth.',
                'treatment': 'Remove infected plants, control whitefly population.',
                'prevention': 'Use resistant varieties, control whiteflies.'
            },
            'Mosaic Virus': {
                'description': 'A viral disease that causes mottled coloring on leaves.',
                'symptoms': 'Mottled green-yellow patterns on leaves, stunted growth.',
                'treatment': 'Remove infected plants, no cure available.',
                'prevention': 'Use virus-free seeds, control insect vectors.'
            },
            'Leaf Mold': {
                'description': 'A fungal disease that thrives in humid conditions.',
                'symptoms': 'Yellow spots on upper leaf surface, gray mold on undersides.',
                'treatment': 'Improve ventilation, apply fungicides.',
                'prevention': 'Reduce humidity, improve air circulation.'
            },
            'Septoria Leaf Spot': {
                'description': 'A fungal disease that causes small circular spots.',
                'symptoms': 'Small circular spots with dark borders, leaf yellowing.',
                'treatment': 'Remove infected leaves, apply fungicides.',
                'prevention': 'Crop rotation, proper plant spacing.'
            },
            'Spider Mites': {
                'description': 'Tiny arachnids that feed on plant cells.',
                'symptoms': 'Stippling on leaves, webbing, leaf yellowing.',
                'treatment': 'Apply miticides, increase humidity.',
                'prevention': 'Monitor regularly, maintain plant health.'
            }
        }
        
        return disease_info.get(disease_name, {
            'description': 'Information not available',
            'symptoms': 'Information not available',
            'treatment': 'Please consult with a specialist',
            'prevention': 'Please consult with a specialist'
        }) 