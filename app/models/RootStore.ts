import { Instance, SnapshotOut, types } from "mobx-state-tree"
import { CropStoreModel } from "./CropStore"
import { PaymentStoreModel } from "./PaymentStore"
import { UserStoreModel } from "./UserStore"

export const RootStoreModel = types
  .model("RootStore")
  .props({
    cropStore: types.optional(CropStoreModel, {}),
    paymentStore: types.optional(PaymentStoreModel, {}),
    userStore: types.optional(UserStoreModel, {})
  })
  .actions((self) => ({
    reset() {
      self.cropStore.reset()
      self.paymentStore.reset()
      self.userStore.reset()
    }
  }))

export interface RootStore extends Instance<typeof RootStoreModel> {}
export interface RootStoreSnapshot extends SnapshotOut<typeof RootStoreModel> {}