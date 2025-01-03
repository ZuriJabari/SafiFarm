import React, { useState } from "react"
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert
} from "react-native"
import { observer } from "mobx-react-lite"
import { useStores } from "../models/helpers/useStores"

export const LoginScreen = observer(() => {
  const { userStore } = useStores()
  const [isLoading, setIsLoading] = useState(false)
  const [phoneNumber, setPhoneNumber] = useState("")
  const [verificationCode, setVerificationCode] = useState("")
  const [isVerificationSent, setIsVerificationSent] = useState(false)

  const handleSendVerification = async () => {
    if (!phoneNumber.trim()) {
      Alert.alert("Error", "Please enter a valid phone number")
      return
    }

    setIsLoading(true)
    try {
      // TODO: Implement phone verification logic
      setIsVerificationSent(true)
      Alert.alert("Success", "Verification code sent to your phone")
    } catch (error) {
      Alert.alert("Error", "Failed to send verification code")
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyCode = async () => {
    if (!verificationCode.trim()) {
      Alert.alert("Error", "Please enter the verification code")
      return
    }

    setIsLoading(true)
    try {
      // TODO: Implement verification code validation
      await userStore.setAuthToken("dummy-token") // Replace with actual token
      await userStore.setUser({
        id: "1",
        name: "Test User",
        email: "test@example.com",
        phone: phoneNumber,
        location: "Test Location",
        farmSize: 5,
        profileImage: null
      })
    } catch (error) {
      Alert.alert("Error", "Invalid verification code")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.content}>
        <Text style={styles.title}>SafiFarm</Text>
        <Text style={styles.subtitle}>Login to your account</Text>

        {!isVerificationSent ? (
          <>
            <TextInput
              style={styles.input}
              placeholder="Phone Number"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              keyboardType="phone-pad"
              autoCapitalize="none"
            />
            <TouchableOpacity
              style={styles.button}
              onPress={handleSendVerification}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Send Verification Code</Text>
              )}
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TextInput
              style={styles.input}
              placeholder="Verification Code"
              value={verificationCode}
              onChangeText={setVerificationCode}
              keyboardType="number-pad"
              autoCapitalize="none"
            />
            <TouchableOpacity
              style={styles.button}
              onPress={handleVerifyCode}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Verify Code</Text>
              )}
            </TouchableOpacity>
          </>
        )}
      </View>
    </KeyboardAvoidingView>
  )
})

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff"
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#4CAF50",
    marginBottom: 10
  },
  subtitle: {
    fontSize: 18,
    color: "#666",
    marginBottom: 30
  },
  input: {
    width: "100%",
    height: 50,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 15,
    fontSize: 16
  },
  button: {
    width: "100%",
    height: 50,
    backgroundColor: "#4CAF50",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold"
  }
}) 