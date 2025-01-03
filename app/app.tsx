import React, { useEffect, useState } from "react"
import { View, ActivityIndicator } from "react-native"
import { AppNavigator } from "./navigators/AppNavigator"
import { RootStoreProvider } from "./models/helpers/useStores"
import { setupRootStore } from "./models/helpers/setupRootStore"
import { GestureHandlerRootView } from "react-native-gesture-handler"
import * as tf from "@tensorflow/tfjs"
import { bundleResourceIO } from "@tensorflow/tfjs-react-native"

export const App = () => {
  const [rootStore, setRootStore] = useState<any>(undefined)

  useEffect(() => {
    ;(async () => {
      setupRootStore().then(setRootStore)
      await tf.ready()
    })()
  }, [])

  if (!rootStore) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    )
  }

  return (
    <RootStoreProvider value={rootStore}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <AppNavigator />
      </GestureHandlerRootView>
    </RootStoreProvider>
  )
}

export default App 