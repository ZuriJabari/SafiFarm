import tensorflow as tf
import numpy as np
import os

def create_dummy_model():
    """
    Creates a simple test model for development purposes.
    """
    # Create a simple sequential model
    model = tf.keras.Sequential([
        tf.keras.layers.Input(shape=(224, 224, 3)),
        tf.keras.layers.Conv2D(32, 3, activation='relu'),
        tf.keras.layers.MaxPooling2D(),
        tf.keras.layers.Conv2D(64, 3, activation='relu'),
        tf.keras.layers.MaxPooling2D(),
        tf.keras.layers.Conv2D(64, 3, activation='relu'),
        tf.keras.layers.Flatten(),
        tf.keras.layers.Dense(64, activation='relu'),
        tf.keras.layers.Dense(10, activation='softmax')
    ])
    
    # Compile the model
    model.compile(
        optimizer='adam',
        loss='sparse_categorical_crossentropy',
        metrics=['accuracy']
    )
    
    return model

def main():
    # Create model
    model = create_dummy_model()
    
    # Create models directory if it doesn't exist
    os.makedirs('../models/crop_disease_v1.0', exist_ok=True)
    
    # Save the model
    model.save('../models/crop_disease_v1.0')
    print("Test model created and saved successfully!")

if __name__ == '__main__':
    main()
