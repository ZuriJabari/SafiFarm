import React, { useState, useEffect } from "react"
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  ScrollView,
  Alert
} from "react-native"
import { observer } from "mobx-react-lite"
import { useNavigation, useRoute } from "@react-navigation/native"
import { Camera } from "expo-camera"
import * as ImagePicker from "expo-image-picker"
import { useStores } from "../models/helpers/useStores"
import { manipulateAsync, SaveFormat } from "expo-image-manipulator"

export const CropAnalysisScreen = observer(() => {
  const navigation = useNavigation()
  const route = useRoute()
  const { cropStore } = useStores()
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)
  const [isCameraVisible, setIsCameraVisible] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync()
      setHasPermission(status === "granted")
    })()
  }, [])

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
      await cropStore.analyzeCrop(route.params?.cropId || Date.now().toString(), imageUri)
      navigation.navigate("CropDetails", { cropId: route.params?.cropId })
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
        <Text style={styles.text}>No access to camera</Text>
      </View>
    )
  }

  if (isCameraVisible) {
    return (
      <Camera
        style={styles.camera}
        type={Camera.Constants.Type.back}
        onBarCodeScanned={undefined}
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
              if (camera) {
                const photo = await camera.takePictureAsync()
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
    )
  }

  return (
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
  }
}) 