import React, { useEffect } from "react"
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity
} from "react-native"
import { observer } from "mobx-react-lite"
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native"
import { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { useStores } from "../models/helpers/useStores"
import { AppStackParamList } from "../navigators/AppNavigator"

type PaymentStatusScreenNavigationProp = NativeStackNavigationProp<
  AppStackParamList,
  "PaymentStatus"
>

type PaymentStatusScreenRouteProp = RouteProp<AppStackParamList, "PaymentStatus">

export const PaymentStatusScreen = observer(() => {
  const navigation = useNavigation<PaymentStatusScreenNavigationProp>()
  const route = useRoute<PaymentStatusScreenRouteProp>()
  const { paymentStore } = useStores()

  const payment = paymentStore.getPaymentById(route.params.paymentId)

  useEffect(() => {
    if (payment?.status === "COMPLETED") {
      // Payment completed, you might want to navigate to a success screen
      // or back to the previous screen after a delay
      setTimeout(() => {
        navigation.goBack()
      }, 2000)
    }
  }, [payment?.status])

  if (!payment) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Payment not found</Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.buttonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.statusContainer}>
          {payment.status === "PENDING" ? (
            <>
              <ActivityIndicator size="large" color="#4CAF50" />
              <Text style={styles.statusText}>Processing Payment...</Text>
              <Text style={styles.helperText}>
                Please check your phone for the payment prompt
              </Text>
            </>
          ) : payment.status === "COMPLETED" ? (
            <>
              <View style={styles.successIcon}>
                <Text style={styles.successIconText}>✓</Text>
              </View>
              <Text style={styles.statusText}>Payment Successful!</Text>
              <Text style={styles.helperText}>
                Your payment has been processed successfully
              </Text>
            </>
          ) : (
            <>
              <View style={styles.failureIcon}>
                <Text style={styles.failureIconText}>✗</Text>
              </View>
              <Text style={styles.statusText}>Payment Failed</Text>
              <Text style={styles.errorText}>{payment.error}</Text>
            </>
          )}
        </View>

        <View style={styles.detailsContainer}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Amount:</Text>
            <Text style={styles.detailValue}>
              UGX {payment.amount.toLocaleString()}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Provider:</Text>
            <Text style={styles.detailValue}>{payment.provider}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Phone:</Text>
            <Text style={styles.detailValue}>{payment.phoneNumber}</Text>
          </View>

          {payment.transactionId && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Transaction ID:</Text>
              <Text style={styles.detailValue}>{payment.transactionId}</Text>
            </View>
          )}
        </View>

        {payment.status === "FAILED" && (
          <TouchableOpacity
            style={styles.button}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.buttonText}>Try Again</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  )
})

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff"
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: "center"
  },
  statusContainer: {
    alignItems: "center",
    marginBottom: 40
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#4CAF50",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20
  },
  successIconText: {
    color: "#fff",
    fontSize: 40,
    fontWeight: "bold"
  },
  failureIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#F44336",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20
  },
  failureIconText: {
    color: "#fff",
    fontSize: 40,
    fontWeight: "bold"
  },
  statusText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
    textAlign: "center"
  },
  helperText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 10
  },
  errorText: {
    fontSize: 16,
    color: "#F44336",
    textAlign: "center",
    marginBottom: 10
  },
  detailsContainer: {
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    padding: 20,
    marginBottom: 20
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12
  },
  detailLabel: {
    fontSize: 16,
    color: "#666",
    fontWeight: "600"
  },
  detailValue: {
    fontSize: 16,
    color: "#333",
    fontWeight: "600"
  },
  button: {
    backgroundColor: "#4CAF50",
    padding: 15,
    borderRadius: 8,
    alignItems: "center"
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600"
  }
}) 