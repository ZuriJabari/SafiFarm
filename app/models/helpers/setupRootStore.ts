import { onSnapshot } from "mobx-state-tree"
import { RootStoreModel, RootStore } from "../RootStore"
import * as storage from "../../utils/storage"

const ROOT_STATE_STORAGE_KEY = "root"

export async function setupRootStore() {
  let rootStore: RootStore
  let data: any

  try {
    // Load the last persisted state
    data = await storage.load(ROOT_STATE_STORAGE_KEY)
    rootStore = RootStoreModel.create(data)
  } catch (e) {
    // If there's any problems loading, then let's at least create a fresh store
    rootStore = RootStoreModel.create({})
  }

  // Track changes & save to storage
  onSnapshot(rootStore, (snapshot) => {
    storage.save(ROOT_STATE_STORAGE_KEY, snapshot)
  })

  return rootStore
} 