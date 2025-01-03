import tensorflow as tf
from tensorflow.keras import layers, models
import os

def create_test_model():
    # Create a simple CNN model
    model = models.Sequential([
        layers.Conv2D(32, (3, 3), activation='relu', input_shape=(224, 224, 3)),
        layers.MaxPooling2D((2, 2)),
        layers.Conv2D(64, (3, 3), activation='relu'),
        layers.MaxPooling2D((2, 2)),
        layers.Conv2D(64, (3, 3), activation='relu'),
        layers.Flatten(),
        layers.Dense(64, activation='relu'),
        layers.Dense(10, activation='softmax')  # 10 classes for our diseases
    ])

    # Compile the model
    model.compile(
        optimizer='adam',
        loss='categorical_crossentropy',
        metrics=['accuracy']
    )

    # Save the model
    model_path = os.path.join(os.path.dirname(__file__), 'crop_disease_model')
    model.save(model_path)
    print(f"Test model saved to {model_path}")

if __name__ == '__main__':
    create_test_model() 