import React, { useState, useEffect, useRef } from "react"
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  ScrollView,
  Alert,
  Modal,
  Platform
} from "react-native"
import { observer } from "mobx-react-lite"
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native"
import { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { Camera, CameraType } from "expo-camera"
import * as ImagePicker from "expo-image-picker"
import { useStores } from "../models/helpers/useStores"
import { manipulateAsync, SaveFormat } from "expo-image-manipulator"
import { aiService } from "../services/AIService"
import * as Progress from "react-native-progress"
import { AppStackParamList } from "../navigators/AppNavigator"

type CropAnalysisScreenNavigationProp = NativeStackNavigationProp<
  AppStackParamList,
  "CropAnalysis"
>;

export const CropAnalysisScreen = observer(() => {
  const navigation = useNavigation<CropAnalysisScreenNavigationProp>()
  const route = useRoute<RouteProp<AppStackParamList, "CropAnalysis">>()
  const { cropStore } = useStores()
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)
  const [isCameraVisible, setIsCameraVisible] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [isDownloadingModel, setIsDownloadingModel] = useState(false)
  const [downloadProgress, setDownloadProgress] = useState(0)
  const [showDownloadModal, setShowDownloadModal] = useState(false)
  const cameraRef = useRef<Camera | null>(null)

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync()
      setHasPermission(status === "granted")
      
      // Check if we need to show the download modal
      if (!aiService.isModelAvailableOffline()) {
        setShowDownloadModal(true)
      }
    })()
  }, [])

  const handleModelDownload = async () => {
    try {
      setIsDownloadingModel(true)
      await aiService.downloadModelForOffline((progress) => {
        setDownloadProgress(progress.percent)
      })
      Alert.alert(
        "Success",
        "AI model downloaded successfully. You can now use the app offline!",
        [{ text: "OK", onPress: () => setShowDownloadModal(false) }]
      )
    } catch (error) {
      Alert.alert(
        "Error",
        "Failed to download AI model. Please check your internet connection and try again.",
        [{ text: "OK" }]
      )
    } finally {
      setIsDownloadingModel(false)
      setDownloadProgress(0)
    }
  }

  const handleTakePhoto = async () => {
    setIsCameraVisible(true)
  }

  const handleSelectPhoto = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8
      })

      if (!result.canceled) {
        const manipulatedImage = await manipulateAsync(
          result.assets[0].uri,
          [{ resize: { width: 300, height: 300 } }],
          { format: SaveFormat.JPEG, compress: 0.8 }
        )
        setSelectedImage(manipulatedImage.uri)
        await analyzeCropImage(manipulatedImage.uri)
      }
    } catch (error) {
      Alert.alert("Error", "Failed to select image")
    }
  }

  const analyzeCropImage = async (imageUri: string) => {
    setIsAnalyzing(true)
    try {
      const cropId = route.params?.cropId || Date.now().toString()
      await cropStore.analyzeCrop(cropId, imageUri)
      navigation.navigate("CropDetails", { cropId })
    } catch (error) {
      Alert.alert("Error", "Failed to analyze image")
    } finally {
      setIsAnalyzing(false)
    }
  }

  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    )
  }

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Text>No access to camera</Text>
      </View>
    )
  }

  return (
    <>
      <ScrollView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>Analyze Your Crop</Text>
          <Text style={styles.subtitle}>
            Take or select a photo of your crop for AI-powered disease detection
          </Text>

          {selectedImage ? (
            <View style={styles.imageContainer}>
              <Image source={{ uri: selectedImage }} style={styles.image} />
              {isAnalyzing && (
                <View style={styles.analyzingOverlay}>
                  <ActivityIndicator size="large" color="#fff" />
                  <Text style={styles.analyzingText}>Analyzing crop...</Text>
                </View>
              )}
            </View>
          ) : (
            <View style={styles.placeholderContainer}>
              <Text style={styles.placeholderText}>No image selected</Text>
            </View>
          )}

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.photoButton]}
              onPress={handleTakePhoto}
              disabled={isAnalyzing}
            >
              <Text style={styles.buttonText}>Take Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.photoButton]}
              onPress={handleSelectPhoto}
              disabled={isAnalyzing}
            >
              <Text style={styles.buttonText}>Select Photo</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <Modal
        visible={showDownloadModal}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Download AI Model</Text>
            <Text style={styles.modalText}>
              To use the app offline, you need to download the AI model (approximately 50MB).
              Would you like to download it now?
            </Text>
            
            {isDownloadingModel && (
              <View style={styles.progressContainer}>
                <Progress.Circle
                  progress={downloadProgress / 100}
                  size={60}
                  showsText={true}
                  formatText={() => `${Math.round(downloadProgress)}%`}
                  color="#4CAF50"
                />
                <Text style={styles.downloadingText}>Downloading...</Text>
              </View>
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowDownloadModal(false)}
                disabled={isDownloadingModel}
              >
                <Text style={styles.modalButtonText}>Later</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.downloadButton]}
                onPress={handleModelDownload}
                disabled={isDownloadingModel}
              >
                <Text style={styles.modalButtonText}>Download</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {isCameraVisible && (
        <Camera
          ref={cameraRef}
          style={styles.camera}
          type={CameraType.back}
        >
          <View style={styles.cameraButtonContainer}>
            <TouchableOpacity
              style={styles.button}
              onPress={() => setIsCameraVisible(false)}
            >
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.captureButton]}
              onPress={async () => {
                if (cameraRef.current) {
                  const photo = await cameraRef.current.takePictureAsync()
                  setIsCameraVisible(false)
                  setSelectedImage(photo.uri)
                  await analyzeCropImage(photo.uri)
                }
              }}
            >
              <View style={styles.captureButtonInner} />
            </TouchableOpacity>
          </View>
        </Camera>
      )}
    </>
  )
})

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff"
  },
  content: {
    padding: 20
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 20
  },
  camera: {
    flex: 1
  },
  cameraButtonContainer: {
    flex: 1,
    backgroundColor: "transparent",
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "flex-end",
    marginBottom: 40
  },
  imageContainer: {
    width: "100%",
    height: 300,
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 20
  },
  image: {
    width: "100%",
    height: "100%",
    resizeMode: "cover"
  },
  placeholderContainer: {
    width: "100%",
    height: 300,
    borderRadius: 12,
    backgroundColor: "#f5f5f5",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20
  },
  placeholderText: {
    fontSize: 16,
    color: "#999"
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20
  },
  button: {
    flex: 1,
    height: 50,
    backgroundColor: "#4CAF50",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 5
  },
  photoButton: {
    backgroundColor: "#4CAF50"
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold"
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#fff"
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#4CAF50",
    margin: 5
  },
  analyzingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center"
  },
  analyzingText: {
    color: "#fff",
    fontSize: 16,
    marginTop: 10
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center"
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    width: "80%",
    maxWidth: 400
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center"
  },
  modalText: {
    fontSize: 16,
    color: "#666",
    marginBottom: 20,
    textAlign: "center"
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between"
  },
  modalButton: {
    flex: 1,
    height: 45,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 5
  },
  cancelButton: {
    backgroundColor: "#ccc"
  },
  downloadButton: {
    backgroundColor: "#4CAF50"
  },
  modalButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold"
  },
  progressContainer: {
    alignItems: "center",
    marginVertical: 20
  },
  downloadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666"
  }
}) 