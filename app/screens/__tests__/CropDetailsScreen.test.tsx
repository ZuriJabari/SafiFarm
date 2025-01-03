import React from "react"
import { render, fireEvent, Share } from "@testing-library/react-native"
import { CropDetailsScreen } from "../CropDetailsScreen"
import { useStores } from "../../models/helpers/useStores"
import { useRoute } from "@react-navigation/native"

// Mock the hooks and Share API
jest.mock("../../models/helpers/useStores")
jest.mock("@react-navigation/native")
jest.mock("react-native/Libraries/Share/Share", () => ({
  share: jest.fn()
}))

const mockUseStores = useStores as jest.Mock
const mockShare = Share.share as jest.Mock

describe("CropDetailsScreen", () => {
  const mockAnalysis = {
    id: "1",
    cropId: "crop1",
    disease: "Leaf Blight",
    confidence: 0.95,
    recommendations: [
      "Apply fungicide",
      "Remove affected leaves",
      "Improve air circulation"
    ],
    imageUri: "test-image-uri",
    createdAt: new Date().toISOString()
  }

  const mockCropStore = {
    currentAnalysis: mockAnalysis,
    isLoading: false,
    fetchAnalysis: jest.fn()
  }

  beforeEach(() => {
    mockUseStores.mockReturnValue({ cropStore: mockCropStore })
    ;(useRoute as jest.Mock).mockReturnValue({
      params: { cropId: "crop1" }
    })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it("renders analysis details correctly", () => {
    const { getByText, getByTestId } = render(<CropDetailsScreen />)

    expect(getByText("Leaf Blight")).toBeTruthy()
    expect(getByText("Confidence: 95%")).toBeTruthy()
    expect(getByTestId("analysis-image")).toBeTruthy()
  })

  it("displays all recommendations", () => {
    const { getByText } = render(<CropDetailsScreen />)

    mockAnalysis.recommendations.forEach((recommendation) => {
      expect(getByText(recommendation)).toBeTruthy()
    })
  })

  it("handles sharing analysis results", async () => {
    const { getByTestId } = render(<CropDetailsScreen />)
    const shareButton = getByTestId("share-button")

    fireEvent.press(shareButton)

    expect(mockShare).toHaveBeenCalledWith({
      title: "Crop Analysis Results",
      message: expect.stringContaining("Disease: Leaf Blight")
    })
  })

  it("shows loading state while fetching analysis", () => {
    mockCropStore.isLoading = true
    const { getByTestId } = render(<CropDetailsScreen />)

    expect(getByTestId("loading-indicator")).toBeTruthy()
  })

  it("displays error message when analysis is not found", () => {
    mockCropStore.currentAnalysis = null
    const { getByText } = render(<CropDetailsScreen />)

    expect(getByText("Analysis not found")).toBeTruthy()
  })

  it("formats date correctly", () => {
    const { getByTestId } = render(<CropDetailsScreen />)
    const dateElement = getByTestId("analysis-date")

    expect(dateElement.props.children).toMatch(
      /\w+ \d{1,2}, \d{4} at \d{1,2}:\d{2} (AM|PM)/
    )
  })
}) 