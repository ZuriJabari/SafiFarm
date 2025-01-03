import React from "react"
import { View, Text, StyleSheet, Animated } from "react-native"
import { useNetInfo } from "@react-native-community/netinfo"
import { designSystem as ds } from "../theme/design-system"

export const OfflineIndicator = () => {
  const netInfo = useNetInfo()
  const translateY = React.useRef(new Animated.Value(-50)).current
  const [visible, setVisible] = React.useState(false)

  React.useEffect(() => {
    if (!netInfo.isConnected && !visible) {
      setVisible(true)
      Animated.spring(translateY, {
        toValue: 0,
        ...ds.animations.spring,
        useNativeDriver: true,
      }).start()
    } else if (netInfo.isConnected && visible) {
      Animated.timing(translateY, {
        toValue: -50,
        duration: ds.animations.normal,
        useNativeDriver: true,
      }).start(() => setVisible(false))
    }
  }, [netInfo.isConnected])

  if (!visible) return null

  return (
    <Animated.View style={[styles.container, { transform: [{ translateY }] }]}>
      <View style={styles.content}>
        <Text style={styles.text}>
          You're offline. Some features may be limited.
        </Text>
      </View>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: ds.colors.warning,
    zIndex: 999,
  },
  content: {
    paddingVertical: ds.spacing.sm,
    paddingHorizontal: ds.spacing.md,
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    color: ds.colors.neutral100,
    fontSize: ds.typography.sizes.sm,
    fontFamily: ds.typography.families.primary,
    textAlign: "center",
  },
})
