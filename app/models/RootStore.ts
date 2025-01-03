import { Instance, SnapshotOut, types } from "mobx-state-tree"
import { CropStoreModel } from "./CropStore"
import { PaymentStoreModel } from "./PaymentStore"

export const RootStoreModel = types
  .model("RootStore")
  .props({
    cropStore: types.optional(CropStoreModel, {}),
    paymentStore: types.optional(PaymentStoreModel, {})
  })
  .actions((self) => ({
    reset() {
      self.cropStore.reset()
      self.paymentStore.reset()
    }
  }))

export interface RootStore extends Instance<typeof RootStoreModel> {}
export interface RootStoreSnapshot extends SnapshotOut<typeof RootStoreModel> {} 