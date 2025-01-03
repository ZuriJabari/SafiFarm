import React, { useState } from "react"
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator
} from "react-native"
import { observer } from "mobx-react-lite"
import { useNavigation } from "@react-navigation/native"
import { useStores } from "../models/helpers/useStores"
import { MaterialIcons } from "@expo/vector-icons"

type FilterType = "all" | "available" | "rented"

export const EquipmentScreen = observer(() => {
  const navigation = useNavigation()
  const { equipmentStore } = useStores()
  const [searchQuery, setSearchQuery] = useState("")
  const [filter, setFilter] = useState<FilterType>("all")

  const filteredEquipment = equipmentStore.equipment
    .filter((item) => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.type.toLowerCase().includes(searchQuery.toLowerCase())
      
      if (filter === "all") return matchesSearch
      return matchesSearch && item.availability === filter
    })
    .slice()
    .sort((a, b) => {
      // Sort available equipment first
      if (a.availability === "available" && b.availability !== "available") return -1
      if (a.availability !== "available" && b.availability === "available") return 1
      return 0
    })

  const renderEquipmentItem = ({ item }) => (
    <TouchableOpacity
      style={styles.equipmentCard}
      onPress={() => navigation.navigate("EquipmentDetails", { equipmentId: item.id })}
    >
      <Image
        source={{ uri: item.images[0] }}
        style={styles.equipmentImage}
        defaultSource={require("../assets/icons/equipment-placeholder.png")}
      />
      <View style={styles.equipmentInfo}>
        <Text style={styles.equipmentName}>{item.name}</Text>
        <Text style={styles.equipmentType}>{item.type}</Text>
        <View style={styles.rateContainer}>
          <Text style={styles.rate}>${item.dailyRate}/day</Text>
          <View
            style={[
              styles.availabilityBadge,
              {
                backgroundColor:
                  item.availability === "available"
                    ? "#4CAF50"
                    : item.availability === "rented"
                    ? "#FFA000"
                    : "#757575"
              }
            ]}
          >
            <Text style={styles.availabilityText}>
              {item.availability.charAt(0).toUpperCase() + item.availability.slice(1)}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  )

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <MaterialIcons name="search" size={24} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search equipment..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <View style={styles.filterContainer}>
        {(["all", "available", "rented"] as FilterType[]).map((filterType) => (
          <TouchableOpacity
            key={filterType}
            style={[styles.filterButton, filter === filterType && styles.filterButtonActive]}
            onPress={() => setFilter(filterType)}
          >
            <Text
              style={[
                styles.filterButtonText,
                filter === filterType && styles.filterButtonTextActive
              ]}
            >
              {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {equipmentStore.isLoading ? (
        <ActivityIndicator style={styles.loader} size="large" color="#4CAF50" />
      ) : (
        <FlatList
          data={filteredEquipment}
          renderItem={renderEquipmentItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No equipment found</Text>
            </View>
          }
        />
      )}

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => navigation.navigate("AddEquipment")}
      >
        <MaterialIcons name="add" size={30} color="#fff" />
      </TouchableOpacity>
    </View>
  )
})

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5"
  },
  header: {
    padding: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0"
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    paddingHorizontal: 12
  },
  searchIcon: {
    marginRight: 8
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
    color: "#333"
  },
  filterContainer: {
    flexDirection: "row",
    padding: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0"
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: "#f5f5f5"
  },
  filterButtonActive: {
    backgroundColor: "#4CAF50"
  },
  filterButtonText: {
    color: "#666",
    fontSize: 14,
    fontWeight: "500"
  },
  filterButtonTextActive: {
    color: "#fff"
  },
  listContainer: {
    padding: 16
  },
  equipmentCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  equipmentImage: {
    width: 120,
    height: 120,
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12
  },
  equipmentInfo: {
    flex: 1,
    padding: 12
  },
  equipmentName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4
  },
  equipmentType: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8
  },
  rateContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  rate: {
    fontSize: 16,
    fontWeight: "600",
    color: "#4CAF50"
  },
  availabilityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12
  },
  availabilityText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "500"
  },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center"
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 40
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center"
  },
  addButton: {
    position: "absolute",
    right: 16,
    bottom: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#4CAF50",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5
  }
}) 