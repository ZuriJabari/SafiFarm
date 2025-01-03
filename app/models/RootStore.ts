import { Instance, SnapshotOut, types } from "mobx-state-tree"
import { CropStoreModel } from "./CropStore"
import { PaymentStoreModel } from "./PaymentStore"
import { UserStoreModel } from "./UserStore"
import { MarketplaceStoreModel } from "./MarketplaceStore"
import { EquipmentStoreModel } from "./EquipmentStore"

export const RootStoreModel = types
  .model("RootStore")
  .props({
    cropStore: types.optional(CropStoreModel, {}),
    paymentStore: types.optional(PaymentStoreModel, {}),
    userStore: types.optional(UserStoreModel, {}),
    marketplaceStore: types.optional(MarketplaceStoreModel, {}),
    equipmentStore: types.optional(EquipmentStoreModel, {})
  })
  .actions((self) => ({
    reset() {
      self.cropStore.reset()
      self.paymentStore.reset()
      self.userStore.reset()
      self.marketplaceStore.reset()
      self.equipmentStore.reset()
    }
  }))

export interface RootStore extends Instance<typeof RootStoreModel> {}
export interface RootStoreSnapshot extends SnapshotOut<typeof RootStoreModel> {}