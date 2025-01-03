import { Instance, SnapshotOut, types } from "mobx-state-tree"
import AsyncStorage from "@react-native-async-storage/async-storage"

export const UserModel = types.model("User").props({
  id: types.identifier,
  email: types.string,
  name: types.string,
  phone: types.string,
  location: types.maybe(types.string),
  farmSize: types.maybe(types.number),
  profileImage: types.maybe(types.string)
})

export const UserStoreModel = types
  .model("UserStore")
  .props({
    user: types.maybe(UserModel),
    isAuthenticated: types.optional(types.boolean, false),
    authToken: types.maybe(types.string)
  })
  .views((self) => ({
    get isLoggedIn() {
      return !!self.authToken && self.isAuthenticated
    }
  }))
  .actions((self) => ({
    setUser(user: typeof UserModel.Type) {
      self.user = user
    },
    setAuthToken(token: string) {
      self.authToken = token
      self.isAuthenticated = true
      AsyncStorage.setItem("authToken", token)
    },
    async logout() {
      self.user = undefined
      self.authToken = undefined
      self.isAuthenticated = false
      await AsyncStorage.removeItem("authToken")
    },
    reset() {
      self.user = undefined
      self.authToken = undefined
      self.isAuthenticated = false
    }
  }))

export interface UserStore extends Instance<typeof UserStoreModel> {}
export interface UserStoreSnapshot extends SnapshotOut<typeof UserStoreModel> {} 