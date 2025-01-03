import React from "react"
import { render, fireEvent } from "@testing-library/react-native"
import { EquipmentScreen } from "../EquipmentScreen"
import { useStores } from "../../models/helpers/useStores"
import { useNavigation } from "@react-navigation/native"

// Mock the hooks
jest.mock("../../models/helpers/useStores")
jest.mock("@react-navigation/native")

const mockUseStores = useStores as jest.Mock
const mockNavigate = jest.fn()

describe("EquipmentScreen", () => {
  const mockEquipment = [
    {
      id: "1",
      name: "Tractor",
      description: "Modern farming tractor",
      type: "Heavy Machinery",
      dailyRate: 100000,
      availability: true,
      condition: "Excellent",
      images: ["image-url"],
      ownerId: "owner1"
    },
    {
      id: "2",
      name: "Water Pump",
      description: "High-capacity irrigation pump",
      type: "Irrigation",
      dailyRate: 50000,
      availability: true,
      condition: "Good",
      images: ["image-url"],
      ownerId: "owner2"
    }
  ]

  const mockEquipmentStore = {
    equipment: mockEquipment,
    fetchEquipment: jest.fn(),
    isLoading: false
  }

  beforeEach(() => {
    mockUseStores.mockReturnValue({ equipmentStore: mockEquipmentStore })
    ;(useNavigation as jest.Mock).mockReturnValue({ navigate: mockNavigate })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it("renders equipment list correctly", () => {
    const { getByText, getAllByTestId } = render(<EquipmentScreen />)

    expect(getByText("Equipment Rental")).toBeTruthy()
    expect(getAllByTestId("equipment-item")).toHaveLength(2)
    expect(getByText("Tractor")).toBeTruthy()
    expect(getByText("Water Pump")).toBeTruthy()
  })

  it("navigates to equipment details on item press", () => {
    const { getAllByTestId } = render(<EquipmentScreen />)
    const equipmentItems = getAllByTestId("equipment-item")

    fireEvent.press(equipmentItems[0])

    expect(mockNavigate).toHaveBeenCalledWith("EquipmentDetails", {
      equipmentId: "1"
    })
  })

  it("filters equipment by search query", () => {
    const { getByPlaceholderText, queryByText } = render(<EquipmentScreen />)
    const searchInput = getByPlaceholderText("Search equipment...")

    fireEvent.changeText(searchInput, "tractor")

    expect(queryByText("Tractor")).toBeTruthy()
    expect(queryByText("Water Pump")).toBeNull()
  })

  it("filters equipment by type", () => {
    const { getByText, queryByText } = render(<EquipmentScreen />)
    const heavyMachineryFilter = getByText("Heavy Machinery")

    fireEvent.press(heavyMachineryFilter)

    expect(queryByText("Tractor")).toBeTruthy()
    expect(queryByText("Water Pump")).toBeNull()
  })

  it("filters equipment by availability", () => {
    mockEquipment[0].availability = false
    const { getByText, queryByText } = render(<EquipmentScreen />)
    const availableFilter = getByText("Available")

    fireEvent.press(availableFilter)

    expect(queryByText("Tractor")).toBeNull()
    expect(queryByText("Water Pump")).toBeTruthy()
  })

  it("shows loading indicator when fetching equipment", () => {
    mockEquipmentStore.isLoading = true
    const { getByTestId } = render(<EquipmentScreen />)

    expect(getByTestId("loading-indicator")).toBeTruthy()
  })
}) 