import React from "react"
import { View, StyleSheet, Animated, Text } from "react-native"
import { designSystem as ds } from "../theme/design-system"

interface Props {
  message?: string
  type?: "overlay" | "inline"
  shimmer?: boolean
}

export const LoadingState = ({ 
  message = "Loading...", 
  type = "overlay",
  shimmer = true 
}: Props) => {
  const shimmerAnim = React.useRef(new Animated.Value(0)).current

  React.useEffect(() => {
    if (shimmer) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(shimmerAnim, {
            toValue: 1,
            duration: ds.loading.shimmer.duration,
            useNativeDriver: true,
          }),
          Animated.timing(shimmerAnim, {
            toValue: 0,
            duration: ds.loading.shimmer.duration,
            useNativeDriver: true,
          }),
        ])
      ).start()
    }
  }, [shimmer])

  const shimmerTranslate = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-200, 200],
  })

  const renderContent = () => (
    <View style={styles.content}>
      <View style={styles.spinner}>
        <View style={styles.spinnerInner}>
          {shimmer && (
            <Animated.View
              style={[
                styles.shimmer,
                {
                  transform: [{ translateX: shimmerTranslate }],
                },
              ]}
            />
          )}
        </View>
      </View>
      {message && <Text style={styles.message}>{message}</Text>}
    </View>
  )

  if (type === "overlay") {
    return <View style={styles.overlay}>{renderContent()}</View>
  }

  return <View style={styles.inline}>{renderContent()}</View>
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.9)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999,
  },
  inline: {
    padding: ds.spacing.lg,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    alignItems: "center",
  },
  spinner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: ds.loading.colors.secondary,
    overflow: "hidden",
  },
  spinnerInner: {
    width: "100%",
    height: "100%",
    backgroundColor: ds.loading.colors.primary,
  },
  shimmer: {
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(255,255,255,0.3)",
    transform: [{ skewX: "-20deg" }],
  },
  message: {
    marginTop: ds.spacing.md,
    color: ds.colors.textDim,
    fontSize: ds.typography.sizes.sm,
    fontFamily: ds.typography.families.primary,
  },
})
