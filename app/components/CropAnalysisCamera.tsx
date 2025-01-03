import React from "react"
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Text,
  Platform,
} from "react-native"
import { Camera } from "expo-camera"
import * as ImageManipulator from "expo-image-manipulator"
import * as FileSystem from "expo-file-system"
import { designSystem as ds } from "../theme/design-system"
import { observer } from "mobx-react-lite"
import { useStores } from "../models/helpers/useStores"

interface Props {
  onCapture: (uri: string) => void
  onError: (error: string) => void
}

export const CropAnalysisCamera = observer(({ onCapture, onError }: Props) => {
  const { cropStore } = useStores()
  const [hasPermission, setHasPermission] = React.useState<boolean | null>(null)
  const [type, setType] = React.useState(Camera.Constants.Type.back)
  const [isProcessing, setIsProcessing] = React.useState(false)
  const cameraRef = React.useRef<Camera>(null)

  React.useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync()
      setHasPermission(status === "granted")
    })()
  }, [])

  const handleCapture = async () => {
    if (!cameraRef.current || isProcessing) return

    try {
      setIsProcessing(true)

      // Capture photo
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.7,
        skipProcessing: true,
      })

      // Optimize image
      const optimized = await ImageManipulator.manipulateAsync(
        photo.uri,
        [{ resize: { width: 1080 } }],
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
      )

      // Get file size
      const fileInfo = await FileSystem.getInfoAsync(optimized.uri)
      
      // If file is too large, compress more
      if (fileInfo.size > 1024 * 1024) {
        const moreOptimized = await ImageManipulator.manipulateAsync(
          optimized.uri,
          [],
          { compress: 0.6, format: ImageManipulator.SaveFormat.JPEG }
        )
        onCapture(moreOptimized.uri)
      } else {
        onCapture(optimized.uri)
      }
    } catch (error) {
      onError(error.message)
    } finally {
      setIsProcessing(false)
    }
  }

  if (hasPermission === null) {
    return <View style={styles.container} />
  }

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No access to camera</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <Camera style={styles.camera} type={type} ref={cameraRef}>
        <View style={styles.overlay}>
          {/* Guide Frame */}
          <View style={styles.guideFrame}>
            <Text style={styles.guideText}>
              Position the plant within the frame
            </Text>
          </View>

          {/* Controls */}
          <View style={styles.controls}>
            {/* Flip Camera */}
            <TouchableOpacity
              style={styles.button}
              onPress={() => {
                setType(
                  type === Camera.Constants.Type.back
                    ? Camera.Constants.Type.front
                    : Camera.Constants.Type.back
                )
              }}
            >
              <Image
                source={require("../assets/icons/flip-camera.png")}
                style={styles.buttonIcon}
              />
            </TouchableOpacity>

            {/* Capture Button */}
            <TouchableOpacity
              style={[styles.captureButton, isProcessing && styles.buttonDisabled]}
              onPress={handleCapture}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <ActivityIndicator color={ds.colors.neutral100} />
              ) : (
                <View style={styles.captureButtonInner} />
              )}
            </TouchableOpacity>

            {/* Placeholder for symmetry */}
            <View style={styles.button} />
          </View>
        </View>
      </Camera>
    </View>
  )
})

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ds.colors.background,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "space-between",
    padding: ds.spacing.md,
  },
  guideFrame: {
    flex: 1,
    margin: ds.spacing.xl,
    borderWidth: 2,
    borderColor: ds.colors.neutral100,
    borderRadius: ds.layout.borderRadius.md,
    justifyContent: "center",
    alignItems: "center",
  },
  guideText: {
    color: ds.colors.neutral100,
    fontSize: ds.typography.sizes.md,
    textAlign: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
    padding: ds.spacing.sm,
    borderRadius: ds.layout.borderRadius.sm,
  },
  controls: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: Platform.OS === "ios" ? ds.spacing.xl : ds.spacing.md,
  },
  button: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  buttonIcon: {
    width: 24,
    height: 24,
    tintColor: ds.colors.neutral100,
  },
  captureButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: ds.colors.neutral100,
    justifyContent: "center",
    alignItems: "center",
  },
  captureButtonInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: ds.colors.primary500,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  errorText: {
    color: ds.colors.error,
    fontSize: ds.typography.sizes.md,
    textAlign: "center",
    padding: ds.spacing.lg,
  },
})
