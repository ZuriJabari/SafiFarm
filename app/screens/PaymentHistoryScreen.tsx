import React, { useState } from "react"
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl
} from "react-native"
import { observer } from "mobx-react-lite"
import { useStores } from "../models/helpers/useStores"
import { Instance } from "mobx-state-tree"
import { PaymentModel } from "../models/PaymentStore"

type Payment = Instance<typeof PaymentModel>

export const PaymentHistoryScreen = observer(() => {
  const { paymentStore } = useStores()
  const [refreshing, setRefreshing] = useState(false)
  const [filter, setFilter] = useState<"all" | "completed" | "pending" | "failed">("all")

  const filteredPayments = () => {
    switch (filter) {
      case "completed":
        return paymentStore.completedPayments
      case "pending":
        return paymentStore.pendingPayments
      case "failed":
        return paymentStore.failedPayments
      default:
        return paymentStore.payments
    }
  }

  const onRefresh = async () => {
    setRefreshing(true)
    // Implement refresh logic here
    // For example, fetch latest payments from the server
    setRefreshing(false)
  }

  const renderPaymentItem = ({ item }: { item: Payment }) => {
    const statusColors = {
      PENDING: "#FFA500",
      COMPLETED: "#4CAF50",
      FAILED: "#F44336"
    }

    return (
      <View style={styles.paymentItem}>
        <View style={styles.paymentHeader}>
          <Text style={styles.amount}>UGX {item.amount.toLocaleString()}</Text>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: statusColors[item.status] }
            ]}
          >
            <Text style={styles.statusText}>{item.status}</Text>
          </View>
        </View>

        <View style={styles.paymentDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Provider:</Text>
            <Text style={styles.detailValue}>{item.provider}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Phone:</Text>
            <Text style={styles.detailValue}>{item.phoneNumber}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Date:</Text>
            <Text style={styles.detailValue}>
              {new Date(item.timestamp).toLocaleDateString()}
            </Text>
          </View>

          {item.transactionId && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Transaction ID:</Text>
              <Text style={styles.detailValue}>{item.transactionId}</Text>
            </View>
          )}

          <Text style={styles.description} numberOfLines={2}>
            {item.description}
          </Text>
        </View>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterButton, filter === "all" && styles.activeFilter]}
          onPress={() => setFilter("all")}
        >
          <Text
            style={[
              styles.filterText,
              filter === "all" && styles.activeFilterText
            ]}
          >
            All
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterButton,
            filter === "completed" && styles.activeFilter
          ]}
          onPress={() => setFilter("completed")}
        >
          <Text
            style={[
              styles.filterText,
              filter === "completed" && styles.activeFilterText
            ]}
          >
            Completed
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterButton,
            filter === "pending" && styles.activeFilter
          ]}
          onPress={() => setFilter("pending")}
        >
          <Text
            style={[
              styles.filterText,
              filter === "pending" && styles.activeFilterText
            ]}
          >
            Pending
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterButton,
            filter === "failed" && styles.activeFilter
          ]}
          onPress={() => setFilter("failed")}
        >
          <Text
            style={[
              styles.filterText,
              filter === "failed" && styles.activeFilterText
            ]}
          >
            Failed
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredPayments()}
        renderItem={renderPaymentItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No payments found</Text>
          </View>
        }
      />
    </View>
  )
})

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff"
  },
  filterContainer: {
    flexDirection: "row",
    padding: 10,
    backgroundColor: "#f5f5f5"
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginHorizontal: 4,
    alignItems: "center"
  },
  activeFilter: {
    backgroundColor: "#4CAF50"
  },
  filterText: {
    color: "#666",
    fontSize: 14,
    fontWeight: "600"
  },
  activeFilterText: {
    color: "#fff"
  },
  listContent: {
    padding: 16
  },
  paymentItem: {
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
  paymentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12
  },
  amount: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333"
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12
  },
  statusText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600"
  },
  paymentDetails: {
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    padding: 12
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8
  },
  detailLabel: {
    color: "#666",
    fontSize: 14
  },
  detailValue: {
    color: "#333",
    fontSize: 14,
    fontWeight: "500"
  },
  description: {
    color: "#666",
    fontSize: 14,
    marginTop: 8
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center"
  }
})
