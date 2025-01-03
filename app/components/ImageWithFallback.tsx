import React, { useState } from "react"
import {
  Image,
  ImageProps,
  ActivityIndicator,
  View,
  StyleSheet,
  ImageSourcePropType,
  StyleProp,
  ViewStyle,
  ImageStyle,
} from "react-native"
import { colors } from "../theme"

interface ImageWithFallbackProps extends Omit<ImageProps, "source" | "style"> {
  source: { uri: string } | number
  fallbackSource: ImageSourcePropType
  size?: "small" | "medium" | "large"
  style?: StyleProp<ImageStyle>
  containerStyle?: StyleProp<ViewStyle>
}

export const ImageWithFallback: React.FC<ImageWithFallbackProps> = ({
  source,
  fallbackSource,
  style,
  containerStyle,
  size = "medium",
  ...props
}) => {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  return (
    <View style={[styles.container, containerStyle]}>
      <Image
        source={hasError ? fallbackSource : source}
        onLoadStart={() => setIsLoading(true)}
        onLoadEnd={() => setIsLoading(false)}
        onError={() => {
          setHasError(true)
          setIsLoading(false)
        }}
        style={[style, hasError && styles.fallbackImage]}
        {...props}
      />
      {isLoading && (
        <View style={[styles.loaderContainer, StyleSheet.absoluteFill]}>
          <ActivityIndicator
            size={size === "small" ? "small" : "large"}
            color={colors.primary}
          />
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: "relative",
  },
  loaderContainer: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
  },
  fallbackImage: {
    opacity: 0.7,
  },
}) 