import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-react-native';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';
import { Config } from '../config/config.base';

const MODEL_DIRECTORY = `${FileSystem.documentDirectory}ai_models/`;
const MODEL_PATH = `${MODEL_DIRECTORY}model.json`;
const WEIGHTS_PATH = `${MODEL_DIRECTORY}weights.bin`;
const LABELS_PATH = `${MODEL_DIRECTORY}labels.json`;

export interface PredictionResult {
  disease: string;
  confidence: number;
  recommendations: string[];
}

export interface DownloadProgress {
  totalBytes: number;
  downloadedBytes: number;
  percent: number;
}

class AIService {
  private model: tf.LayersModel | null = null;
  private labels: string[] = [];
  private recommendations: Record<string, string[]> = {};
  private isOfflineModelAvailable = false;

  async initialize(): Promise<void> {
    try {
      await tf.ready();
      
      // Check for offline model first
      if (await this.checkOfflineModelExists()) {
        await this.loadOfflineModel();
      } else {
        // Load model from URL if offline model not available
        this.model = await tf.loadLayersModel(Config.AI_MODEL.MODEL_URL);
        
        // Load labels and recommendations from URL
        const labelsResponse = await fetch(Config.AI_MODEL.LABELS_URL);
        const labelsData = await labelsResponse.json();
        this.labels = labelsData.labels;
        this.recommendations = labelsData.recommendations;
      }
      
      console.log('AI Model initialized successfully');
    } catch (error) {
      console.error('Error initializing AI model:', error);
      throw new Error('Failed to initialize AI model');
    }
  }

  private async checkOfflineModelExists(): Promise<boolean> {
    try {
      const modelInfo = await FileSystem.getInfoAsync(MODEL_PATH);
      const weightsInfo = await FileSystem.getInfoAsync(WEIGHTS_PATH);
      const labelsInfo = await FileSystem.getInfoAsync(LABELS_PATH);
      
      this.isOfflineModelAvailable = modelInfo.exists && weightsInfo.exists && labelsInfo.exists;
      return this.isOfflineModelAvailable;
    } catch (error) {
      console.error('Error checking offline model:', error);
      return false;
    }
  }

  private async loadOfflineModel(): Promise<void> {
    try {
      // Load model from local storage
      this.model = await tf.loadLayersModel(`file://${MODEL_PATH}`);
      
      // Load labels and recommendations from local storage
      const labelsContent = await FileSystem.readAsStringAsync(LABELS_PATH);
      const labelsData = JSON.parse(labelsContent);
      this.labels = labelsData.labels;
      this.recommendations = labelsData.recommendations;
    } catch (error) {
      console.error('Error loading offline model:', error);
      throw new Error('Failed to load offline model');
    }
  }

  async downloadModelForOffline(
    progressCallback?: (progress: DownloadProgress) => void
  ): Promise<void> {
    try {
      // Create model directory if it doesn't exist
      const dirInfo = await FileSystem.getInfoAsync(MODEL_DIRECTORY);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(MODEL_DIRECTORY, { intermediates: true });
      }

      // Download model files
      const modelDownload = FileSystem.createDownloadResumable(
        Config.AI_MODEL.MODEL_URL,
        MODEL_PATH,
        {},
        (downloadProgress) => {
          if (progressCallback) {
            const progress = downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;
            progressCallback({
              totalBytes: downloadProgress.totalBytesExpectedToWrite,
              downloadedBytes: downloadProgress.totalBytesWritten,
              percent: progress * 100
            });
          }
        }
      );

      // Download weights file
      const weightsDownload = FileSystem.createDownloadResumable(
        Config.AI_MODEL.MODEL_URL.replace('model.json', 'weights.bin'),
        WEIGHTS_PATH,
        {},
        (downloadProgress) => {
          if (progressCallback) {
            const progress = downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;
            progressCallback({
              totalBytes: downloadProgress.totalBytesExpectedToWrite,
              downloadedBytes: downloadProgress.totalBytesWritten,
              percent: progress * 100
            });
          }
        }
      );

      // Download labels and recommendations
      const labelsDownload = FileSystem.createDownloadResumable(
        Config.AI_MODEL.LABELS_URL,
        LABELS_PATH,
        {},
        (downloadProgress) => {
          if (progressCallback) {
            const progress = downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;
            progressCallback({
              totalBytes: downloadProgress.totalBytesExpectedToWrite,
              downloadedBytes: downloadProgress.totalBytesWritten,
              percent: progress * 100
            });
          }
        }
      );

      // Start downloads
      await Promise.all([
        modelDownload.downloadAsync(),
        weightsDownload.downloadAsync(),
        labelsDownload.downloadAsync()
      ]);

      // Verify downloads
      if (!(await this.checkOfflineModelExists())) {
        throw new Error('Model files not downloaded correctly');
      }

      // Load the downloaded model
      await this.loadOfflineModel();
    } catch (error) {
      console.error('Error downloading model:', error);
      throw new Error('Failed to download model for offline use');
    }
  }

  async preprocessImage(imageUri: string): Promise<tf.Tensor3D> {
    try {
      // Resize image to 224x224 (standard input size for many vision models)
      const resizedImage = await manipulateAsync(
        imageUri,
        [{ resize: { width: 224, height: 224 } }],
        { format: SaveFormat.JPEG }
      );

      // Read the image file
      const imgB64 = await FileSystem.readAsStringAsync(resizedImage.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Create tensor from base64
      const imgBuffer = tf.util.encodeString(imgB64, 'base64').buffer;
      const imageTensor = tf.browser.fromPixels(new ImageData(new Uint8ClampedArray(imgBuffer), 224, 224), 3);
      
      // Normalize pixel values to [-1, 1]
      const normalized = imageTensor.toFloat().div(tf.scalar(127.5)).sub(tf.scalar(1));
      
      return normalized as tf.Tensor3D;
    } catch (error) {
      console.error('Error preprocessing image:', error);
      throw new Error('Failed to preprocess image');
    }
  }

  async detectDisease(imageUri: string): Promise<PredictionResult> {
    try {
      if (!this.model) {
        throw new Error('Model not initialized');
      }

      // Preprocess image
      const processedImage = await this.preprocessImage(imageUri);
      
      // Add batch dimension
      const batchedImage = processedImage.expandDims(0);
      
      // Get prediction
      const predictions = await this.model.predict(batchedImage) as tf.Tensor;
      const probabilities = await predictions.data();
      
      // Get highest probability class
      const maxProbIndex = probabilities.indexOf(Math.max(...Array.from(probabilities)));
      const disease = this.labels[maxProbIndex];
      const confidence = probabilities[maxProbIndex];
      
      // Clean up tensors
      tf.dispose([processedImage, batchedImage, predictions]);
      
      return {
        disease,
        confidence,
        recommendations: this.recommendations[disease] || ['No specific recommendations available']
      };
    } catch (error) {
      console.error('Error detecting disease:', error);
      throw new Error('Failed to detect disease');
    }
  }

  isModelAvailableOffline(): boolean {
    return this.isOfflineModelAvailable;
  }
}

export const aiService = new AIService(); 