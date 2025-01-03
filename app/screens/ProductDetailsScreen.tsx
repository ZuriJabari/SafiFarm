import React, { useState } from "react"
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  Modal
} from "react-native"
import { observer } from "mobx-react-lite"
import { useRoute, useNavigation } from "@react-navigation/native"
import { useStores } from "../models/helpers/useStores"
import { MaterialIcons } from "@expo/vector-icons"
import { PaymentModal } from "../components/PaymentModal"

export const ProductDetailsScreen = observer(() => {
  const route = useRoute<any>()
  const navigation = useNavigation()
  const { marketplaceStore, userStore } = useStores()
  const [showPurchaseModal, setShowPurchaseModal] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [quantity, setQuantity] = useState(1)

  const product = marketplaceStore.getProductById(route.params?.productId)

  if (!product) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Product not found</Text>
      </View>
    )
  }

  const calculateTotalCost = () => {
    return quantity * product.price
  }

  const handlePurchase = async () => {
    try {
      const purchase = {
        id: Date.now().toString(),
        productId: product.id,
        buyerId: userStore.user?.id || "",
        sellerId: product.sellerId,
        quantity,
        totalCost: calculateTotalCost(),
        status: "pending",
        paymentStatus: "pending",
        createdAt: new Date(),
        updatedAt: new Date()
      }

      await marketplaceStore.createPurchase(purchase)
      setShowPurchaseModal(false)
      setShowPaymentModal(true)
    } catch (error) {
      Alert.alert("Error", "Failed to create purchase")
    }
  }

  const handlePaymentComplete = async (success: boolean) => {
    if (success) {
      Alert.alert(
        "Success",
        "Purchase completed successfully",
        [{ text: "OK", onPress: () => navigation.goBack() }]
      )
    }
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.imageContainer}>
        <Image source={{ uri: product.images[0] }} style={styles.image} />
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{product.category}</Text>
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>{product.name}</Text>
            <Text style={styles.category}>{product.category}</Text>
          </View>
          <Text style={styles.price}>${product.price}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description}>{product.description}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Seller Information</Text>
          <View style={styles.sellerInfo}>
            <MaterialIcons name="person" size={24} color="#666" />
            <View style={styles.sellerDetails}>
              <Text style={styles.sellerName}>{product.sellerName}</Text>
              <Text style={styles.sellerLocation}>{product.location}</Text>
            </View>
          </View>
        </View>

        {product.quantity > 0 && (
          <TouchableOpacity
            style={styles.buyButton}
            onPress={() => setShowPurchaseModal(true)}
          >
            <Text style={styles.buyButtonText}>Buy Now</Text>
          </TouchableOpacity>
        )}
      </View>

      <Modal
        visible={showPurchaseModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowPurchaseModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Purchase Details</Text>

            <View style={styles.quantityContainer}>
              <Text style={styles.quantityLabel}>Quantity:</Text>
              <View style={styles.quantityControls}>
                <TouchableOpacity
                  style={styles.quantityButton}
                  onPress={() => setQuantity(Math.max(1, quantity - 1))}
                >
                  <MaterialIcons name="remove" size={24} color="#666" />
                </TouchableOpacity>
                <Text style={styles.quantityValue}>{quantity}</Text>
                <TouchableOpacity
                  style={styles.quantityButton}
                  onPress={() => setQuantity(Math.min(product.quantity, quantity + 1))}
                >
                  <MaterialIcons name="add" size={24} color="#666" />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.costContainer}>
              <Text style={styles.costLabel}>Total Cost:</Text>
              <Text style={styles.costValue}>${calculateTotalCost()}</Text>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowPurchaseModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handlePurchase}
              >
                <Text style={styles.confirmButtonText}>Proceed to Payment</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <PaymentModal
        visible={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        amount={calculateTotalCost()}
        currency="UGX"
        reference={`PROD-${product.id}-${Date.now()}`}
        description={`Purchase of ${quantity}x ${product.name}`}
        onPaymentComplete={handlePaymentComplete}
      />
    </ScrollView>
  )
})

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff"
  },
  imageContainer: {
    width: "100%",
    height: 300,
    position: "relative"
  },
  image: {
    width: "100%",
    height: "100%",
    resizeMode: "cover"
  },
  badge: {
    position: "absolute",
    top: 16,
    right: 16,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20
  },
  badgeText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
    textTransform: "capitalize"
  },
  content: {
    padding: 20
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4
  },
  category: {
    fontSize: 16,
    color: "#666"
  },
  price: {
    fontSize: 24,
    fontWeight: "600",
    color: "#4CAF50"
  },
  section: {
    marginBottom: 24
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 12
  },
  description: {
    fontSize: 16,
    color: "#333",
    lineHeight: 24
  },
  sellerInfo: {
    flexDirection: "row",
    alignItems: "center"
  },
  sellerDetails: {
    marginLeft: 12
  },
  sellerName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333"
  },
  sellerLocation: {
    fontSize: 14,
    color: "#666",
    marginTop: 2
  },
  buyButton: {
    backgroundColor: "#4CAF50",
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: "center"
  },
  buyButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600"
  },
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.5)"
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 20
  },
  quantityContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20
  },
  quantityLabel: {
    fontSize: 16,
    color: "#666"
  },
  quantityControls: {
    flexDirection: "row",
    alignItems: "center"
  },
  quantityButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#f5f5f5",
    justifyContent: "center",
    alignItems: "center"
  },
  quantityValue: {
    fontSize: 18,
    fontWeight: "500",
    color: "#333",
    marginHorizontal: 16
  },
  costContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24
  },
  costLabel: {
    fontSize: 18,
    color: "#333"
  },
  costValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#4CAF50"
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between"
  },
  modalButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: "center"
  },
  cancelButton: {
    backgroundColor: "#f5f5f5",
    marginRight: 8
  },
  confirmButton: {
    backgroundColor: "#4CAF50",
    marginLeft: 8
  },
  cancelButtonText: {
    color: "#666",
    fontSize: 16,
    fontWeight: "600"
  },
  confirmButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600"
  },
  errorText: {
    fontSize: 18,
    color: "#666",
    textAlign: "center",
    marginTop: 50
  }
}) 