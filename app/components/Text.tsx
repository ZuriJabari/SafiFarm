import React from "react"
import { Text as RNText, TextProps as RNTextProps, TextStyle } from "react-native"
import { colors } from "../theme"

type Presets = "default" | "bold" | "heading" | "subheading" | "formLabel" | "formHelper"

interface TextProps extends RNTextProps {
  text?: string
  style?: TextStyle
  preset?: Presets
  children?: React.ReactNode
}

export function Text(props: TextProps) {
  const { preset = "default", text, style: $styleOverride, children, ...rest } = props

  const content = text || children

  const $presets: Record<Presets, TextStyle> = {
    default: $baseText,
    bold: { ...$baseText, fontWeight: "bold" },
    heading: { ...$baseText, fontSize: 24, fontWeight: "bold", marginBottom: 8 },
    subheading: { ...$baseText, fontSize: 18, fontWeight: "bold", marginBottom: 4 },
    formLabel: { ...$baseText, fontSize: 14, fontWeight: "500" },
    formHelper: { ...$baseText, fontSize: 12, color: colors.textDim },
  }

  const $style = [$presets[preset], $styleOverride]

  return (
    <RNText {...rest} style={$style}>
      {content}
    </RNText>
  )
}

const $baseText: TextStyle = {
  fontSize: 16,
  color: colors.text,
} 