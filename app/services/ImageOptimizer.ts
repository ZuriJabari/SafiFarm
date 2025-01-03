import * as ImageManipulator from "expo-image-manipulator"
import * as FileSystem from "expo-file-system"
import { Platform } from "react-native"
import NetInfo from "@react-native-community/netinfo"

export interface ImageConfig {
  maxWidth: number
  maxHeight: number
  quality: number
  format: "jpeg" | "png"
}

export interface OptimizationResult {
  uri: string
  width: number
  height: number
  size: number
}

export class ImageOptimizer {
  private static instance: ImageOptimizer
  private defaultConfig: ImageConfig = {
    maxWidth: 1080,
    maxHeight: 1080,
    quality: 0.8,
    format: "jpeg"
  }

  private constructor() {}

  static getInstance(): ImageOptimizer {
    if (!ImageOptimizer.instance) {
      ImageOptimizer.instance = new ImageOptimizer()
    }
    return ImageOptimizer.instance
  }

  async optimizeImage(
    uri: string,
    config: Partial<ImageConfig> = {}
  ): Promise<OptimizationResult> {
    const finalConfig = { ...this.defaultConfig, ...config }
    
    try {
      // Get original image info
      const fileInfo = await FileSystem.getInfoAsync(uri)
      if (!fileInfo.exists) {
        throw new Error("Image file does not exist")
      }

      // Get network status to determine optimization level
      const netInfo = await NetInfo.fetch()
      const isLowBandwidth = !netInfo.isConnected || netInfo.type === "cellular"

      // Adjust quality based on network condition
      const quality = isLowBandwidth ? 
        Math.min(finalConfig.quality, 0.6) : 
        finalConfig.quality

      // First pass: resize if needed
      const resizeResult = await this.resizeImage(
        uri,
        finalConfig.maxWidth,
        finalConfig.maxHeight
      )

      // Second pass: compress if needed
      const compressed = await this.compressIfNeeded(
        resizeResult.uri,
        quality,
        finalConfig.format
      )

      // Get final file info
      const finalInfo = await FileSystem.getInfoAsync(compressed.uri)

      return {
        uri: compressed.uri,
        width: compressed.width,
        height: compressed.height,
        size: finalInfo.size || 0
      }
    } catch (error) {
      console.error("Image optimization failed:", error)
      throw error
    }
  }

  private async resizeImage(
    uri: string,
    maxWidth: number,
    maxHeight: number
  ): Promise<ImageManipulator.ImageResult> {
    // Get image dimensions
    const { width, height } = await this.getImageDimensions(uri)

    // Calculate aspect ratio
    const aspectRatio = width / height

    // Calculate new dimensions
    let newWidth = width
    let newHeight = height

    if (width > maxWidth) {
      newWidth = maxWidth
      newHeight = maxWidth / aspectRatio
    }

    if (newHeight > maxHeight) {
      newHeight = maxHeight
      newWidth = maxHeight * aspectRatio
    }

    // Only resize if dimensions changed
    if (newWidth !== width || newHeight !== height) {
      return ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: newWidth, height: newHeight } }],
        { compress: 1, format: ImageManipulator.SaveFormat.JPEG }
      )
    }

    return { uri, width, height }
  }

  private async compressIfNeeded(
    uri: string,
    quality: number,
    format: "jpeg" | "png"
  ): Promise<ImageManipulator.ImageResult> {
    const fileInfo = await FileSystem.getInfoAsync(uri)
    const maxSize = 1024 * 1024 // 1MB

    if (fileInfo.size && fileInfo.size > maxSize) {
      // Calculate required quality to reach target size
      const targetQuality = Math.min(
        quality,
        (maxSize / fileInfo.size) * quality
      )

      return ImageManipulator.manipulateAsync(
        uri,
        [],
        {
          compress: targetQuality,
          format:
            format === "jpeg"
              ? ImageManipulator.SaveFormat.JPEG
              : ImageManipulator.SaveFormat.PNG
        }
      )
    }

    return { uri, width: 0, height: 0 }
  }

  private async getImageDimensions(
    uri: string
  ): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      if (Platform.OS === "web") {
        const img = new Image()
        img.onload = () => {
          resolve({ width: img.width, height: img.height })
        }
        img.onerror = reject
        img.src = uri
      } else {
        Image.getSize(
          uri,
          (width, height) => resolve({ width, height }),
          reject
        )
      }
    })
  }

  async optimizeForUpload(uri: string): Promise<OptimizationResult> {
    // Special configuration for upload
    return this.optimizeImage(uri, {
      maxWidth: 1920,
      maxHeight: 1920,
      quality: 0.9,
      format: "jpeg"
    })
  }

  async optimizeForThumbnail(uri: string): Promise<OptimizationResult> {
    // Special configuration for thumbnails
    return this.optimizeImage(uri, {
      maxWidth: 200,
      maxHeight: 200,
      quality: 0.7,
      format: "jpeg"
    })
  }

  async optimizeForPreview(uri: string): Promise<OptimizationResult> {
    // Special configuration for previews
    return this.optimizeImage(uri, {
      maxWidth: 800,
      maxHeight: 800,
      quality: 0.8,
      format: "jpeg"
    })
  }
}
