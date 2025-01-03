import { aiService } from '../AIService';
import * as tf from '@tensorflow/tfjs';
import * as FileSystem from 'expo-file-system';
import { manipulateAsync } from 'expo-image-manipulator';

jest.mock('@tensorflow/tfjs', () => ({
  ready: jest.fn().mockResolvedValue(undefined),
  loadLayersModel: jest.fn(),
  util: {
    encodeString: jest.fn().mockReturnValue({ buffer: new ArrayBuffer(0) })
  },
  browser: {
    fromPixels: jest.fn().mockReturnValue({
      toFloat: jest.fn().mockReturnValue({
        div: jest.fn().mockReturnValue({
          sub: jest.fn().mockReturnValue({
            expandDims: jest.fn().mockReturnValue({})
          })
        })
      })
    })
  },
  dispose: jest.fn(),
  scalar: jest.fn()
}));

jest.mock('expo-file-system', () => ({
  documentDirectory: '/mock/directory/',
  readAsStringAsync: jest.fn(),
  getInfoAsync: jest.fn(),
  makeDirectoryAsync: jest.fn(),
  createDownloadResumable: jest.fn(),
  EncodingType: {
    Base64: 'base64'
  }
}));

jest.mock('expo-image-manipulator', () => ({
  manipulateAsync: jest.fn(),
  SaveFormat: {
    JPEG: 'jpeg'
  }
}));

describe('AIService', () => {
  const mockModelResponse = {
    predict: jest.fn().mockResolvedValue({
      data: jest.fn().mockResolvedValue([0.1, 0.8, 0.1])
    })
  };

  const mockLabelsResponse = {
    labels: ['healthy', 'leaf_blight', 'rust'],
    recommendations: {
      healthy: ['Continue current care regime'],
      leaf_blight: ['Apply fungicide', 'Remove affected leaves'],
      rust: ['Apply rust-specific fungicide', 'Improve air circulation']
    }
  };

  const mockDownloadResumable = {
    downloadAsync: jest.fn().mockResolvedValue({ uri: 'downloaded-file' })
  };

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn().mockResolvedValue({
      json: jest.fn().mockResolvedValue(mockLabelsResponse)
    });
    (tf.loadLayersModel as jest.Mock).mockResolvedValue(mockModelResponse);
    (manipulateAsync as jest.Mock).mockResolvedValue({ uri: 'mock-uri' });
    (FileSystem.readAsStringAsync as jest.Mock).mockResolvedValue(JSON.stringify(mockLabelsResponse));
    (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({ exists: false });
    (FileSystem.createDownloadResumable as jest.Mock).mockReturnValue(mockDownloadResumable);
  });

  describe('Offline Model Management', () => {
    it('checks for offline model correctly', async () => {
      (FileSystem.getInfoAsync as jest.Mock)
        .mockResolvedValueOnce({ exists: true })  // model.json
        .mockResolvedValueOnce({ exists: true })  // weights.bin
        .mockResolvedValueOnce({ exists: true }); // labels.json

      await aiService.initialize();
      expect(FileSystem.getInfoAsync).toHaveBeenCalledTimes(3);
      expect(tf.loadLayersModel).toHaveBeenCalledWith('file:///mock/directory/ai_models/model.json');
    });

    it('falls back to online model when offline not available', async () => {
      (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({ exists: false });

      await aiService.initialize();
      expect(tf.loadLayersModel).toHaveBeenCalledWith(expect.not.stringContaining('file://'));
      expect(global.fetch).toHaveBeenCalled();
    });

    it('downloads model for offline use', async () => {
      const progressCallback = jest.fn();
      await aiService.downloadModelForOffline(progressCallback);

      expect(FileSystem.makeDirectoryAsync).toHaveBeenCalled();
      expect(FileSystem.createDownloadResumable).toHaveBeenCalledTimes(3);
      expect(mockDownloadResumable.downloadAsync).toHaveBeenCalledTimes(3);
    });

    it('handles offline model download errors', async () => {
      mockDownloadResumable.downloadAsync.mockRejectedValue(new Error('Download failed'));

      await expect(aiService.downloadModelForOffline()).rejects.toThrow('Failed to download model for offline use');
    });

    it('loads offline model successfully', async () => {
      (FileSystem.getInfoAsync as jest.Mock)
        .mockResolvedValueOnce({ exists: true })
        .mockResolvedValueOnce({ exists: true })
        .mockResolvedValueOnce({ exists: true });

      await aiService.initialize();
      
      expect(FileSystem.readAsStringAsync).toHaveBeenCalled();
      expect(tf.loadLayersModel).toHaveBeenCalledWith(expect.stringContaining('file://'));
    });
  });

  it('initializes successfully', async () => {
    await aiService.initialize();
    expect(tf.ready).toHaveBeenCalled();
    expect(tf.loadLayersModel).toHaveBeenCalled();
    expect(global.fetch).toHaveBeenCalled();
  });

  it('preprocesses images correctly', async () => {
    await aiService.initialize();
    await aiService.preprocessImage('test-uri');
    
    expect(manipulateAsync).toHaveBeenCalledWith(
      'test-uri',
      [{ resize: { width: 224, height: 224 } }],
      { format: 'jpeg' }
    );
    expect(FileSystem.readAsStringAsync).toHaveBeenCalledWith('mock-uri', {
      encoding: 'base64'
    });
  });

  it('detects diseases correctly', async () => {
    await aiService.initialize();
    const result = await aiService.detectDisease('test-uri');
    
    expect(result).toEqual({
      disease: 'leaf_blight',
      confidence: 0.8,
      recommendations: ['Apply fungicide', 'Remove affected leaves']
    });
  });

  it('handles initialization errors', async () => {
    (tf.loadLayersModel as jest.Mock).mockRejectedValue(new Error('Model load failed'));
    
    await expect(aiService.initialize()).rejects.toThrow('Failed to initialize AI model');
  });

  it('handles prediction errors', async () => {
    await aiService.initialize();
    mockModelResponse.predict.mockRejectedValue(new Error('Prediction failed'));
    
    await expect(aiService.detectDisease('test-uri')).rejects.toThrow('Failed to detect disease');
  });
}); 