import React from "react"
import { KeyboardAvoidingView, Platform, ScrollView, StatusBar, View, ViewStyle } from "react-native"
import { colors } from "../theme"
import { ExtendedEdge, useSafeAreaInsets } from "react-native-safe-area-context"

interface ScreenProps {
  children?: React.ReactNode
  style?: ViewStyle
  contentContainerStyle?: ViewStyle
  preset?: "fixed" | "scroll"
  safeAreaEdges?: ExtendedEdge[]
  backgroundColor?: string
  statusBarStyle?: "light" | "dark"
}

const isIos = Platform.OS === "ios"

function ScreenWithoutScrolling(props: ScreenProps) {
  const { style, children, safeAreaEdges = ["top"], backgroundColor = colors.background } = props
  const insets = useSafeAreaInsets()

  const $containerInsets: ViewStyle = {
    paddingTop: safeAreaEdges?.includes("top") ? insets.top : 0,
    paddingBottom: safeAreaEdges?.includes("bottom") ? insets.bottom : 0,
    paddingLeft: safeAreaEdges?.includes("left") ? insets.left : 0,
    paddingRight: safeAreaEdges?.includes("right") ? insets.right : 0,
  }

  return (
    <View style={[$container, { backgroundColor }, $containerInsets, style]}>
      {children}
    </View>
  )
}

function ScreenWithScrolling(props: ScreenProps) {
  const {
    children,
    style,
    contentContainerStyle,
    safeAreaEdges = ["top"],
    backgroundColor = colors.background,
  } = props
  const insets = useSafeAreaInsets()

  const $containerInsets: ViewStyle = {
    paddingTop: safeAreaEdges?.includes("top") ? insets.top : 0,
    paddingBottom: safeAreaEdges?.includes("bottom") ? insets.bottom : 0,
    paddingLeft: safeAreaEdges?.includes("left") ? insets.left : 0,
    paddingRight: safeAreaEdges?.includes("right") ? insets.right : 0,
  }

  return (
    <ScrollView
      style={[$container, { backgroundColor }, style]}
      contentContainerStyle={[$containerInsets, contentContainerStyle]}
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  )
}

export function Screen(props: ScreenProps) {
  const { preset = "scroll", statusBarStyle = "dark" } = props

  const Wrapper = preset === "scroll" ? ScreenWithScrolling : ScreenWithoutScrolling

  return (
    <KeyboardAvoidingView
      style={$keyboardAvoidingView}
      behavior={isIos ? "padding" : undefined}
      keyboardVerticalOffset={0}
    >
      <StatusBar
        barStyle={statusBarStyle === "dark" ? "dark-content" : "light-content"}
        backgroundColor={colors.background}
      />
      <Wrapper {...props} />
    </KeyboardAvoidingView>
  )
}

const $container: ViewStyle = {
  flex: 1,
  height: "100%",
  width: "100%",
}

const $keyboardAvoidingView: ViewStyle = {
  flex: 1,
} 