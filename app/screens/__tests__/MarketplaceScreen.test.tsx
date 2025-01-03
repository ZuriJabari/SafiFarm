import React from "react"
import { render, fireEvent } from "@testing-library/react-native"
import { MarketplaceScreen } from "../MarketplaceScreen"
import { useStores } from "../../models/helpers/useStores"
import { useNavigation } from "@react-navigation/native"

// Mock the hooks
jest.mock("../../models/helpers/useStores")
jest.mock("@react-navigation/native")

const mockUseStores = useStores as jest.Mock
const mockNavigate = jest.fn()

describe("MarketplaceScreen", () => {
  const mockProducts = [
    {
      id: "1",
      name: "Tomatoes",
      description: "Fresh tomatoes",
      price: 2000,
      quantity: 50,
      category: "Vegetables",
      images: ["image-url"],
      sellerId: "seller1",
      status: "available"
    },
    {
      id: "2",
      name: "Maize Seeds",
      description: "High-quality maize seeds",
      price: 5000,
      quantity: 100,
      category: "Seeds",
      images: ["image-url"],
      sellerId: "seller2",
      status: "available"
    }
  ]

  const mockMarketplaceStore = {
    products: mockProducts,
    fetchProducts: jest.fn(),
    isLoading: false
  }

  beforeEach(() => {
    mockUseStores.mockReturnValue({ marketplaceStore: mockMarketplaceStore })
    ;(useNavigation as jest.Mock).mockReturnValue({ navigate: mockNavigate })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it("renders product list correctly", () => {
    const { getByText, getAllByTestId } = render(<MarketplaceScreen />)

    expect(getByText("Marketplace")).toBeTruthy()
    expect(getAllByTestId("product-item")).toHaveLength(2)
    expect(getByText("Tomatoes")).toBeTruthy()
    expect(getByText("Maize Seeds")).toBeTruthy()
  })

  it("navigates to product details on item press", () => {
    const { getAllByTestId } = render(<MarketplaceScreen />)
    const productItems = getAllByTestId("product-item")

    fireEvent.press(productItems[0])

    expect(mockNavigate).toHaveBeenCalledWith("ProductDetails", {
      productId: "1"
    })
  })

  it("filters products by search query", () => {
    const { getByPlaceholderText, queryByText } = render(<MarketplaceScreen />)
    const searchInput = getByPlaceholderText("Search products...")

    fireEvent.changeText(searchInput, "tomato")

    expect(queryByText("Tomatoes")).toBeTruthy()
    expect(queryByText("Maize Seeds")).toBeNull()
  })

  it("filters products by category", () => {
    const { getByText, queryByText } = render(<MarketplaceScreen />)
    const vegetablesFilter = getByText("Vegetables")

    fireEvent.press(vegetablesFilter)

    expect(queryByText("Tomatoes")).toBeTruthy()
    expect(queryByText("Maize Seeds")).toBeNull()
  })

  it("navigates to add product screen", () => {
    const { getByTestId } = render(<MarketplaceScreen />)
    const addButton = getByTestId("add-product-button")

    fireEvent.press(addButton)

    expect(mockNavigate).toHaveBeenCalledWith("AddProduct")
  })

  it("shows loading indicator when fetching products", () => {
    mockMarketplaceStore.isLoading = true
    const { getByTestId } = render(<MarketplaceScreen />)

    expect(getByTestId("loading-indicator")).toBeTruthy()
  })
}) 