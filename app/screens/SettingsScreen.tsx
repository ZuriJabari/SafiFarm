import React, { useState } from "react"
import { View, ViewStyle, TextStyle, Switch, Alert } from "react-native"
import { Screen, Text, Button } from "../components"
import { colors, spacing } from "../theme"
import { useStores } from "../models"
import { observer } from "mobx-react-lite"
import { MaterialIcons } from "@expo/vector-icons"

export const SettingsScreen = observer(function SettingsScreen() {
  const { authenticationStore } = useStores()
  const [pushNotifications, setPushNotifications] = useState(true)
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [darkMode, setDarkMode] = useState(false)
  const [locationServices, setLocationServices] = useState(true)

  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Logout",
          style: "destructive",
          onPress: () => authenticationStore.logout(),
        },
      ],
    )
  }

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "Are you sure you want to delete your account? This action cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            // TODO: Implement account deletion
            Alert.alert("Account deleted successfully")
            authenticationStore.logout()
          },
        },
      ],
    )
  }

  return (
    <Screen preset="scroll" contentContainerStyle={$container}>
      <Text preset="heading" text="Settings" style={$heading} />

      <View style={$section}>
        <Text preset="subheading" text="Notifications" style={$sectionHeading} />
        <View style={$settingRow}>
          <Text text="Push Notifications" />
          <Switch
            value={pushNotifications}
            onValueChange={setPushNotifications}
            trackColor={{ false: colors.palette.neutral400, true: colors.palette.primary100 }}
            thumbColor={pushNotifications ? colors.palette.primary500 : colors.palette.neutral300}
          />
        </View>
        <View style={$settingRow}>
          <Text text="Email Notifications" />
          <Switch
            value={emailNotifications}
            onValueChange={setEmailNotifications}
            trackColor={{ false: colors.palette.neutral400, true: colors.palette.primary100 }}
            thumbColor={emailNotifications ? colors.palette.primary500 : colors.palette.neutral300}
          />
        </View>
      </View>

      <View style={$section}>
        <Text preset="subheading" text="Appearance" style={$sectionHeading} />
        <View style={$settingRow}>
          <Text text="Dark Mode" />
          <Switch
            value={darkMode}
            onValueChange={setDarkMode}
            trackColor={{ false: colors.palette.neutral400, true: colors.palette.primary100 }}
            thumbColor={darkMode ? colors.palette.primary500 : colors.palette.neutral300}
          />
        </View>
      </View>

      <View style={$section}>
        <Text preset="subheading" text="Privacy" style={$sectionHeading} />
        <View style={$settingRow}>
          <Text text="Location Services" />
          <Switch
            value={locationServices}
            onValueChange={setLocationServices}
            trackColor={{ false: colors.palette.neutral400, true: colors.palette.primary100 }}
            thumbColor={locationServices ? colors.palette.primary500 : colors.palette.neutral300}
          />
        </View>
      </View>

      <View style={$section}>
        <Text preset="subheading" text="Account" style={$sectionHeading} />
        <Button
          text="Change Password"
          preset="secondary"
          style={$button}
          LeftAccessory={() => <MaterialIcons name="lock" size={20} color={colors.text} />}
          onPress={() => Alert.alert("Change Password", "Feature coming soon")}
        />
        <Button
          text="Logout"
          preset="secondary"
          style={$button}
          LeftAccessory={() => <MaterialIcons name="logout" size={20} color={colors.text} />}
          onPress={handleLogout}
        />
        <Button
          text="Delete Account"
          preset="danger"
          style={$button}
          LeftAccessory={() => <MaterialIcons name="delete-forever" size={20} color={colors.palette.angry500} />}
          onPress={handleDeleteAccount}
        />
      </View>
    </Screen>
  )
})

const $container: ViewStyle = {
  paddingHorizontal: spacing.lg,
  paddingTop: spacing.lg,
}

const $heading: TextStyle = {
  marginBottom: spacing.lg,
}

const $section: ViewStyle = {
  marginBottom: spacing.xl,
}

const $sectionHeading: TextStyle = {
  marginBottom: spacing.md,
}

const $settingRow: ViewStyle = {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  paddingVertical: spacing.xs,
  marginBottom: spacing.xs,
}

const $button: ViewStyle = {
  marginBottom: spacing.xs,
} 