import { Instance, SnapshotOut, types } from "mobx-state-tree"
import { UserStoreModel } from "./UserStore"
import { CropStoreModel } from "./CropStore"
import { MarketplaceStoreModel } from "./MarketplaceStore"
import { EquipmentStoreModel } from "./EquipmentStore"

export const RootStoreModel = types
  .model("RootStore")
  .props({
    userStore: types.optional(UserStoreModel, {}),
    cropStore: types.optional(CropStoreModel, {}),
    marketplaceStore: types.optional(MarketplaceStoreModel, {}),
    equipmentStore: types.optional(EquipmentStoreModel, {})
  })
  .actions((self) => ({
    reset() {
      self.userStore.reset()
      self.cropStore.reset()
      self.marketplaceStore.reset()
      self.equipmentStore.reset()
    }
  }))

export interface RootStore extends Instance<typeof RootStoreModel> {}
export interface RootStoreSnapshot extends SnapshotOut<typeof RootStoreModel> {} 