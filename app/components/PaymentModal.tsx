import React, { useState } from "react"
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert
} from "react-native"
import { MaterialIcons } from "@expo/vector-icons"
import { paymentService, PaymentRequest } from "../services/PaymentService"

interface PaymentModalProps {
  visible: boolean
  onClose: () => void
  amount: number
  currency?: string
  reference: string
  description: string
  onPaymentComplete: (success: boolean) => void
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  visible,
  onClose,
  amount,
  currency = "UGX",
  reference,
  description,
  onPaymentComplete
}) => {
  const [phoneNumber, setPhoneNumber] = useState("")
  const [provider, setProvider] = useState<"mtn" | "airtel">("mtn")
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<"input" | "processing" | "verification">("input")
  const [transactionId, setTransactionId] = useState<string>()

  const handlePayment = async () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      Alert.alert("Error", "Please enter a valid phone number")
      return
    }

    setLoading(true)
    try {
      const request: PaymentRequest = {
        phoneNumber,
        amount,
        currency,
        provider,
        reference,
        description
      }

      const response = await paymentService.initializePayment(request)
      if (response.success && response.transactionId) {
        setTransactionId(response.transactionId)
        setStep("processing")
        startPolling(response.transactionId)
      } else {
        Alert.alert("Error", response.message)
        setLoading(false)
      }
    } catch (error) {
      Alert.alert("Error", "Failed to initialize payment")
      setLoading(false)
    }
  }

  const startPolling = async (tid: string) => {
    let attempts = 0
    const maxAttempts = 30
    const interval = setInterval(async () => {
      if (attempts >= maxAttempts) {
        clearInterval(interval)
        setStep("input")
        setLoading(false)
        Alert.alert("Error", "Payment verification timeout")
        return
      }

      try {
        const status = await paymentService.checkPaymentStatus(tid, provider)
        if (status.status === "completed") {
          clearInterval(interval)
          const verification = await paymentService.verifyPayment(tid, provider)
          setLoading(false)
          if (verification.success) {
            onPaymentComplete(true)
            onClose()
          } else {
            setStep("input")
            Alert.alert("Error", "Payment verification failed")
          }
        } else if (status.status === "failed") {
          clearInterval(interval)
          setLoading(false)
          setStep("input")
          Alert.alert("Error", "Payment failed")
        }
      } catch (error) {
        console.error("Payment status check error:", error)
      }

      attempts++
    }, 2000)
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Mobile Money Payment</Text>
            <TouchableOpacity onPress={onClose} disabled={loading}>
              <MaterialIcons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          {step === "input" ? (
            <>
              <View style={styles.amountContainer}>
                <Text style={styles.amountLabel}>Amount to Pay</Text>
                <Text style={styles.amount}>
                  {currency} {amount.toLocaleString()}
                </Text>
              </View>

              <View style={styles.providerContainer}>
                <TouchableOpacity
                  style={[
                    styles.providerButton,
                    provider === "mtn" && styles.providerButtonActive
                  ]}
                  onPress={() => setProvider("mtn")}
                >
                  <Text
                    style={[
                      styles.providerText,
                      provider === "mtn" && styles.providerTextActive
                    ]}
                  >
                    MTN Mobile Money
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.providerButton,
                    provider === "airtel" && styles.providerButtonActive
                  ]}
                  onPress={() => setProvider("airtel")}
                >
                  <Text
                    style={[
                      styles.providerText,
                      provider === "airtel" && styles.providerTextActive
                    ]}
                  >
                    Airtel Money
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Phone Number</Text>
                <TextInput
                  style={styles.input}
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  placeholder="Enter your phone number"
                  keyboardType="phone-pad"
                  maxLength={12}
                />
              </View>

              <TouchableOpacity
                style={styles.payButton}
                onPress={handlePayment}
                disabled={loading}
              >
                <Text style={styles.payButtonText}>Pay Now</Text>
              </TouchableOpacity>
            </>
          ) : (
            <View style={styles.processingContainer}>
              <ActivityIndicator size="large" color="#4CAF50" />
              <Text style={styles.processingText}>
                {step === "processing"
                  ? "Processing your payment..."
                  : "Verifying payment..."}
              </Text>
              <Text style={styles.processingSubtext}>
                Please check your phone for the payment prompt
              </Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.5)"
  },
  content: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333"
  },
  amountContainer: {
    alignItems: "center",
    marginBottom: 24
  },
  amountLabel: {
    fontSize: 16,
    color: "#666",
    marginBottom: 4
  },
  amount: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#4CAF50"
  },
  providerContainer: {
    flexDirection: "row",
    marginBottom: 24
  },
  providerButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: "#f5f5f5",
    marginHorizontal: 4,
    alignItems: "center"
  },
  providerButtonActive: {
    backgroundColor: "#4CAF50"
  },
  providerText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#666"
  },
  providerTextActive: {
    color: "#fff"
  },
  inputGroup: {
    marginBottom: 24
  },
  label: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
    marginBottom: 8
  },
  input: {
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    color: "#333"
  },
  payButton: {
    backgroundColor: "#4CAF50",
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: "center"
  },
  payButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600"
  },
  processingContainer: {
    alignItems: "center",
    paddingVertical: 32
  },
  processingText: {
    fontSize: 18,
    fontWeight: "500",
    color: "#333",
    marginTop: 16,
    marginBottom: 8
  },
  processingSubtext: {
    fontSize: 14,
    color: "#666",
    textAlign: "center"
  }
}) 