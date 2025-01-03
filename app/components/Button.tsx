import React from "react"
import {
  Pressable,
  PressableProps,
  PressableStateCallbackType,
  TextStyle,
  ViewStyle,
} from "react-native"
import { colors, palette } from "../theme"
import { Text } from "./Text"

type Presets = "primary" | "secondary" | "danger"

interface ButtonProps extends PressableProps {
  text: string
  style?: ViewStyle
  textStyle?: TextStyle
  preset?: Presets
  LeftAccessory?: React.ComponentType
  RightAccessory?: React.ComponentType
}

export function Button(props: ButtonProps) {
  const {
    text,
    style: $viewStyleOverride,
    textStyle: $textStyleOverride,
    preset = "primary",
    LeftAccessory,
    RightAccessory,
    ...rest
  } = props

  const $viewPresets: Record<Presets, ViewStyle> = {
    primary: {
      backgroundColor: colors.primary,
      borderRadius: 8,
      height: 48,
      paddingHorizontal: 24,
      paddingVertical: 12,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
    },
    secondary: {
      backgroundColor: colors.background,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      height: 48,
      paddingHorizontal: 24,
      paddingVertical: 12,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
    },
    danger: {
      backgroundColor: palette.angry500,
      borderRadius: 8,
      height: 48,
      paddingHorizontal: 24,
      paddingVertical: 12,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
    },
  }

  const $textPresets: Record<Presets, TextStyle> = {
    primary: {
      color: colors.white,
      fontSize: 16,
      fontWeight: "600",
      textAlign: "center",
    },
    secondary: {
      color: colors.text,
      fontSize: 16,
      fontWeight: "600",
      textAlign: "center",
    },
    danger: {
      color: colors.white,
      fontSize: 16,
      fontWeight: "600",
      textAlign: "center",
    },
  }

  function $viewStyle({ pressed }: PressableStateCallbackType) {
    return [
      $viewPresets[preset],
      { opacity: pressed ? 0.8 : 1 },
      $viewStyleOverride,
    ]
  }

  return (
    <Pressable style={$viewStyle} {...rest}>
      {LeftAccessory && <LeftAccessory />}
      <Text
        text={text}
        style={[$textPresets[preset], { marginLeft: LeftAccessory ? 8 : 0, marginRight: RightAccessory ? 8 : 0 }, $textStyleOverride]}
      />
      {RightAccessory && <RightAccessory />}
    </Pressable>
  )
} 