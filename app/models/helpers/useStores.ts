import { createContext, useContext } from "react"
import { RootStore } from "../RootStore"

const RootStoreContext = createContext<RootStore>({} as RootStore)

export const RootStoreProvider = RootStoreContext.Provider

export function useStores() {
  const store = useContext(RootStoreContext)
  if (store === null) {
    throw new Error("Store cannot be null, please add a context provider")
  }
  return store
} 