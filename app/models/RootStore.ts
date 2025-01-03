import { Instance, SnapshotOut, types } from "mobx-state-tree"
import { CropStoreModel } from "./CropStore"
import { PaymentStoreModel } from "./PaymentStore"
import { UserStoreModel } from "./UserStore"
import { MarketplaceStoreModel } from "./MarketplaceStore"
import { EquipmentStoreModel } from "./EquipmentStore"

/**
 * A RootStore model.
 */
export const RootStoreModel = types
  .model("RootStore")
  .props({
    cropStore: types.optional(CropStoreModel, {} as any),
    paymentStore: types.optional(PaymentStoreModel, {} as any),
    userStore: types.optional(UserStoreModel, {} as any),
    marketplaceStore: types.optional(MarketplaceStoreModel, {} as any),
    equipmentStore: types.optional(EquipmentStoreModel, {} as any)
  })
  .actions((self) => ({
    afterCreate() {
      // Set up references between stores
      self.marketplaceStore.setRootStore(self)
      self.equipmentStore.setRootStore(self)
    },
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