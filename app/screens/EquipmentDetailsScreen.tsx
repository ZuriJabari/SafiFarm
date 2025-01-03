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
import DateTimePicker from "@react-native-community/datetimepicker"
import { PaymentModal } from "../components/PaymentModal"

export const EquipmentDetailsScreen = observer(() => {
  const route = useRoute<any>()
  const navigation = useNavigation()
  const { equipmentStore, userStore } = useStores()
  const [showRentalModal, setShowRentalModal] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [isStartDate, setIsStartDate] = useState(true)
  const [startDate, setStartDate] = useState(new Date())
  const [endDate, setEndDate] = useState(new Date(Date.now() + 86400000)) // Tomorrow

  const equipment = equipmentStore.getEquipmentById(route.params?.equipmentId)

  if (!equipment) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Equipment not found</Text>
      </View>
    )
  }

  const calculateTotalCost = () => {
    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    return days * equipment.dailyRate
  }

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false)
    if (selectedDate) {
      if (isStartDate) {
        setStartDate(selectedDate)
        if (selectedDate > endDate) {
          setEndDate(new Date(selectedDate.getTime() + 86400000))
        }
      } else {
        setEndDate(selectedDate)
      }
    }
  }

  const handleRent = async () => {
    try {
      const rental = {
        id: Date.now().toString(),
        equipmentId: equipment.id,
        renterId: userStore.user?.id || "",
        ownerId: equipment.ownerId,
        startDate,
        endDate,
        totalCost: calculateTotalCost(),
        status: "pending",
        paymentStatus: "pending",
        createdAt: new Date(),
        updatedAt: new Date()
      }

      await equipmentStore.createRental(rental)
      setShowRentalModal(false)
      setShowPaymentModal(true)
    } catch (error) {
      Alert.alert("Error", "Failed to create rental request")
    }
  }

  const handlePaymentComplete = async (success: boolean) => {
    if (success) {
      Alert.alert(
        "Success",
        "Rental payment completed successfully",
        [{ text: "OK", onPress: () => navigation.goBack() }]
      )
    }
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.imageContainer}>
        <Image source={{ uri: equipment.images[0] }} style={styles.image} />
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{equipment.condition}</Text>
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>{equipment.name}</Text>
            <Text style={styles.type}>{equipment.type}</Text>
          </View>
          <Text style={styles.rate}>${equipment.dailyRate}/day</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Specifications</Text>
          {Array.from(equipment.specifications.entries()).map(([key, value]) => (
            <View key={key} style={styles.specItem}>
              <Text style={styles.specLabel}>{key}:</Text>
              <Text style={styles.specValue}>{value}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location</Text>
          <Text style={styles.location}>{equipment.location}</Text>
        </View>

        {equipment.availability === "available" && (
          <TouchableOpacity
            style={styles.rentButton}
            onPress={() => setShowRentalModal(true)}
          >
            <Text style={styles.rentButtonText}>Rent Equipment</Text>
          </TouchableOpacity>
        )}
      </View>

      <Modal
        visible={showRentalModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowRentalModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Rental Details</Text>

            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => {
                setIsStartDate(true)
                setShowDatePicker(true)
              }}
            >
              <Text style={styles.dateLabel}>Start Date:</Text>
              <Text style={styles.dateValue}>{startDate.toLocaleDateString()}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => {
                setIsStartDate(false)
                setShowDatePicker(true)
              }}
            >
              <Text style={styles.dateLabel}>End Date:</Text>
              <Text style={styles.dateValue}>{endDate.toLocaleDateString()}</Text>
            </TouchableOpacity>

            <View style={styles.costContainer}>
              <Text style={styles.costLabel}>Total Cost:</Text>
              <Text style={styles.costValue}>${calculateTotalCost()}</Text>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowRentalModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleRent}
              >
                <Text style={styles.confirmButtonText}>Proceed to Payment</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {showDatePicker && (
        <DateTimePicker
          value={isStartDate ? startDate : endDate}
          mode="date"
          display="default"
          minimumDate={isStartDate ? new Date() : startDate}
          onChange={handleDateChange}
        />
      )}

      <PaymentModal
        visible={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        amount={calculateTotalCost()}
        currency="UGX"
        reference={`EQUIP-${equipment.id}-${Date.now()}`}
        description={`Rental of ${equipment.name} from ${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}`}
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
  type: {
    fontSize: 16,
    color: "#666"
  },
  rate: {
    fontSize: 20,
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
  specItem: {
    flexDirection: "row",
    marginBottom: 8
  },
  specLabel: {
    width: 120,
    fontSize: 16,
    color: "#666"
  },
  specValue: {
    flex: 1,
    fontSize: 16,
    color: "#333"
  },
  location: {
    fontSize: 16,
    color: "#333"
  },
  rentButton: {
    backgroundColor: "#4CAF50",
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: "center"
  },
  rentButtonText: {
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
  dateButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0"
  },
  dateLabel: {
    fontSize: 16,
    color: "#666"
  },
  dateValue: {
    fontSize: 16,
    color: "#333",
    fontWeight: "500"
  },
  costContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 20,
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