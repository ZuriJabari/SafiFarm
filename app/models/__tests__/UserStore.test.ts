import { Instance } from "mobx-state-tree"
import { UserStore, UserStoreModel } from "../UserStore"

describe("UserStore", () => {
  let store: Instance<typeof UserStoreModel>

  beforeEach(() => {
    store = UserStoreModel.create({
      user: null,
      isAuthenticated: false
    })
  })

  it("should start with no authenticated user", () => {
    expect(store.isAuthenticated).toBeFalsy()
    expect(store.user).toBeNull()
  })

  it("should handle login success", async () => {
    await store.login("test@example.com", "password123")
    expect(store.isAuthenticated).toBeTruthy()
    expect(store.user).toBeTruthy()
    expect(store.user?.email).toBe("test@example.com")
  })

  it("should handle logout", () => {
    store.logout()
    expect(store.isAuthenticated).toBeFalsy()
    expect(store.user).toBeNull()
  })

  it("should update user profile", async () => {
    await store.login("test@example.com", "password123")
    await store.updateProfile({
      name: "Test User",
      email: "test@example.com",
      phone: "+256123456789",
      location: "Kampala"
    })
    expect(store.user?.name).toBe("Test User")
    expect(store.user?.phone).toBe("+256123456789")
    expect(store.user?.location).toBe("Kampala")
  })
}) 