import React from "react"
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  Easing
} from "react-native"
import { MaterialIcons } from "@expo/vector-icons"

interface PaymentConfirmationProps {
  visible: boolean
  onClose: () => void
  success: boolean
  amount: number
  currency: string
  transactionId: string
  message?: string
}

export const PaymentConfirmation: React.FC<PaymentConfirmationProps> = ({
  visible,
  onClose,
  success,
  amount,
  currency,
  transactionId,
  message
}) => {
  const [animation] = React.useState(new Animated.Value(0))

  React.useEffect(() => {
    if (visible) {
      Animated.timing(animation, {
        toValue: 1,
        duration: 500,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true
      }).start()
    } else {
      animation.setValue(0)
    }
  }, [visible])

  const iconScale = animation.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.3, 1.2, 1]
  })

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.content}>
          <Animated.View
            style={[
              styles.iconContainer,
              {
                transform: [{ scale: iconScale }],
                backgroundColor: success ? "#4CAF50" : "#F44336"
              }
            ]}
          >
            <MaterialIcons
              name={success ? "check" : "close"}
              size={48}
              color="#fff"
            />
          </Animated.View>

          <Text style={styles.status}>
            {success ? "Payment Successful" : "Payment Failed"}
          </Text>

          <View style={styles.amountContainer}>
            <Text style={styles.amountLabel}>Amount Paid</Text>
            <Text style={styles.amount}>
              {currency} {amount.toLocaleString()}
            </Text>
          </View>

          <View style={styles.detailsContainer}>
            <Text style={styles.transactionId}>
              Transaction ID: {transactionId}
            </Text>
            {message && <Text style={styles.message}>{message}</Text>}
          </View>

          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>

          {success && (
            <TouchableOpacity style={styles.downloadButton}>
              <MaterialIcons name="receipt" size={20} color="#4CAF50" />
              <Text style={styles.downloadButtonText}>Download Receipt</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    padding: 20
  },
  content: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    width: "100%",
    maxWidth: 400,
    alignItems: "center"
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24
  },
  status: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 24,
    textAlign: "center"
  },
  amountContainer: {
    alignItems: "center",
    marginBottom: 24
  },
  amountLabel: {
    fontSize: 16,
    color: "#666",
    marginBottom: 8
  },
  amount: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#333"
  },
  detailsContainer: {
    width: "100%",
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#f0f0f0",
    marginBottom: 24,
    alignItems: "center"
  },
  transactionId: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8
  },
  message: {
    fontSize: 14,
    color: "#333",
    textAlign: "center"
  },
  closeButton: {
    backgroundColor: "#4CAF50",
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
    marginBottom: 16
  },
  closeButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600"
  },
  downloadButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12
  },
  downloadButtonText: {
    color: "#4CAF50",
    fontSize: 16,
    fontWeight: "500",
    marginLeft: 8
  }
})
