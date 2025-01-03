import { Dimensions, Platform } from "react-native"
import { palette } from "./palette"

const { width, height } = Dimensions.get("window")

export const designSystem = {
  // Typography
  typography: {
    sizes: {
      xs: 12,
      sm: 14,
      md: 16,
      lg: 18,
      xl: 20,
      xxl: 24,
      xxxl: 32,
    },
    families: {
      primary: Platform.select({
        ios: "SF Pro Text",
        android: "Roboto",
      }),
      primaryBold: Platform.select({
        ios: "SF Pro Text Bold",
        android: "Roboto-Bold",
      }),
    },
  },

  // Spacing
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },

  // Layout
  layout: {
    screenWidth: width,
    screenHeight: height,
    maxContentWidth: 500,
    borderRadius: {
      sm: 4,
      md: 8,
      lg: 16,
      xl: 24,
    },
  },

  // Colors (extending palette)
  colors: {
    ...palette,
    background: palette.neutral100,
    backgroundDim: palette.neutral200,
    text: palette.neutral900,
    textDim: palette.neutral600,
    border: palette.neutral300,
    success: palette.primary500,
    error: palette.angry500,
    warning: palette.secondary500,
  },

  // Shadows
  shadows: {
    sm: {
      shadowColor: palette.neutral900,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    md: {
      shadowColor: palette.neutral900,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 4,
      elevation: 4,
    },
    lg: {
      shadowColor: palette.neutral900,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 8,
    },
  },

  // Animation presets
  animations: {
    fast: 200,
    normal: 300,
    slow: 500,
    spring: {
      damping: 20,
      mass: 1,
      stiffness: 200,
    },
  },

  // Offline states
  offline: {
    colors: {
      background: palette.neutral200,
      text: palette.neutral600,
      border: palette.neutral400,
    },
    opacity: 0.8,
  },

  // Loading states
  loading: {
    colors: {
      primary: palette.primary300,
      secondary: palette.neutral300,
    },
    shimmer: {
      duration: 1000,
      colors: [
        palette.neutral200,
        palette.neutral300,
        palette.neutral200,
      ],
    },
  },
}
