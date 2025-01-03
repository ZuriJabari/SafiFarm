import React from "react"
import { render, fireEvent, waitFor } from "@testing-library/react-native"
import { LoginScreen } from "../LoginScreen"
import { useStores } from "../../models/helpers/useStores"

// Mock the useStores hook
jest.mock("../../models/helpers/useStores")
const mockUseStores = useStores as jest.Mock

describe("LoginScreen", () => {
  const mockUserStore = {
    login: jest.fn(),
    isAuthenticated: false
  }

  beforeEach(() => {
    mockUseStores.mockReturnValue({ userStore: mockUserStore })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it("renders login form correctly", () => {
    const { getByPlaceholderText, getByText } = render(<LoginScreen />)

    expect(getByPlaceholderText("Email")).toBeTruthy()
    expect(getByPlaceholderText("Password")).toBeTruthy()
    expect(getByText("Login")).toBeTruthy()
  })

  it("handles login submission", async () => {
    const { getByPlaceholderText, getByText } = render(<LoginScreen />)

    const emailInput = getByPlaceholderText("Email")
    const passwordInput = getByPlaceholderText("Password")
    const loginButton = getByText("Login")

    fireEvent.changeText(emailInput, "test@example.com")
    fireEvent.changeText(passwordInput, "password123")
    fireEvent.press(loginButton)

    await waitFor(() => {
      expect(mockUserStore.login).toHaveBeenCalledWith(
        "test@example.com",
        "password123"
      )
    })
  })

  it("shows error message for invalid credentials", async () => {
    mockUserStore.login.mockRejectedValueOnce(new Error("Invalid credentials"))

    const { getByPlaceholderText, getByText, findByText } = render(<LoginScreen />)

    const emailInput = getByPlaceholderText("Email")
    const passwordInput = getByPlaceholderText("Password")
    const loginButton = getByText("Login")

    fireEvent.changeText(emailInput, "wrong@example.com")
    fireEvent.changeText(passwordInput, "wrongpass")
    fireEvent.press(loginButton)

    const errorMessage = await findByText("Invalid credentials")
    expect(errorMessage).toBeTruthy()
  })
}) 