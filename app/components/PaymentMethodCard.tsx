import React from "react"
import { View, StyleSheet, TouchableOpacity } from "react-native"
import { Text } from "./Text"
import { colors, spacing } from "../theme"
import { PaymentMethod } from "../services/api/api.types"

interface PaymentMethodCardProps {
  paymentMethod: PaymentMethod
  onSelect?: () => void
  selected?: boolean
}

export function PaymentMethodCard({ paymentMethod, onSelect, selected }: PaymentMethodCardProps) {
  const providerLogos = {
    mtn: require("../assets/mtn-logo.png"),
    airtel: require("../assets/airtel-logo.png"),
  }

  return (
    <TouchableOpacity
      style={[styles.container, selected && styles.selected]}
      onPress={onSelect}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        <View style={styles.providerInfo}>
          <Image
            source={providerLogos[paymentMethod.provider]}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text
            text={paymentMethod.provider.toUpperCase()}
            style={styles.providerName}
            preset="bold"
          />
        </View>
        <Text text={paymentMethod.phone_number} style={styles.phoneNumber} />
      </View>
      {selected && (
        <View style={styles.checkmark}>
          <Icon icon="checkmark" size={20} color={colors.primary} />
        </View>
      )}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: spacing.medium,
    marginVertical: spacing.tiny,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
  },
  selected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryBackground,
  },
  content: {
    flex: 1,
  },
  providerInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.tiny,
  },
  logo: {
    width: 32,
    height: 32,
    marginRight: spacing.tiny,
  },
  providerName: {
    color: colors.text,
    fontSize: 16,
  },
  phoneNumber: {
    color: colors.textDim,
    fontSize: 14,
  },
  checkmark: {
    marginLeft: spacing.small,
  },
})
