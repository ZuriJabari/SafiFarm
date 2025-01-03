/// <reference types="jest" />

import React from "react"
import { render, fireEvent } from "@testing-library/react-native"
import { ProfileScreen } from "../ProfileScreen"
import { useStores } from "../../models/helpers/useStores"
import * as ImagePicker from "expo-image-picker"
import { User } from "../../models/User"
import { MarketplaceListing, Purchase } from "../../models/Marketplace"
import { EquipmentRental } from "../../models/Equipment"

// Mock the hooks and ImagePicker
jest.mock("../../models/helpers/useStores")
jest.mock("expo-image-picker")

const mockUseStores = useStores as jest.Mock

describe("ProfileScreen", () => {
  const mockUser: User = {
    id: "user1",
    name: "John Doe",
    email: "john@example.com",
    phone: "+256123456789",
    location: "Kampala",
    farmSize: 5,
    profileImage: "profile-image-url"
  }

  const mockUserStore = {
    user: mockUser,
    updateProfile: jest.fn(),
    isLoading: false
  }

  const mockMarketplaceStore = {
    userPurchases: [
      {
        id: "purchase1",
        productName: "Tomatoes",
        totalCost: 10000,
        quantity: 5,
        status: "completed",
        createdAt: new Date().toISOString()
      }
    ] as Purchase[],
    userListings: [
      {
        id: "listing1",
        name: "Maize Seeds",
        price: 5000,
        quantity: 100,
        images: ["image-url"]
      }
    ] as MarketplaceListing[]
  }

  const mockEquipmentStore = {
    userRentals: [
      {
        id: "rental1",
        equipmentName: "Tractor",
        totalCost: 100000,
        startDate: new Date().toISOString(),
        endDate: new Date().toISOString(),
        status: "completed"
      }
    ] as EquipmentRental[]
  }

  beforeEach(() => {
    mockUseStores.mockReturnValue({
      userStore: mockUserStore,
      marketplaceStore: mockMarketplaceStore,
      equipmentStore: mockEquipmentStore
    })
    ;(ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue({
      canceled: false,
      assets: [{ uri: "new-profile-image-url" }]
    })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it("renders user profile information", () => {
    const { getByText, getByTestId } = render(<ProfileScreen />)

    expect(getByText("John Doe")).toBeTruthy()
    expect(getByText("john@example.com")).toBeTruthy()
    expect(getByText("+256123456789")).toBeTruthy()
    expect(getByText("Kampala")).toBeTruthy()
    expect(getByTestId("profile-image")).toBeTruthy()
  })

  it("allows editing profile information", async () => {
    const { getByText, getByPlaceholderText } = render(<ProfileScreen />)
    const editButton = getByText("Edit Profile")

    fireEvent.press(editButton)

    const nameInput = getByPlaceholderText("Name")
    const phoneInput = getByPlaceholderText("Phone")

    fireEvent.changeText(nameInput, "Jane Doe")
    fireEvent.changeText(phoneInput, "+256987654321")

    const saveButton = getByText("Save Changes")
    fireEvent.press(saveButton)

    expect(mockUserStore.updateProfile).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Jane Doe",
        phone: "+256987654321"
      })
    )
  })

  it("displays purchase history", () => {
    const { getByText } = render(<ProfileScreen />)
    const purchasesTab = getByText("Purchases")

    fireEvent.press(purchasesTab)

    expect(getByText("Tomatoes")).toBeTruthy()
    expect(getByText("5 items")).toBeTruthy()
    expect(getByText("Completed")).toBeTruthy()
  })

  it("displays rental history", () => {
    const { getByText } = render(<ProfileScreen />)
    const rentalsTab = getByText("Rentals")

    fireEvent.press(rentalsTab)

    expect(getByText("Tractor")).toBeTruthy()
    expect(getByText("Completed")).toBeTruthy()
  })

  it("displays user listings", () => {
    const { getByText } = render(<ProfileScreen />)
    const listingsTab = getByText("Listings")

    fireEvent.press(listingsTab)

    expect(getByText("Maize Seeds")).toBeTruthy()
    expect(getByText("$5000")).toBeTruthy()
    expect(getByText("Stock: 100")).toBeTruthy()
  })

  it("handles profile image update", async () => {
    const { getByTestId } = render(<ProfileScreen />)
    const editButton = getByTestId("edit-profile-image")

    fireEvent.press(editButton)

    expect(ImagePicker.launchImageLibraryAsync).toHaveBeenCalled()
    expect(mockUserStore.updateProfile).toHaveBeenCalledWith(
      expect.objectContaining({
        profileImage: "new-profile-image-url"
      })
    )
  })

  it("shows loading state during profile update", () => {
    mockUserStore.isLoading = true
    const { getByTestId } = render(<ProfileScreen />)

    expect(getByTestId("loading-indicator")).toBeTruthy()
  })
}) 