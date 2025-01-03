import React from "react"
import { render, fireEvent, waitFor } from "@testing-library/react-native"
import { CropAnalysisScreen } from "../CropAnalysisScreen"
import { useStores } from "../../models/helpers/useStores"
import * as ImagePicker from "expo-image-picker"

// Mock the useStores hook
jest.mock("../../models/helpers/useStores")
const mockUseStores = useStores as jest.Mock

// Mock expo-image-picker
jest.mock("expo-image-picker")

describe("CropAnalysisScreen", () => {
  const mockCropStore = {
    analyzeCrop: jest.fn(),
    isAnalyzing: false,
    currentAnalysis: null
  }

  beforeEach(() => {
    mockUseStores.mockReturnValue({ cropStore: mockCropStore })
    ;(ImagePicker.requestCameraPermissionsAsync as jest.Mock).mockResolvedValue({
      status: "granted"
    })
    ;(ImagePicker.launchCameraAsync as jest.Mock).mockResolvedValue({
      canceled: false,
      assets: [{ uri: "test-image-uri" }]
    })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it("renders camera permission request", async () => {
    const { getByText } = render(<CropAnalysisScreen />)
    expect(getByText("Take Photo")).toBeTruthy()
  })

  it("handles taking a photo", async () => {
    const { getByText } = render(<CropAnalysisScreen />)
    const takePhotoButton = getByText("Take Photo")

    fireEvent.press(takePhotoButton)

    await waitFor(() => {
      expect(ImagePicker.launchCameraAsync).toHaveBeenCalled()
    })
  })

  it("analyzes crop image", async () => {
    mockCropStore.analyzeCrop.mockResolvedValueOnce({
      disease: "Leaf Blight",
      confidence: 0.95,
      recommendations: ["Apply fungicide", "Remove affected leaves"]
    })

    const { getByText } = render(<CropAnalysisScreen />)
    const takePhotoButton = getByText("Take Photo")

    fireEvent.press(takePhotoButton)

    await waitFor(() => {
      expect(mockCropStore.analyzeCrop).toHaveBeenCalledWith("test-image-uri")
    })
  })

  it("shows error message when camera permission is denied", async () => {
    ;(ImagePicker.requestCameraPermissionsAsync as jest.Mock).mockResolvedValueOnce({
      status: "denied"
    })

    const { findByText } = render(<CropAnalysisScreen />)
    const errorMessage = await findByText(
      "Camera permission is required to analyze crops"
    )
    expect(errorMessage).toBeTruthy()
  })

  it("shows loading state during analysis", async () => {
    mockCropStore.isAnalyzing = true

    const { getByTestId } = render(<CropAnalysisScreen />)
    expect(getByTestId("loading-indicator")).toBeTruthy()
  })
}) 