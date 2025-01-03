import React, { useEffect, useState } from "react"
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator
} from "react-native"
import { MaterialIcons } from "@expo/vector-icons"
import { TransactionStatus } from "../services/PaymentService"
import { formatDate } from "../utils/dateUtils"

interface PaymentHistoryProps {
  onRetry?: (transactionId: string, provider: "MTN" | "AIRTEL") => void
}

export const PaymentHistory: React.FC<PaymentHistoryProps> = ({ onRetry }) => {
  const [transactions, setTransactions] = useState<TransactionStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchTransactions = async () => {
    try {
      const response = await fetch("/api/transactions/")
      const data = await response.json()
      setTransactions(data)
    } catch (error) {
      console.error("Error fetching transactions:", error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchTransactions()
  }, [])

  const onRefresh = () => {
    setRefreshing(true)
    fetchTransactions()
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return "#4CAF50"
      case "failed":
        return "#F44336"
      default:
        return "#FFC107"
    }
  }

  const renderItem = ({ item }: { item: TransactionStatus }) => (
    <View style={styles.transactionItem}>
      <View style={styles.transactionHeader}>
        <View style={styles.amountContainer}>
          <Text style={styles.amount}>
            {item.currency} {item.amount.toLocaleString()}
          </Text>
          <Text style={styles.date}>{formatDate(item.timestamp)}</Text>
        </View>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(item.status) }
          ]}
        >
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>
      
      <View style={styles.transactionDetails}>
        <Text style={styles.transactionId}>ID: {item.transactionId}</Text>
        <Text style={styles.message}>{item.message}</Text>
      </View>

      {item.status === "FAILED" && onRetry && (
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => onRetry(item.transactionId, item.provider)}
        >
          <MaterialIcons name="refresh" size={16} color="#fff" />
          <Text style={styles.retryText}>Retry Payment</Text>
        </TouchableOpacity>
      )}
    </View>
  )

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    )
  }

  return (
    <FlatList
      data={transactions}
      renderItem={renderItem}
      keyExtractor={(item) => item.transactionId}
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <MaterialIcons name="payment" size={48} color="#ccc" />
          <Text style={styles.emptyText}>No transactions yet</Text>
        </View>
      }
    />
  )
}

const styles = StyleSheet.create({
  container: {
    padding: 16
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center"
  },
  transactionItem: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4
  },
  transactionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12
  },
  amountContainer: {
    flex: 1
  },
  amount: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333"
  },
  date: {
    fontSize: 14,
    color: "#666",
    marginTop: 4
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginLeft: 12
  },
  statusText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600"
  },
  transactionDetails: {
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    paddingTop: 12
  },
  transactionId: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4
  },
  message: {
    fontSize: 14,
    color: "#333"
  },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#4CAF50",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 12
  },
  retryText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 8
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 32
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
    marginTop: 12
  }
})
