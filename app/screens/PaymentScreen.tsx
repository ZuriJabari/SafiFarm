import React, { useState } from "react"
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from "react-native"
import { observer } from "mobx-react-lite"
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native"
import { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { useStores } from "../models/helpers/useStores"
import { PaymentProvider, paymentService } from "../services/PaymentService"
import { AppStackParamList } from "../navigators/AppNavigator"

type PaymentScreenNavigationProp = NativeStackNavigationProp<
  AppStackParamList,
  "Payment"
>

type PaymentScreenRouteProp = RouteProp<AppStackParamList, "Payment">

interface PaymentScreenProps {
  amount?: number
  description?: string
}

export const PaymentScreen = observer((props: PaymentScreenProps) => {
  const navigation = useNavigation<PaymentScreenNavigationProp>()
  const route = useRoute<PaymentScreenRouteProp>()
  const { paymentStore } = useStores()

  const [amount, setAmount] = useState(props.amount?.toString() || "")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [selectedProvider, setSelectedProvider] = useState<PaymentProvider | null>(null)
  const [description, setDescription] = useState(props.description || "")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleProviderSelect = (provider: PaymentProvider) => {
    setSelectedProvider(provider)
    // Clear phone number when switching providers
    setPhoneNumber("")
  }

  const validateForm = (): boolean => {
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      Alert.alert("Error", "Please enter a valid amount")
      return false
    }

    if (!selectedProvider) {
      Alert.alert("Error", "Please select a payment provider")
      return false
    }

    if (!phoneNumber) {
      Alert.alert("Error", "Please enter a phone number")
      return false
    }

    if (!description) {
      Alert.alert("Error", "Please enter a payment description")
      return false
    }

    return true
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    setIsSubmitting(true)
    try {
      const result = await paymentStore.initiatePayment(
        Number(amount),
        phoneNumber,
        selectedProvider!,
        description
      )

      if (result.success) {
        navigation.navigate("PaymentStatus", {
          paymentId: paymentStore.currentPayment?.id!
        })
      } else {
        Alert.alert("Error", result.error || "Payment initiation failed")
      }
    } catch (error) {
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "Payment initiation failed"
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatPhoneNumber = (text: string) => {
    // Remove any non-digit characters
    const cleaned = text.replace(/[^0-9]/g, "")
    // Limit to 10 digits
    const truncated = cleaned.slice(0, 10)
    // Format as 077-XXX-XXXX or 075-XXX-XXXX
    if (truncated.length >= 6) {
      return `${truncated.slice(0, 3)}-${truncated.slice(3, 6)}-${truncated.slice(6)}`
    } else if (truncated.length >= 3) {
      return `${truncated.slice(0, 3)}-${truncated.slice(3)}`
    }
    return truncated
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <Text style={styles.title}>Mobile Money Payment</Text>

          <View style={styles.providerContainer}>
            <Text style={styles.label}>Select Provider</Text>
            <View style={styles.providerButtons}>
              <TouchableOpacity
                style={[
                  styles.providerButton,
                  selectedProvider === "MTN" && styles.selectedProvider
                ]}
                onPress={() => handleProviderSelect("MTN")}
              >
                <Text
                  style={[
                    styles.providerText,
                    selectedProvider === "MTN" && styles.selectedProviderText
                  ]}
                >
                  MTN Mobile Money
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.providerButton,
                  selectedProvider === "AIRTEL" && styles.selectedProvider
                ]}
                onPress={() => handleProviderSelect("AIRTEL")}
              >
                <Text
                  style={[
                    styles.providerText,
                    selectedProvider === "AIRTEL" && styles.selectedProviderText
                  ]}
                >
                  Airtel Money
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Amount (UGX)</Text>
            <TextInput
              style={styles.input}
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
              placeholder="Enter amount"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={styles.input}
              value={phoneNumber}
              onChangeText={(text) => setPhoneNumber(formatPhoneNumber(text))}
              keyboardType="phone-pad"
              placeholder={selectedProvider === "MTN" ? "077-XXX-XXXX" : "075-XXX-XXXX"}
              placeholderTextColor="#999"
            />
            {selectedProvider && phoneNumber && (
              <Text style={styles.helperText}>
                {paymentService.validatePhoneNumber(phoneNumber.replace(/-/g, ""), selectedProvider)
                  ? "✓ Valid number"
                  : "✗ Invalid number for selected provider"}
              </Text>
            )}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.descriptionInput]}
              value={description}
              onChangeText={setDescription}
              placeholder="Enter payment description"
              placeholderTextColor="#999"
              multiline
            />
          </View>

          <TouchableOpacity
            style={[styles.submitButton, isSubmitting && styles.disabledButton]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>Pay Now</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
})

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff"
  },
  scrollContent: {
    flexGrow: 1
  },
  content: {
    padding: 20
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 20,
    textAlign: "center"
  },
  providerContainer: {
    marginBottom: 20
  },
  providerButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10
  },
  providerButton: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    marginHorizontal: 5,
    alignItems: "center"
  },
  selectedProvider: {
    backgroundColor: "#4CAF50",
    borderColor: "#4CAF50"
  },
  providerText: {
    color: "#333",
    fontWeight: "600"
  },
  selectedProviderText: {
    color: "#fff"
  },
  inputContainer: {
    marginBottom: 20
  },
  label: {
    fontSize: 16,
    color: "#333",
    marginBottom: 8,
    fontWeight: "600"
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: "#333"
  },
  descriptionInput: {
    height: 80,
    textAlignVertical: "top"
  },
  helperText: {
    marginTop: 4,
    fontSize: 14,
    color: "#666"
  },
  submitButton: {
    backgroundColor: "#4CAF50",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20
  },
  disabledButton: {
    opacity: 0.7
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600"
  }
}) 